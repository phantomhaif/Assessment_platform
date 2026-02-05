import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  firstName: z.string().min(1, "Введите имя"),
  lastName: z.string().min(1, "Введите фамилию"),
  middleName: z.string().optional(),
  organization: z.string().optional(),
  phone: z.string().optional(),
  agreedToTerms: z.boolean().refine(val => val === true, "Необходимо принять условия"),
  agreedToDataProcessing: z.boolean().refine(val => val === true, "Необходимо дать согласие на обработку данных"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Создаём пользователя
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        middleName: validatedData.middleName,
        organization: validatedData.organization,
        phone: validatedData.phone,
        agreedToTerms: validatedData.agreedToTerms,
        agreedToDataProcessing: validatedData.agreedToDataProcessing,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
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
