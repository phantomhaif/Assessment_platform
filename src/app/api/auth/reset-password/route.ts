import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { consumeResetToken } from "@/lib/reset-tokens"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Недостаточно данных" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 6 символов" },
        { status: 400 }
      )
    }

    const email = consumeResetToken(token)
    if (!email) {
      return NextResponse.json(
        { error: "Ссылка для сброса пароля недействительна или истекла" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
