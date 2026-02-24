import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "all" // all, year, event
    const eventId = searchParams.get("eventId")

    let teams: any[] = []

    if (period === "event" && eventId) {
      // Ranking for specific event
      teams = await prisma.team.findMany({
        where: { eventId },
        include: {
          event: {
            select: {
              name: true,
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
      // Ranking for current year
      const currentYear = new Date().getFullYear()
      const yearStart = new Date(currentYear, 0, 1)
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59)

      teams = await prisma.team.findMany({
        where: {
          event: {
            eventStart: {
              gte: yearStart,
              lte: yearEnd,
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
          totalScore: {
            not: null,
          },
        },
        include: {
          event: {
            select: {
              name: true,
              eventStart: true,
            },
          },
        },
        orderBy: { totalScore: "desc" },
      })
    }

    // Calculate cumulative scores for teams with same name (for "all" and "year" periods)
    if (period !== "event") {
      const teamScores = new Map<string, { teams: any[]; totalScore: number }>()

      teams.forEach((team) => {
        const existing = teamScores.get(team.name)
        if (existing) {
          existing.teams.push(team)
          existing.totalScore += team.totalScore || 0
        } else {
          teamScores.set(team.name, {
            teams: [team],
            totalScore: team.totalScore || 0,
          })
        }
      })

      // Convert to array and sort by cumulative score
      const rankings = Array.from(teamScores.entries())
        .map(([name, data]) => ({
          name,
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
        (item as any).rank = currentRank
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
        eventName: team.event.name,
        eventDate: team.event.eventStart,
      }))
    )
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
