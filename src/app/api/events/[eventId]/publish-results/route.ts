import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Get event with schema and teams
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        assessmentSchema: {
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: {
                subCriteria: {
                  include: {
                    criteria: true,
                  },
                },
              },
            },
            skillGroups: {
              orderBy: { number: "asc" },
            },
          },
        },
        teams: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
            scores: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.assessmentSchema) {
      return NextResponse.json({ error: "No assessment schema" }, { status: 400 })
    }

    const schema = event.assessmentSchema
    const passportsCreated: string[] = []

    // Calculate total scores for all teams first
    const teamScoresMap: { teamId: string; totalScore: number }[] = []

    for (const team of event.teams) {
      // Calculate scores
      const teamScores = team.scores

      // Calculate module scores
      const moduleScores = schema.modules.map(module => {
        const criterionIds = module.subCriteria.flatMap(s =>
          s.criteria.map(c => c.id)
        )
        const score = teamScores
          .filter(s => criterionIds.includes(s.criterionId))
          .reduce((sum, s) => sum + s.value, 0)

        return {
          code: module.code,
          name: module.name,
          score,
          maxScore: module.maxScore,
        }
      })

      // Calculate skill group scores
      const skillGroupScores = schema.skillGroups.map(group => {
        // Find all criteria belonging to this skill group by skillGroupId
        const criteriaInGroup = schema.modules.flatMap(m =>
          m.subCriteria.flatMap(s =>
            s.criteria.filter(c => c.skillGroupId === group.id)
          )
        )

        const criterionIds = criteriaInGroup.map(c => c.id)
        const score = teamScores
          .filter(s => criterionIds.includes(s.criterionId))
          .reduce((sum, s) => sum + s.value, 0)

        return {
          number: group.number,
          name: group.name,
          nameEn: group.nameEn,
          score: Math.min(score, group.maxScore),
          maxScore: group.maxScore,
        }
      })

      const totalScore = moduleScores.reduce((sum, m) => sum + m.score, 0)

      // Store team score for ranking
      teamScoresMap.push({ teamId: team.id, totalScore })

      // Create passport for each team member
      for (const member of team.members) {
        await prisma.skillPassport.upsert({
          where: {
            userId_eventId: {
              userId: member.userId,
              eventId,
            },
          },
          update: {
            totalScore,
            moduleScores,
            skillGroupScores,
            publishedAt: new Date(),
          },
          create: {
            userId: member.userId,
            eventId,
            teamId: team.id,
            totalScore,
            moduleScores,
            skillGroupScores,
            publishedAt: new Date(),
          },
        })

        passportsCreated.push(member.user.email)
      }
    }

    // Calculate rankings using Standard Competition Ranking (1, 2, 2, 4...)
    teamScoresMap.sort((a, b) => b.totalScore - a.totalScore)

    let currentRank = 1
    for (let i = 0; i < teamScoresMap.length; i++) {
      // If not the first team and has different score than previous, update rank
      if (i > 0 && teamScoresMap[i].totalScore < teamScoresMap[i - 1].totalScore) {
        currentRank = i + 1
      }

      await prisma.team.update({
        where: { id: teamScoresMap[i].teamId },
        data: {
          rank: currentRank,
          totalScore: teamScoresMap[i].totalScore,
        },
      })
    }

    // Update event status
    await prisma.event.update({
      where: { id: eventId },
      data: { status: "RESULTS_PUBLISHED" },
    })

    return NextResponse.json({
      success: true,
      passportsCreated: passportsCreated.length,
    })
  } catch (error) {
    console.error("Error publishing results:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
