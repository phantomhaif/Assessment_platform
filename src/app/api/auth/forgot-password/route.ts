import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateResetToken, storeResetToken } from "@/lib/reset-tokens"
import { renderEmailBrandHeader, sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Введите email" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, firstName: true },
    })

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const token = generateResetToken()
    storeResetToken(token, user.email)

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        ${renderEmailBrandHeader()}
        <p style="color: #334155;">Здравствуйте, ${user.firstName}!</p>
        <p style="color: #64748b;">
          Вы запросили сброс пароля. Нажмите кнопку ниже, чтобы создать новый пароль.<br/>
          You requested a password reset. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: #C41E3A; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Сбросить пароль / Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">
          Ссылка действительна 1 час / Link is valid for 1 hour<br/>
          Если вы не запрашивали сброс пароля, проигнорируйте это письмо.<br/>
          If you did not request a password reset, ignore this email.
        </p>
      </div>
    `

    await sendEmail({
      to: user.email,
      subject: "Сброс пароля / Password Reset - Industry Skills",
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
