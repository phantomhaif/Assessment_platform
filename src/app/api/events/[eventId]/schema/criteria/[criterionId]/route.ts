import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const judgementOptionSchema = z.object({
  score: z.number(),
  label: z.string(),
})

const updateCriterionSchema = z.object({
  type: z.enum(["M", "J"]).optional(),
  description: z.string().min(1).optional(),
  verificationMethod: z.string().optional(),
  maxScore: z.number().min(0).optional(),
  skillGroupNumber: z.number().int().min(1).max(9).optional().nullable(),
  judgementOptions: z.array(judgementOptionSchema).optional(),
  order: z.number().int().min(0).optional(),
})

// GET single criterion
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; criterionId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { criterionId } = await params

    const criterion = await prisma.criterion.findUnique({
      where: { id: criterionId },
      include: { skillGroup: true },
    })

    if (!criterion) {
      return NextResponse.json({ error: "Criterion not found" }, { status: 404 })
    }

    return NextResponse.json({ criterion })
  } catch (error) {
    console.error("Error fetching criterion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - update criterion
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; criterionId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId, criterionId } = await params
    const body = await req.json()
    const data = updateCriterionSchema.parse(body)

    // Find skill group if provided
    let skillGroupId: string | null | undefined = undefined
    if (data.skillGroupNumber !== undefined) {
      if (data.skillGroupNumber === null) {
        skillGroupId = null
      } else {
        const schema = await prisma.assessmentSchema.findUnique({
          where: { eventId },
          include: { skillGroups: true },
        })
        const skillGroup = schema?.skillGroups.find(sg => sg.number === data.skillGroupNumber)
        skillGroupId = skillGroup?.id || null
      }
    }

    const updateData: Record<string, unknown> = {}
    if (data.type !== undefined) updateData.type = data.type
    if (data.description !== undefined) updateData.description = data.description
    if (data.verificationMethod !== undefined) updateData.verificationMethod = data.verificationMethod || null
    if (data.maxScore !== undefined) updateData.maxScore = data.maxScore
    if (skillGroupId !== undefined) updateData.skillGroupId = skillGroupId
    if (data.judgementOptions !== undefined) updateData.judgementOptions = data.judgementOptions
    if (data.order !== undefined) updateData.order = data.order

    const criterion = await prisma.criterion.update({
      where: { id: criterionId },
      data: updateData,
    })

    // Recalculate scores
    await recalculateScores(eventId)

    return NextResponse.json({ criterion })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Error updating criterion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE criterion
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; criterionId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId, criterionId } = await params

    await prisma.criterion.delete({
      where: { id: criterionId },
    })

    // Recalculate scores
    await recalculateScores(eventId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting criterion:", error)
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

  for (const sg of schema.skillGroups) {
    const sgMax = sg.criteria.reduce((sum, c) => sum + c.maxScore, 0)
    await prisma.skillGroup.update({
      where: { id: sg.id },
      data: { maxScore: sgMax },
    })
  }

  await prisma.assessmentSchema.update({
    where: { id: schema.id },
    data: { totalMaxScore },
  })
}
