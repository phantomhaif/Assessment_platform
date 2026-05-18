import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { removeEventPassportPdfCaches } from "@/lib/passports"
import { prisma } from "@/lib/prisma"
import { canManageEvent, isAdmin } from "@/lib/authz"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            teams: true,
            applications: true,
          },
        },
        assessmentSchema: {
          select: {
            id: true,
            name: true,
          },
        },
        teams: {
          where: {
            rank: { not: null },
          },
          orderBy: { rank: "asc" },
          select: {
            id: true,
            name: true,
            rank: true,
            totalScore: true,
            members: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    if (!(await canManageEvent(session, eventId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()

    // Only the admin may (re)assign organizers; strip relation/ownership
    // fields from the generic update payload for everyone else.
    if (!isAdmin(session.user.role)) {
      delete body.organizers
      delete body.organizerIds
    }

    const shouldInvalidatePassportCache =
      Object.prototype.hasOwnProperty.call(body, "passportBackgroundRu") ||
      Object.prototype.hasOwnProperty.call(body, "passportBackgroundEn")

    const event = await prisma.event.update({
      where: { id: eventId },
      data: body,
    })

    if (shouldInvalidatePassportCache) {
      await removeEventPassportPdfCaches(eventId)
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params

    await prisma.event.delete({
      where: { id: eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
