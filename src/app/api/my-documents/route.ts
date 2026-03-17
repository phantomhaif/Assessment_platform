import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessEventDocument, resolveEventDocumentAccessContext } from "@/lib/event-document-access"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const requestedLanguage = req.nextUrl.searchParams.get("lang")?.toUpperCase() === "EN" ? "EN" : "RU"

    const [applications, memberships, expertAssignments] = await Promise.all([
      prisma.application.findMany({
        where: {
          userId: session.user.id,
          status: "APPROVED",
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
      prisma.expertAssignment.findMany({
        where: { expertId: session.user.id },
        select: { eventId: true },
      }),
    ])

    const eventIds = Array.from(
      new Set([
        ...applications.map((application) => application.eventId),
        ...memberships.map((membership) => membership.team.eventId),
        ...expertAssignments.map((assignment) => assignment.eventId),
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
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            name: true,
            type: true,
            language: true,
            access: true,
            fileUrl: true,
            version: true,
            createdAt: true,
          },
        },
      },
      orderBy: { eventStart: "asc" },
    })

    const visibleEvents = await Promise.all(
      events.map(async (event) => {
        const accessContext = await resolveEventDocumentAccessContext(event.id, session.user.id, session.user.role)
        return {
          ...event,
          documents: event.documents.filter(
            (document) =>
              canAccessEventDocument(document.access, accessContext) &&
              document.language === requestedLanguage.toUpperCase()
          ),
        }
      })
    )

    return NextResponse.json(visibleEvents.filter((event) => event.documents.length > 0))
  } catch (error) {
    console.error("Error fetching user documents:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
