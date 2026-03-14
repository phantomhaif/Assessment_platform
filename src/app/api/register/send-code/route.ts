import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateCode, storeCode } from "@/lib/verification-codes"
import { isEmailConfigured, sendRegistrationCode } from "@/lib/email"

const emailSchema = z.object({
  email: z.string().email("Некорректный email"),
  firstName: z.string().min(1, "Введите имя"),
  lastName: z.string().min(1, "Введите фамилию"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, firstName } = emailSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      )
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "email_not_configured" },
        { status: 503 }
      )
    }

    // Generate and store code
    const code = generateCode()
    storeCode(email.toLowerCase(), code)

    // Send verification email
    await sendRegistrationCode(email, code, firstName)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }
    console.error("Send code error:", error)
    return NextResponse.json(
      { error: "Ошибка отправки кода" },
      { status: 500 }
    )
  }
}
