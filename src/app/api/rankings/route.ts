import { NextRequest, NextResponse } from "next/server"
import { EventStatus, type Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const teamInclude = {
  event: {
    select: {
      name: true,
      nameEn: true,
      eventStart: true,
    },
  },
} satisfies Prisma.TeamInclude

type RankedTeamRecord = Prisma.TeamGetPayload<{
  include: typeof teamInclude
}>

type AggregatedRanking = {
  rank: number
  name: string
  totalScore: number
  eventsCount: number
  teams: RankedTeamRecord[]
}

const RESULTS_STATUSES: EventStatus[] = [EventStatus.RESULTS_PUBLISHED, EventStatus.ARCHIVED]

function loadRankedTeams(args: Omit<Prisma.TeamFindManyArgs, "include" | "select">) {
  return prisma.team.findMany({
    ...args,
    include: teamInclude,
  }) as unknown as Promise<RankedTeamRecord[]>
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "all"
    const eventId = searchParams.get("eventId")
    const competency = searchParams.get("competency")?.trim()
    const locale = searchParams.get("lang") === "en" ? "en" : "ru"

    if (!competency) {
      return NextResponse.json([])
    }

    let teams: RankedTeamRecord[] = []

    if (period === "event" && eventId) {
      teams = await loadRankedTeams({
        where: {
          eventId,
          totalScore: { not: null },
          event: {
            competency,
            status: { in: RESULTS_STATUSES },
          },
        },
        orderBy: [{ rank: "asc" }, { totalScore: "desc" }],
      })
    } else if (period === "year") {
      const yearStart = new Date()
      yearStart.setDate(yearStart.getDate() - 365)

      teams = await loadRankedTeams({
        where: {
          totalScore: { not: null },
          event: {
            competency,
            eventStart: { gte: yearStart },
            status: { in: RESULTS_STATUSES },
          },
        },
        orderBy: { totalScore: "desc" },
      })
    } else {
      teams = await loadRankedTeams({
        where: {
          totalScore: { not: null },
          event: {
            competency,
            status: { in: RESULTS_STATUSES },
          },
        },
        orderBy: { totalScore: "desc" },
      })
    }

    if (period !== "event") {
      const teamScores = new Map<string, { name: string; teams: RankedTeamRecord[]; totalScore: number }>()

      for (const team of teams) {
        const normalizedName = team.name.trim().replace(/\s+/g, " ").toLowerCase()
        const existing = teamScores.get(normalizedName)

        if (existing) {
          existing.teams.push(team)
          existing.totalScore += team.totalScore || 0
        } else {
          teamScores.set(normalizedName, {
            name: team.name.trim(),
            teams: [team],
            totalScore: team.totalScore || 0,
          })
        }
      }

      const rankings: AggregatedRanking[] = Array.from(teamScores.values())
        .map((data) => ({
          rank: 0,
          name: data.name,
          totalScore: data.totalScore,
          eventsCount: data.teams.length,
          teams: data.teams,
        }))
        .sort((a, b) => b.totalScore - a.totalScore)

      let currentRank = 1
      rankings.forEach((item, index) => {
        if (index > 0 && rankings[index - 1].totalScore !== item.totalScore) {
          currentRank = index + 1
        }
        item.rank = currentRank
      })

      return NextResponse.json(rankings)
    }

    return NextResponse.json(
      teams.map((team) => ({
        id: team.id,
        name: team.name,
        number: team.number,
        rank: team.rank,
        totalScore: team.totalScore,
        eventName: locale === "en" ? team.event.nameEn || team.event.name : team.event.name,
        eventDate: team.event.eventStart,
      }))
    )
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
