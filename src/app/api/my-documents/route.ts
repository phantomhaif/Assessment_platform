import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [applications, memberships] = await Promise.all([
      prisma.application.findMany({
        where: {
          userId: session.user.id,
          status: { in: ["PENDING", "APPROVED"] },
        },
        select: { eventId: true },
      }),
      prisma.teamMember.findMany({
        where: { userId: session.user.id },
        select: {
          team: {
            select: {
              eventId: true,
            },
          },
        },
      }),
    ])

    const eventIds = Array.from(
      new Set([
        ...applications.map((application) => application.eventId),
        ...memberships.map((membership) => membership.team.eventId),
      ])
    )

    if (eventIds.length === 0) {
      return NextResponse.json([])
    }

    const events = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        competency: true,
        competencyEn: true,
        eventStart: true,
        eventEnd: true,
        documents: {
          where: {
            access: {
              hasSome: ["PUBLIC", "PARTICIPANTS"],
            },
          },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            name: true,
            type: true,
            access: true,
            fileUrl: true,
            version: true,
            createdAt: true,
          },
        },
      },
      orderBy: { eventStart: "asc" },
    })

    return NextResponse.json(events.filter((event) => event.documents.length > 0))
  } catch (error) {
    console.error("Error fetching user documents:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
