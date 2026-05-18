import { NextRequest, NextResponse } from "next/server"
import { EventStatus, type Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const RESULTS_STATUSES: EventStatus[] = [EventStatus.RESULTS_PUBLISHED, EventStatus.ARCHIVED]

const teamInclude = {
  event: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      competency: true,
      competencyEn: true,
      eventStart: true,
    },
  },
  members: {
    include: {
      user: {
        include: {
          organizationRef: true,
        },
      },
    },
  },
} satisfies Prisma.TeamInclude

const liveTeamInclude = {
  event: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      eventStart: true,
      eventEnd: true,
    },
  },
  scores: true,
} satisfies Prisma.TeamInclude

type RankedTeamRecord = Prisma.TeamGetPayload<{ include: typeof teamInclude }>
type LiveTeamRecord = Prisma.TeamGetPayload<{ include: typeof liveTeamInclude }>

type RankingItem = {
  rank: number
  name: string
  totalScore: number
  id?: string
  number?: number | null
  eventName?: string
  eventDate?: Date
  eventsCount?: number
  teamsCount?: number
  participantsCount?: number
  competenciesCount?: number
  organization?: string | null
  previousRank?: number | null
  trend?: "up" | "down" | "same" | "new"
}

function assignRanks<T extends { rank: number; totalScore: number }>(items: T[]) {
  let currentRank = 1

  items.forEach((item, index) => {
    if (index > 0 && items[index - 1].totalScore !== item.totalScore) {
      currentRank = index + 1
    }
    item.rank = currentRank
  })

  return items
}

function normalizeKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

function formatUserName(user: { firstName: string; lastName: string; middleName?: string | null }) {
  return [user.lastName, user.firstName, user.middleName].filter(Boolean).join(" ")
}

