import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        assessmentSchema: {
          include: {
            modules: {
              orderBy: {
                order: "asc",
              },
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        teams: {
          orderBy: [{ number: "asc" }, { name: "asc" }],
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            files: {
              orderBy: {
                createdAt: "desc",
              },
              include: {
                uploadedBy: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        nameEn: event.nameEn,
        competency: event.competency,
        competencyEn: event.competencyEn,
        status: event.status,
        eventStart: event.eventStart,
        eventEnd: event.eventEnd,
      },
      modules: event.assessmentSchema?.modules ?? [],
      teams: event.teams,
    })
  } catch (error) {
    console.error("Error fetching admin team files:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
