import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const memberships = await prisma.teamMember.findMany({
      where: {
        userId: session.user.id,
        team: {
          event: {
            status: {
              in: ["IN_PROGRESS", "SCORING"],
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        team: {
          include: {
            files: {
              orderBy: {
                createdAt: "desc",
              },
            },
            event: {
              include: {
                assessmentSchema: {
                  include: {
                    modules: {
                      orderBy: {
                        order: "asc",
                      },
                      select: {
                        id: true,
                        code: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const submissions = memberships.map((membership) => ({
      event: {
        id: membership.team.event.id,
        name: membership.team.event.name,
        nameEn: membership.team.event.nameEn,
        competency: membership.team.event.competency,
        competencyEn: membership.team.event.competencyEn,
        status: membership.team.event.status,
        eventStart: membership.team.event.eventStart,
        eventEnd: membership.team.event.eventEnd,
      },
      team: {
        id: membership.team.id,
        name: membership.team.name,
        number: membership.team.number,
      },
      modules: membership.team.event.assessmentSchema?.modules ?? [],
      files: membership.team.files,
      canUpload: ["IN_PROGRESS", "SCORING"].includes(membership.team.event.status),
    }))

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
