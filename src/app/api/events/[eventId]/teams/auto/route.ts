import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function normalizeOrgKey(value: string | null | undefined) {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase()
}

function buildTeamBaseName(organization: string | null | undefined, index: number) {
  const normalized = (organization || "").trim().replace(/\s+/g, " ")
  return normalized || `Team ${index + 1}`
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        maxTeamSize: true,
        teams: {
          select: {
            id: true,
            name: true,
            number: true,
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
        applications: {
          where: { status: "APPROVED" },
          orderBy: [
            { approvedRole: "asc" },
            { createdAt: "asc" },
          ],
          include: {
            user: {
              select: {
                id: true,
                organization: true,
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const assignedUserIds = new Set(
      event.teams.flatMap((team) => team.members.map((member) => member.userId))
    )

    const participantApplications = event.applications.filter((application) => {
      const effectiveRole = application.approvedRole ?? application.requestedRole
      return effectiveRole === "PARTICIPANT" && !assignedUserIds.has(application.userId)
    })

    if (participantApplications.length === 0) {
      return NextResponse.json({ createdTeams: 0, addedMembers: 0 })
    }

    const grouped = new Map<string, typeof participantApplications>()

    for (const application of participantApplications) {
      const key = normalizeOrgKey(application.user.organization) || `user:${application.userId}`
      const current = grouped.get(key) || []
      current.push(application)
      grouped.set(key, current)
    }

    let nextNumber =
      event.teams.reduce((max, team) => Math.max(max, team.number ?? 0), 0) + 1
    let fallbackIndex = 0
    let createdTeams = 0
    let addedMembers = 0

    for (const applications of grouped.values()) {
      const baseName = buildTeamBaseName(applications[0]?.user.organization, fallbackIndex)
      fallbackIndex += 1

      for (let start = 0; start < applications.length; start += event.maxTeamSize) {
        const chunk = applications.slice(start, start + event.maxTeamSize)
        const suffix = start === 0 ? "" : ` (${Math.floor(start / event.maxTeamSize) + 1})`
        const rawName = `${baseName}${suffix}`.trim()
        let teamName = rawName
        let duplicateIndex = 2

        while (event.teams.some((team) => team.name === teamName)) {
          teamName = `${rawName} ${duplicateIndex}`
          duplicateIndex += 1
        }

        const team = await prisma.team.create({
          data: {
            eventId,
            name: teamName,
            number: nextNumber,
            members: {
              create: chunk.map((application) => ({
                userId: application.userId,
                role: "MEMBER",
              })),
            },
          },
        })

        event.teams.push({
          id: team.id,
          name: teamName,
          number: nextNumber,
          members: chunk.map((application) => ({ userId: application.userId })),
        })
        nextNumber += 1
        createdTeams += 1
        addedMembers += chunk.length
      }
    }

    return NextResponse.json({ createdTeams, addedMembers })
  } catch (error) {
    console.error("Error auto-forming teams:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
