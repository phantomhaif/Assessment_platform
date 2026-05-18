import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { validateCode } from "@/lib/verification-codes"
import { normalizeOrganizationName } from "@/lib/organizations"
import { createNotifications } from "@/lib/notifications"
import { NotificationType, UserRole } from "@prisma/client"

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  firstName: z.string().min(1, "Введите имя"),
  lastName: z.string().min(1, "Введите фамилию"),
  middleName: z.string().optional(),
  organization: z.string().optional(),
  organizationId: z.string().optional(),
  phone: z.string().optional(),
  agreedToTerms: z.boolean().refine(val => val === true, "Необходимо принять условия"),
  agreedToDataProcessing: z.boolean().refine(val => val === true, "Необходимо дать согласие на обработку данных"),
  verificationCode: z.string().length(6, "Введите 6-значный код"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    // Validate verification code
    const isCodeValid = validateCode(validatedData.email, validatedData.verificationCode)
    if (!isCodeValid) {
      return NextResponse.json(
        { error: "Неверный или истёкший код подтверждения" },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    const organizationName = normalizeOrganizationName(validatedData.organization)
    let organizationId = validatedData.organizationId || null
    let createdPendingOrganization: { id: string; name: string } | null = null

    if (organizationName) {
      if (organizationId) {
        const selectedOrganization = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { id: true, name: true },
        })

        organizationId = selectedOrganization?.id || null
      }

      if (!organizationId) {
        const existingOrganization = await prisma.organization.findFirst({
          where: {
            name: {
              equals: organizationName,
              mode: "insensitive",
            },
          },
          select: { id: true, name: true },
        })

        if (existingOrganization) {
          organizationId = existingOrganization.id
        } else {
          const organization = await prisma.organization.create({
            data: {
              name: organizationName,
              isApproved: false,
            },
            select: { id: true, name: true },
          })

          organizationId = organization.id
          createdPendingOrganization = organization
        }
      }
    }

    // Создаём пользователя с подтверждённым email
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        middleName: validatedData.middleName,
        organization: organizationName,
        organizationId,
        phone: validatedData.phone,
        agreedToTerms: validatedData.agreedToTerms,
        agreedToDataProcessing: validatedData.agreedToDataProcessing,
        emailVerified: new Date(), // Email verified via code
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    })

    if (createdPendingOrganization) {
      try {
        const admins = await prisma.user.findMany({
          where: {
            role: {
              in: [UserRole.ADMIN, UserRole.ORGANIZER],
            },
          },
          select: { id: true },
        })

        await createNotifications(
          admins.map((admin) => ({
            userId: admin.id,
            title: "Новая организация на модерации",
            message: `Пользователь ${user.lastName} ${user.firstName} указал новую организацию "${createdPendingOrganization.name}" при регистрации.`,
            link: "/admin/organizations",
            type: NotificationType.WARNING,
          }))
        )
      } catch (error) {
        console.error("Error creating organization moderation notifications:", error)
      }
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Ошибка регистрации" },
      { status: 500 }
    )
  }
}
