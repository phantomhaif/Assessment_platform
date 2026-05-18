import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageEvent, isAdmin } from "@/lib/authz"

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
    const canViewAll =
      isAdmin(session.user.role) || (await canManageEvent(session, eventId))
    let expertTeamIds: string[] | null = null

    if (!canViewAll) {
      const expertTeams = session.user.role === "EXPERT"
        ? await prisma.teamMember.findMany({
            where: {
              userId: session.user.id,
              role: "EXPERT",
              team: { eventId },
            },
            select: { teamId: true },
          })
        : []

      expertTeamIds = expertTeams.map((member) => member.teamId)

      if (expertTeamIds.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const passports = await prisma.skillPassport.findMany({
      where: {
        eventId,
        user: { role: { not: "EXPERT" } },
        ...(expertTeamIds
          ? {
              teamId: { in: expertTeamIds },
              userId: { not: session.user.id },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            organization: true,
          },
        },
        event: {
          select: {
            name: true,
            competency: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { totalScore: "desc" },
    })

    return NextResponse.json(passports)
  } catch (error) {
    console.error("Error fetching passports:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