function getOrganizationName(user: RankedTeamRecord["members"][number]["user"]) {
  return user.organizationRef?.name || user.organization || null
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getEndOfUtcDay(dateKey: string) {
  return new Date(`${dateKey}T23:59:59.999Z`)
}

function buildEventDays(eventStart: Date, eventEnd: Date) {
  const days: string[] = []
  const cursor = new Date(Date.UTC(eventStart.getUTCFullYear(), eventStart.getUTCMonth(), eventStart.getUTCDate()))
  const end = new Date(Date.UTC(eventEnd.getUTCFullYear(), eventEnd.getUTCMonth(), eventEnd.getUTCDate()))

  while (cursor <= end && days.length < 45) {
    days.push(getDateKey(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

function selectDefaultDay(eventStart: Date, eventEnd: Date) {
  const today = new Date()
  if (today < eventStart) return getDateKey(eventStart)
  if (today > eventEnd) return getDateKey(eventEnd)
  return getDateKey(today)
}

function computeLiveRanks(teams: LiveTeamRecord[], cutoff: Date) {
  const ranked = teams
    .map((team) => ({
      id: team.id,
      name: team.name,
      number: team.number,
      rank: 0,
      totalScore: team.scores
        .filter((score) => score.updatedAt <= cutoff)
        .reduce((sum, score) => sum + score.value, 0),
      eventName: team.event.name,
      eventDate: team.event.eventStart,
    }))
    .filter((team) => team.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)

  return assignRanks(ranked)
}

async function loadRankedTeams(args: Omit<Prisma.TeamFindManyArgs, "include" | "select">) {
  return prisma.team.findMany({
    ...args,
    include: teamInclude,
  }) as unknown as Promise<RankedTeamRecord[]>
}

function periodDateFilter(period: string) {
  if (period !== "year") return undefined

  const yearStart = new Date()
  yearStart.setDate(yearStart.getDate() - 365)
  return { gte: yearStart }
}

async function getTeamRankings(period: string, competency: string | null, eventId: string | null, locale: "ru" | "en") {
  if (!competency) {
    return []
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
  } else {
    teams = await loadRankedTeams({
      where: {
        totalScore: { not: null },
        event: {
          competency,
          status: { in: RESULTS_STATUSES },
          eventStart: periodDateFilter(period),
        },
      },
      orderBy: { totalScore: "desc" },
    })
  }

  if (period === "event") {
    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      number: team.number,
      rank: team.rank || 0,
      totalScore: team.totalScore || 0,
      eventName: locale === "en" ? team.event.nameEn || team.event.name : team.event.name,
      eventDate: team.event.eventStart,
    }))
  }

  const teamScores = new Map<string, { name: string; teams: RankedTeamRecord[]; totalScore: number }>()

  for (const team of teams) {
    const normalizedName = normalizeKey(team.name)
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

  const rankings = Array.from(teamScores.values())
    .map((data) => ({
      rank: 0,
      name: data.name,
      totalScore: data.totalScore,
      eventsCount: data.teams.length,
      competenciesCount: new Set(data.teams.map((team) => team.event.competency)).size,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)

  return assignRanks(rankings)
}

async function getUniversityRankings(period: string) {
  const teams = await loadRankedTeams({
    where: {
      totalScore: { not: null },
      event: {
        status: { in: RESULTS_STATUSES },
        eventStart: periodDateFilter(period),
      },
    },
    orderBy: { totalScore: "desc" },
  })

  const organizations = new Map<
    string,
    {
      name: string
      totalScore: number
      teamIds: Set<string>
      eventIds: Set<string>
      participantIds: Set<string>
      competencies: Set<string>
    }
  >()

  for (const team of teams) {
    const teamOrganizations = new Map<string, string>()

    for (const member of team.members) {
      const organization = getOrganizationName(member.user)
      if (!organization) continue

      const key = normalizeKey(organization)
      teamOrganizations.set(key, organization.trim())

      const existing = organizations.get(key)
      if (existing) {
        existing.participantIds.add(member.userId)
      } else {
        organizations.set(key, {
          name: organization.trim(),
          totalScore: 0,
          teamIds: new Set(),
          eventIds: new Set(),
          participantIds: new Set([member.userId]),
          competencies: new Set(),
        })
      }
    }

    for (const [key] of teamOrganizations) {
      const organization = organizations.get(key)
      if (!organization) continue

      organization.totalScore += team.totalScore || 0
      organization.teamIds.add(team.id)
      organization.eventIds.add(team.event.id)
      organization.competencies.add(team.event.competency)
    }
  }

  const rankings: RankingItem[] = Array.from(organizations.values())
    .map((organization) => ({
      rank: 0,
      name: organization.name,
      totalScore: organization.totalScore,
      teamsCount: organization.teamIds.size,
      eventsCount: organization.eventIds.size,
      participantsCount: organization.participantIds.size,
      competenciesCount: organization.competencies.size,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)

  return assignRanks(rankings)
}

async function getParticipantRankings(period: string) {
  const passports = await prisma.skillPassport.findMany({
    where: {
      event: {
        status: { in: RESULTS_STATUSES },
        eventStart: periodDateFilter(period),
      },
    },
    include: {
      event: {
        select: {
          id: true,
          competency: true,
        },
      },
      user: {
        include: {
          organizationRef: true,
        },
      },
    },
    orderBy: { totalScore: "desc" },
  })

  const participants = new Map<
    string,
    {
      name: string
      totalScore: number
      events: Set<string>
      competencies: Set<string>
      organization: string | null
    }
  >()

  for (const passport of passports) {
    const existing = participants.get(passport.userId)
    const organization = passport.user.organizationRef?.name || passport.user.organization || null

    if (existing) {
      existing.totalScore += passport.totalScore
      existing.events.add(passport.event.id)
      existing.competencies.add(passport.event.competency)
      existing.organization ||= organization
    } else {
      participants.set(passport.userId, {
        name: formatUserName(passport.user),
        totalScore: passport.totalScore,
        events: new Set([passport.event.id]),
        competencies: new Set([passport.event.competency]),
        organization,
      })
    }
  }

  const rankings: RankingItem[] = Array.from(participants.values())
    .map((participant) => ({
      rank: 0,
      name: participant.name,
      totalScore: participant.totalScore,
      eventsCount: participant.events.size,
      competenciesCount: participant.competencies.size,
      organization: participant.organization,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)

  return assignRanks(rankings)
}

async function getLiveRankings(eventId: string | null, day: string | null, locale: "ru" | "en") {
  if (!eventId) {
    return { rankings: [], days: [], selectedDay: null }
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      eventStart: true,
      eventEnd: true,
      name: true,
      nameEn: true,
    },
  })

  if (!event) {
    return { rankings: [], days: [], selectedDay: null }
  }

  const days = buildEventDays(event.eventStart, event.eventEnd)
  const selectedDay = day && days.includes(day) ? day : selectDefaultDay(event.eventStart, event.eventEnd)
  const selectedIndex = days.indexOf(selectedDay)
  const cutoff = getEndOfUtcDay(selectedDay)
  const previousCutoff = selectedIndex > 0 ? getEndOfUtcDay(days[selectedIndex - 1]) : null

  const teams = (await prisma.team.findMany({
    where: { eventId },
    include: liveTeamInclude,
  })) as unknown as LiveTeamRecord[]

  const currentRanks = computeLiveRanks(teams, cutoff)
  const previousRanks = previousCutoff ? computeLiveRanks(teams, previousCutoff) : []
  const previousById = new Map(previousRanks.map((team) => [team.id, team.rank]))

  const rankings = currentRanks.map((team) => {
    const previousRank = previousById.get(team.id) ?? null
    const trend =
      previousRank === null ? "new" : team.rank < previousRank ? "up" : team.rank > previousRank ? "down" : "same"

    return {
      ...team,
      eventName: locale === "en" ? event.nameEn || event.name : event.name,
      previousRank,
      trend,
    }
  })

  return { rankings, days, selectedDay }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const view = searchParams.get("view") || "teams"
    const period = searchParams.get("period") || "all"
    const eventId = searchParams.get("eventId")
    const competency = searchParams.get("competency")?.trim() || null
    const locale = searchParams.get("lang") === "en" ? "en" : "ru"

    if (view === "universities") {
      return NextResponse.json(await getUniversityRankings(period))
    }

    if (view === "participants") {
      return NextResponse.json(await getParticipantRankings(period))
    }

    if (view === "live") {
      return NextResponse.json(await getLiveRankings(eventId, searchParams.get("day"), locale))
    }

    return NextResponse.json(await getTeamRankings(period, competency, eventId, locale))
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
