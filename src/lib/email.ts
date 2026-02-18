import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM || "Industry Skills <onboarding@resend.dev>"

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[]
  subject: string
  html: string
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping email send")
    return
  }

  const recipients = Array.isArray(to) ? to : [to]

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject,
    html,
  })

  if (result.error) {
    console.error("Resend error:", result.error)
    throw new Error(result.error.message)
  }

  console.log("Email sent successfully:", result.data?.id)
}

export async function sendVerificationCode(email: string, code: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #C41E3A; border-radius: 12px; margin-bottom: 16px;">
          <span style="color: white; font-weight: bold; font-size: 20px;">IS</span>
        </div>
        <h2 style="margin: 0; color: #0f172a; font-size: 22px;">Industry Skills Platform</h2>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
        <p style="color: #64748b; margin-top: 0;">Ваш код подтверждения входа / Your login verification code:</p>
        <div style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #C41E3A; margin: 16px 0;">${code}</div>
        <p style="color: #64748b; margin-bottom: 0; font-size: 14px;">
          Код действителен 10 минут / Code is valid for 10 minutes
        </p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
        Если вы не запрашивали код, проигнорируйте это письмо.<br/>
        If you did not request this code, ignore this email.
      </p>
    </div>
  `
  await sendEmail({ to: email, subject: "Код подтверждения / Verification Code — Industry Skills", html })
}
