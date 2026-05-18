import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { EventStatus } from "@prisma/client"
import { isAdmin } from "@/lib/authz"

const createEventSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  competency: z.string().min(1, "Компетенция обязательна"),
  competencyEn: z.string().optional(),
  eventFormat: z.enum(["ONLINE", "OFFLINE"]).default("OFFLINE"),
  location: z.string().optional(),
  registrationStart: z.string(),
  registrationEnd: z.string(),
  eventStart: z.string(),
  eventEnd: z.string(),
  maxTeamSize: z.number().int().positive().default(4),
  minTeamSize: z.number().int().positive().default(1),
  organizerIds: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    const role = session?.user?.role
    const userId = session?.user?.id

    const publishedFilter = {
      status: {
        in: [
          EventStatus.REGISTRATION_OPEN,
          EventStatus.REGISTRATION_CLOSED,
          EventStatus.IN_PROGRESS,
          EventStatus.SCORING,
          EventStatus.RESULTS_PUBLISHED,
        ],
      },
    }

    // ADMIN sees everything. ORGANIZER sees published events plus the events
    // they are assigned to organize (so drafts of their own commercial events
    // remain visible to them). Everyone else only sees published events.
    let where: Record<string, unknown>
    if (isAdmin(role)) {
      where = {}
    } else if (role === "ORGANIZER" && userId) {
      where = {
        OR: [publishedFilter, { organizers: { some: { id: userId } } }],
      }
    } else {
      where = publishedFilter
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        ...(session?.user?.id
          ? {
              applications: {
                where: { userId: session.user.id },
                select: {
                  status: true,
                  requestedRole: true,
                  approvedRole: true,
                },
                take: 1,
              },
            }
          : {}),
        _count: {
          select: {
            teams: true,
            applications: true,
          },
        },
        assessmentSchema: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { eventStart: "asc" },
    })

    return NextResponse.json(
      events.map((event) => ({
        ...event,
        currentApplication: Array.isArray((event as { applications?: unknown[] }).applications)
          ? (event as { applications?: unknown[] }).applications?.[0] ?? null
          : null,
        applications: undefined,
      }))
    )
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Только админы и организаторы могут создавать мероприятия
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = createEventSchema.parse(body)

    // Only the admin may assign arbitrary organizers. An organizer who creates
    // an event is automatically attached as its organizer so they keep access.
    const organizerIds = new Set<string>()
    if (isAdmin(session.user.role) && Array.isArray(validatedData.organizerIds)) {
      for (const id of validatedData.organizerIds) organizerIds.add(id)
    }
    if (session.user.role === "ORGANIZER") {
      organizerIds.add(session.user.id)
    }

    const event = await prisma.event.create({
      data: {
        name: validatedData.name,
        nameEn: validatedData.nameEn || null,
        description: validatedData.description,
        descriptionEn: validatedData.descriptionEn || null,
        competency: validatedData.competency,
        competencyEn: validatedData.competencyEn || null,
        eventFormat: validatedData.eventFormat,
        location: validatedData.location || null,
        registrationStart: new Date(validatedData.registrationStart),
        registrationEnd: new Date(validatedData.registrationEnd),
        eventStart: new Date(validatedData.eventStart),
        eventEnd: new Date(validatedData.eventEnd),
        maxTeamSize: validatedData.maxTeamSize,
        minTeamSize: validatedData.minTeamSize,
        ...(organizerIds.size > 0
          ? { organizers: { connect: [...organizerIds].map((id) => ({ id })) } }
          : {}),
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation error" }, { status: 400 })
    }
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
