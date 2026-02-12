import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { EventStatus } from "@prisma/client"

const createEventSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  competency: z.string().min(1, "Компетенция обязательна"),
  registrationStart: z.string(),
  registrationEnd: z.string(),
  eventStart: z.string(),
  eventEnd: z.string(),
  maxTeamSize: z.number().int().positive().default(4),
  minTeamSize: z.number().int().positive().default(1),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER"

    // Для обычных пользователей показываем только опубликованные мероприятия
    const where = isAdmin
      ? {}
      : {
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

    const events = await prisma.event.findMany({
      where,
      include: {
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

    return NextResponse.json(events)
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

    const event = await prisma.event.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        competency: validatedData.competency,
        registrationStart: new Date(validatedData.registrationStart),
        registrationEnd: new Date(validatedData.registrationEnd),
        eventStart: new Date(validatedData.eventStart),
        eventEnd: new Date(validatedData.eventEnd),
        maxTeamSize: validatedData.maxTeamSize,
        minTeamSize: validatedData.minTeamSize,
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
