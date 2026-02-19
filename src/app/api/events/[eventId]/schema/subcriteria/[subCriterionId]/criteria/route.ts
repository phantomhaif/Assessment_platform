import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const judgementOptionSchema = z.object({
  score: z.number(),
  label: z.string(),
})

const criterionSchema = z.object({
  type: z.enum(["M", "J"]),
  description: z.string().min(1),
  verificationMethod: z.string().optional(),
  maxScore: z.number().min(0),
  skillGroupNumber: z.number().int().min(1).max(9).optional(),
  judgementOptions: z.array(judgementOptionSchema).optional(),
  order: z.number().int().min(0).optional(),
})

// POST - create criterion
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; subCriterionId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId, subCriterionId } = await params
    const body = await req.json()
    const data = criterionSchema.parse(body)

    // Find skill group if provided
    let skillGroupId: string | null = null
    if (data.skillGroupNumber) {
      const schema = await prisma.assessmentSchema.findUnique({
        where: { eventId },
        include: { skillGroups: true },
      })
      const skillGroup = schema?.skillGroups.find(sg => sg.number === data.skillGroupNumber)
      skillGroupId = skillGroup?.id || null
    }

    // Get max order
    const maxOrderCrit = await prisma.criterion.findFirst({
      where: { subCriterionId },
      orderBy: { order: "desc" },
    })

    const criterion = await prisma.criterion.create({
      data: {
        subCriterionId,
        skillGroupId,
        type: data.type,
        description: data.description,
        verificationMethod: data.verificationMethod || null,
        maxScore: data.maxScore,
        judgementOptions: data.type === "J" && data.judgementOptions
          ? data.judgementOptions
          : [],
        order: data.order ?? (maxOrderCrit?.order ?? -1) + 1,
      },
    })

    // Recalculate module and schema scores
    await recalculateScores(eventId)

    return NextResponse.json({ criterion })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating criterion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function recalculateScores(eventId: string) {
  const schema = await prisma.assessmentSchema.findUnique({
    where: { eventId },
    include: {
      modules: {
        include: {
          subCriteria: {
            include: { criteria: true },
          },
        },
      },
      skillGroups: {
        include: { criteria: true },
      },
    },
  })

  if (!schema) return

  let totalMaxScore = 0

  // Update each module's maxScore
  for (const module of schema.modules) {
    let moduleMax = 0
    for (const sub of module.subCriteria) {
      for (const crit of sub.criteria) {
        moduleMax += crit.maxScore
      }
    }
    await prisma.assessmentModule.update({
      where: { id: module.id },
      data: { maxScore: moduleMax },
    })
    totalMaxScore += moduleMax
  }

  // Update each skill group's maxScore
  for (const sg of schema.skillGroups) {
    const sgMax = sg.criteria.reduce((sum, c) => sum + c.maxScore, 0)
    await prisma.skillGroup.update({
      where: { id: sg.id },
      data: { maxScore: sgMax },
    })
  }

  // Update schema total
  await prisma.assessmentSchema.update({
    where: { id: schema.id },
    data: { totalMaxScore },
  })
}
