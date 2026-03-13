import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface ScorePayload {
  criterionId: string
  teamId: string
  value: number
  judgeScores?: number[]
}

function serializeJudgeScores(judgeScores?: number[]): string | undefined {
  if (!Array.isArray(judgeScores)) return undefined

  const normalized = judgeScores
    .map(v => Number(v))
    .filter(v => Number.isFinite(v))

  if (normalized.length === 0) return undefined

  return JSON.stringify({ judgeScores: normalized })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")

    const where: any = {}

    // Get all criteria for this event's schema
    const schema = await prisma.assessmentSchema.findUnique({
      where: { eventId },
      include: {
        modules: {
          include: {
            subCriteria: {
              include: {
                criteria: true,
              },
            },
          },
        },
      },
    })

    if (!schema) {
      return NextResponse.json([])
    }

    const criterionIds = schema.modules.flatMap(m =>
      m.subCriteria.flatMap(s => s.criteria.map(c => c.id))
    )

    where.criterionId = { in: criterionIds }

    if (teamId) {
      where.teamId = teamId
    }

    const scores = await prisma.score.findMany({
      where,
      select: {
        criterionId: true,
        teamId: true,
        value: true,
        expertId: true,
        comment: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error("Error fetching scores:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin, organizer, or expert
    if (!["ADMIN", "ORGANIZER", "EXPERT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const scores = body?.scores as ScorePayload[] | undefined

    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json({ error: "Invalid scores data" }, { status: 400 })
    }

    // Upsert all scores
    const results = await Promise.all(
      scores.map(async (score) => {
        const serializedJudgeScores = serializeJudgeScores(score.judgeScores)

        return prisma.score.upsert({
          where: {
            criterionId_teamId: {
              criterionId: score.criterionId,
              teamId: score.teamId,
            },
          },
          update: {
            value: score.value,
            expertId: session.user.id,
            ...(serializedJudgeScores !== undefined ? { comment: serializedJudgeScores } : {}),
          },
          create: {
            criterionId: score.criterionId,
            teamId: score.teamId,
            value: score.value,
            expertId: session.user.id,
            comment: serializedJudgeScores,
          },
        })
      })
    )

    return NextResponse.json({ saved: results.length })
  } catch (error) {
    console.error("Error saving scores:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
