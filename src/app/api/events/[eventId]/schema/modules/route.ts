import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const moduleSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

// GET all modules for an event's schema
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    const schema = await prisma.assessmentSchema.findUnique({
      where: { eventId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            subCriteria: {
              orderBy: { order: "asc" },
              include: {
                criteria: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    })

    if (!schema) {
      return NextResponse.json({ modules: [] })
    }

    return NextResponse.json({ modules: schema.modules })
  } catch (error) {
    console.error("Error fetching modules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - create a new module
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params
    const body = await req.json()
    const data = moduleSchema.parse(body)

    // Get or create schema
    let schema = await prisma.assessmentSchema.findUnique({
      where: { eventId },
    })

    if (!schema) {
      // Create schema with default skill groups
      const defaultSkillGroups = [
        { number: 1, name: "Организация рабочего процесса", nameEn: "Workflow organization" },
        { number: 2, name: "Командное взаимодействие и коммуникация", nameEn: "Team interaction and communication" },
        { number: 3, name: "Менеджмент", nameEn: "Management" },
        { number: 4, name: "Аналитика данных", nameEn: "Data Analytics" },
        { number: 5, name: "Экономико-математическое моделирование", nameEn: "Economic and mathematical modeling" },
        { number: 6, name: "Оптимизация, автоматизация и роботизация", nameEn: "Optimization, automation and robotization" },
        { number: 7, name: "Основы механики, электроники и робототехники", nameEn: "Mechanics, electronics and robotics fundamentals" },
        { number: 8, name: "Моделирование и симуляция производственных процессов", nameEn: "Production process modeling and simulation" },
        { number: 9, name: "Высокотехнологические навыки", nameEn: "Hi-tech skills" },
      ]

      schema = await prisma.assessmentSchema.create({
        data: {
          eventId,
          name: "Manual Schema",
          totalMaxScore: 0,
          skillGroups: {
            create: defaultSkillGroups.map(sg => ({
              ...sg,
              maxScore: 0,
            })),
          },
        },
      })
    }

    // Get max order
    const maxOrderModule = await prisma.assessmentModule.findFirst({
      where: { schemaId: schema.id },
      orderBy: { order: "desc" },
    })

    const module = await prisma.assessmentModule.create({
      data: {
        schemaId: schema.id,
        code: data.code,
        name: data.name,
        nameEn: data.nameEn || null,
        maxScore: 0,
        order: data.order ?? (maxOrderModule?.order ?? -1) + 1,
      },
    })

    return NextResponse.json({ module })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating module:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
