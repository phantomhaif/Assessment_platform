import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createProtocolSchema = z.object({
  eventId: z.string(),
  title: z.string().min(1, "Название обязательно"),
  titleEn: z.string().optional(),
  content: z.string().min(1, "Содержание обязательно"),
  contentEn: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    const protocols = await prisma.protocol.findMany({
      where: { eventId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            signatures: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      protocols.map((protocol) => ({
        ...protocol,
        eventName: protocol.event.name,
      }))
    )
  } catch (error) {
    console.error("Error fetching protocols:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = createProtocolSchema.parse(body)

    const protocol = await prisma.protocol.create({
      data: {
        eventId: validatedData.eventId,
        title: validatedData.title,
        titleEn: validatedData.titleEn || null,
        content: validatedData.content,
        contentEn: validatedData.contentEn || null,
      },
    })

    return NextResponse.json(protocol, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }
    console.error("Error creating protocol:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
