import nodemailer from "nodemailer"
import { Resend } from "resend"

type EmailPayload = {
  to: string | string[]
  subject: string
  html: string
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = process.env.SMTP_SECURE === "true"
const smtpFromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || ""
const smtpConfigured = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    smtpFromEmail
)

const smtpTransport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

const resendFromEmail = process.env.EMAIL_FROM || smtpFromEmail || "Industry Skills <onboarding@resend.dev>"
const publicBaseUrl = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "")
const brandLogoUrl = publicBaseUrl ? `${publicBaseUrl}/logo.png` : ""

export function isEmailConfigured() {
  return Boolean(resend || smtpTransport)
}

export function renderEmailBrandHeader(subtitle?: string, theme: "light" | "dark" = "light") {
  const logo = brandLogoUrl
    ? `<img src="${brandLogoUrl}" alt="Industry Skills" width="56" height="56" style="display:block; width:56px; height:56px; object-fit:contain; margin:0 auto 16px;" />`
    : `<div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #C41E3A; border-radius: 12px; margin-bottom: 16px;"><span style="color: white; font-weight: bold; font-size: 20px;">IS</span></div>`
  const titleColor = theme === "dark" ? "#ffffff" : "#0f172a"
  const subtitleColor = theme === "dark" ? "#94a3b8" : "#64748b"

  return `
    <div style="text-align: center; margin-bottom: 24px;">
      ${logo}
      <h2 style="margin: 0; color: ${titleColor}; font-size: 22px;">Industry Skills Platform</h2>
      ${subtitle ? `<p style="margin: 8px 0 0; color: ${subtitleColor}; font-size: 14px;">${subtitle}</p>` : ""}
    </div>
  `
}

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to]
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

async function sendViaResend({ to, subject, html }: EmailPayload) {
  if (!resend) {
    throw new Error("Resend is not configured")
  }

  const result = await resend.emails.send({
    from: resendFromEmail,
    to: normalizeRecipients(to),
    subject,
    html,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  console.log("Email sent via Resend:", result.data?.id)
}

async function sendViaSmtp({ to, subject, html }: EmailPayload) {
  if (!smtpTransport || !smtpFromEmail) {
    throw new Error("SMTP is not configured")
  }

  const info = await smtpTransport.sendMail({
    from: smtpFromEmail,
    to: normalizeRecipients(to).join(", "),
    subject,
    html,
  })

  console.log("Email sent via SMTP:", info.messageId)
}

export async function sendEmail(payload: EmailPayload) {
  const providerErrors: string[] = []

  if (resend) {
    try {
      await sendViaResend(payload)
      return
    } catch (error) {
      const message = getErrorMessage(error)
      providerErrors.push(`Resend: ${message}`)
      console.warn("Resend send failed, trying SMTP fallback:", message)
    }
  }

  if (smtpTransport) {
    try {
      await sendViaSmtp(payload)
      return
    } catch (error) {
      const message = getErrorMessage(error)
      providerErrors.push(`SMTP: ${message}`)
      console.error("SMTP send failed:", message)
    }
  }

  if (providerErrors.length > 0) {
    throw new Error(`All email providers failed. ${providerErrors.join(" | ")}`)
  }

  throw new Error("Email provider is not configured")
}

export async function sendVerificationCode(email: string, code: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      ${renderEmailBrandHeader()}
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

  await sendEmail({
    to: email,
    subject: "Код подтверждения / Verification Code - Industry Skills",
    html,
  })
}

export async function sendRegistrationCode(email: string, code: string, firstName: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      ${renderEmailBrandHeader()}
      <p style="color: #334155; margin-bottom: 16px;">
        Здравствуйте, ${firstName}! / Hello, ${firstName}!
      </p>
      <p style="color: #64748b; margin-bottom: 24px;">
        Для завершения регистрации введите код подтверждения:<br/>
        To complete registration, enter the verification code:
      </p>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
        <div style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #C41E3A; margin: 16px 0;">${code}</div>
        <p style="color: #64748b; margin-bottom: 0; font-size: 14px;">
          Код действителен 10 минут / Code is valid for 10 minutes
        </p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
        Если вы не регистрировались, проигнорируйте это письмо.<br/>
        If you did not register, ignore this email.
      </p>
    </div>
  `

  await sendEmail({
    to: email,
    subject: "Подтверждение регистрации / Registration Verification - Industry Skills",
    html,
  })
}
