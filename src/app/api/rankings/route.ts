import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RankedTeamRecord = {
  id: string
  name: string
  number: number | null
  rank: number | null
  totalScore: number | null
  event: {
    name: string
    nameEn?: string | null
    eventStart: Date
  }
}

type AggregatedRanking = {
  rank: number
  name: string
  totalScore: number
  eventsCount: number
  teams: RankedTeamRecord[]
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "all" // all, year, event
    const eventId = searchParams.get("eventId")
    const locale = searchParams.get("lang") === "en" ? "en" : "ru"

    let teams: RankedTeamRecord[] = []

    if (period === "event" && eventId) {
      // Ranking for specific event
      teams = await prisma.team.findMany({
        where: {
          eventId,
          totalScore: {
            not: null,
          },
          event: {
            status: {
              in: ["RESULTS_PUBLISHED", "ARCHIVED"],
            },
          },
        },
        include: {
          event: {
            select: {
              name: true,
              nameEn: true,
              eventStart: true,
            },
          },
        },
        orderBy: [
          { rank: "asc" },
          { totalScore: "desc" },
        ],
      })
    } else if (period === "year") {
      // Ranking for the last 365 days
      const yearStart = new Date()
      yearStart.setDate(yearStart.getDate() - 365)

      teams = await prisma.team.findMany({
        where: {
          event: {
            eventStart: {
              gte: yearStart,
            },
            status: {
              in: ["RESULTS_PUBLISHED", "ARCHIVED"],
            },
          },
          totalScore: {
            not: null,
          },
        },
        include: {
          event: {
            select: {
              name: true,
              nameEn: true,
              eventStart: true,
            },
          },
        },
        orderBy: { totalScore: "desc" },
      })
    } else {
      // Ranking for all events
      teams = await prisma.team.findMany({
        where: {
          event: {
            status: {
              in: ["RESULTS_PUBLISHED", "ARCHIVED"],
            },
          },
          totalScore: {
            not: null,
          },
        },
        include: {
          event: {
            select: {
              name: true,
              nameEn: true,
              eventStart: true,
            },
          },
        },
        orderBy: { totalScore: "desc" },
      })
    }

    // Calculate cumulative scores for teams with same name (for "all" and "year" periods)
    if (period !== "event") {
      const teamScores = new Map<string, { name: string; teams: RankedTeamRecord[]; totalScore: number }>()

      teams.forEach((team) => {
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
      })

      // Convert to array and sort by cumulative score
      const rankings: AggregatedRanking[] = Array.from(teamScores.values())
        .map((data) => ({
          rank: 0,
          name: data.name,
          totalScore: data.totalScore,
          eventsCount: data.teams.length,
          teams: data.teams,
        }))
        .sort((a, b) => b.totalScore - a.totalScore)

      // Add ranks
      let currentRank = 1
      rankings.forEach((item, index) => {
        if (index > 0 && rankings[index - 1].totalScore !== item.totalScore) {
          currentRank = index + 1
        }
        item.rank = currentRank
      })

      return NextResponse.json(rankings)
    }

    // For event-specific ranking, return teams as is
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
