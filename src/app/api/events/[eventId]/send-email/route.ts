import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params
    const { subject, bodyRu, bodyEn } = await req.json()

    if (!subject || !bodyRu) {
      return NextResponse.json({ error: "subject and bodyRu are required" }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get all approved participants
    const applications = await prisma.application.findMany({
      where: {
        eventId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    })

    if (applications.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const recipients = applications.map((a) => a.user.email)

    const html = buildBilingualEmail({
      eventName: event.name,
      bodyRu,
      bodyEn: bodyEn || "",
    })

    // Send to all recipients
    await sendEmail({ to: recipients, subject, html })

    return NextResponse.json({ sent: recipients.length })
  } catch (error) {
    console.error("Error sending mass email:", error)
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}

function buildBilingualEmail({
  eventName,
  bodyRu,
  bodyEn,
}: {
  eventName: string
  bodyRu: string
  bodyEn: string
}) {
  const ruSection = `
    <div style="margin-bottom: 32px;">
      <div style="display: inline-block; background: #f1f5f9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #64748b; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px;">
        🇷🇺 РУССКИЙ
      </div>
      <div style="color: #1e293b; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(bodyRu)}</div>
    </div>
  `

  const enSection = bodyEn ? `
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <div>
      <div style="display: inline-block; background: #f1f5f9; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #64748b; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px;">
        🇬🇧 ENGLISH
      </div>
      <div style="color: #1e293b; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(bodyEn)}</div>
    </div>
  ` : ""

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #f8fafc;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; border-radius: 12px 12px 0 0;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; background: #C41E3A; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span style="color: white; font-weight: bold; font-size: 18px;">IS</span>
          </div>
          <div>
            <div style="color: white; font-size: 20px; font-weight: bold;">Industry Skills</div>
            <div style="color: #94a3b8; font-size: 13px;">${escapeHtml(eventName)}</div>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        ${ruSection}
        ${enSection}
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
