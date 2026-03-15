import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderEmailBrandHeader, sendEmail } from "@/lib/email"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: protocolId } = await params

    // Get protocol info
    const protocol = await prisma.protocol.findUnique({
      where: { id: protocolId },
      select: {
        title: true,
        event: {
          select: { name: true },
        },
      },
    })

    if (!protocol) {
      return NextResponse.json({ error: "Protocol not found" }, { status: 404 })
    }

    // Get all assigned users
    const assignments = await prisma.protocolAssignment.findMany({
      where: { protocolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Get users who have already signed
    const signatures = await prisma.protocolSignature.findMany({
      where: { protocolId },
      select: { userId: true },
    })

    const signedUserIds = new Set(signatures.map(s => s.userId))

    // Filter unsigned users
    const unsignedUsers = assignments
      .filter(a => !signedUserIds.has(a.user.id))
      .map(a => a.user)

    if (unsignedUsers.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    // Send reminder emails
    const recipients = unsignedUsers.map(u => u.email)

    const subject = `Напоминание: Подпишите протокол "${protocol.title}"`
    const html = buildReminderEmail({
      eventName: protocol.event.name,
      protocolTitle: protocol.title,
      protocolId,
    })

    await sendEmail({ to: recipients, subject, html })

    return NextResponse.json({ sent: recipients.length })
  } catch (error) {
    console.error("Error sending reminder:", error)
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 })
  }
}

function buildReminderEmail({
  eventName,
  protocolTitle,
  protocolId,
}: {
  eventName: string
  protocolTitle: string
  protocolId: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL || ""
  const protocolUrl = `${baseUrl}/regulations/${protocolId}`

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #f8fafc;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; border-radius: 12px 12px 0 0;">
        ${renderEmailBrandHeader(escapeHtml(eventName), "dark")}
      </div>

      <!-- Body -->
      <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px 0;">Напоминание о подписании протокола</h2>

        <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
          Вам необходимо ознакомиться и подписать протокол:
        </p>

        <div style="background: #f8fafc; border-left: 4px solid #C41E3A; padding: 16px; margin: 0 0 24px 0;">
          <p style="margin: 0; color: #1e293b; font-weight: 600;">${escapeHtml(protocolTitle)}</p>
        </div>

        <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
          Пожалуйста, перейдите по ссылке ниже для просмотра и подписания протокола:
        </p>

        <a href="${protocolUrl}" style="display: inline-block; background: #C41E3A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Перейти к протоколу
        </a>

        <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0 0;">
          Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br/>
          <a href="${protocolUrl}" style="color: #C41E3A;">${protocolUrl}</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
        Industry Skills Platform &copy; 2026
      </div>
    </div>
  `
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
