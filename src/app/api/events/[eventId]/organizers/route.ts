import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
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
    if (!(await canManageEvent(session, eventId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        organizers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
          orderBy: { lastName: "asc" },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event.organizers)
  } catch (error) {
    console.error("Error fetching event organizers:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

const putSchema = z.object({
  userIds: z.array(z.string()),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only the admin may assign or change who organizes an event.
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params
    const { userIds } = putSchema.parse(await req.json())

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Anyone assigned as an organizer must hold the ORGANIZER role so they can
    // reach the management area. Admins keep their role.
    if (userIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: userIds }, role: { notIn: ["ADMIN", "ORGANIZER"] } },
        data: { role: "ORGANIZER" },
      })
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        organizers: { set: userIds.map((id) => ({ id })) },
      },
      select: {
        organizers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
          orderBy: { lastName: "asc" },
        },
      },
    })

    return NextResponse.json(updated.organizers)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }
    console.error("Error updating event organizers:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
