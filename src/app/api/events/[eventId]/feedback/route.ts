import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageEvent, isAdmin } from "@/lib/authz"

const FINISHED_STATUSES = new Set(["RESULTS_PUBLISHED", "ARCHIVED"])

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

async function canSubmitFeedback(eventId: string, userId: string, role: string) {
  if (["ADMIN", "ORGANIZER"].includes(role)) return true

  const application = await prisma.application.findFirst({
    where: {
      eventId,
      userId,
      status: "APPROVED",
    },
    select: { id: true },
  })

  if (application) return true

  const expertAssignment = await prisma.expertAssignment.findFirst({
    where: {
      eventId,
      expertId: userId,
    },
    select: { id: true },
  })

  return Boolean(expertAssignment)
}

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

    if (isAdmin(session.user.role) || (await canManageEvent(session, eventId))) {
      const feedbacks = await prisma.eventFeedback.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      })

      const averageRating = feedbacks.length
        ? feedbacks.reduce((sum, item) => sum + item.rating, 0) / feedbacks.length
        : null

      return NextResponse.json({ averageRating, feedbacks })
    }

    const feedback = await prisma.eventFeedback.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!FINISHED_STATUSES.has(event.status)) {
      return NextResponse.json({ error: "Feedback is available only after the event is finished" }, { status: 400 })
    }

    const allowed = await canSubmitFeedback(eventId, session.user.id, session.user.role)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const rating = Number(body.rating)

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be from 1 to 5" }, { status: 400 })
    }

    const feedback = await prisma.eventFeedback.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
      create: {
        eventId,
        userId: session.user.id,
        rating,
        pros: normalizeText(body.pros),
        cons: normalizeText(body.cons),
        suggestions: normalizeText(body.suggestions),
        wouldRecommend: typeof body.wouldRecommend === "boolean" ? body.wouldRecommend : null,
      },
      update: {
        rating,
        pros: normalizeText(body.pros),
        cons: normalizeText(body.cons),
        suggestions: normalizeText(body.suggestions),
        wouldRecommend: typeof body.wouldRecommend === "boolean" ? body.wouldRecommend : null,
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Error saving feedback:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
