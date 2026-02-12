import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: protocolId } = await params

    // Get protocol to find event
    const protocol = await prisma.protocol.findUnique({
      where: { id: protocolId },
      select: { eventId: true },
    })

    if (!protocol) {
      return NextResponse.json({ error: "Protocol not found" }, { status: 404 })
    }

    // Get all users who have applied or are assigned to this event
    const applications = await prisma.application.findMany({
      where: { eventId: protocol.eventId },
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            organization: true,
          },
        },
      },
    })

    // Get all experts assigned to this event
    const expertAssignments = await prisma.expertAssignment.findMany({
      where: { eventId: protocol.eventId },
      select: {
        expert: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            organization: true,
          },
        },
      },
    })

    // Combine and deduplicate users
    const usersMap = new Map()

    applications.forEach((app) => {
      usersMap.set(app.user.id, app.user)
    })

    expertAssignments.forEach((assignment) => {
      usersMap.set(assignment.expert.id, assignment.expert)
    })

    // Get all users if no specific assignments (fallback)
    if (usersMap.size === 0) {
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          organization: true,
        },
        orderBy: [
          { role: "asc" },
          { lastName: "asc" },
        ],
      })
      return NextResponse.json(allUsers)
    }

    const users = Array.from(usersMap.values()).sort((a, b) => {
      if (a.role !== b.role) {
        return a.role.localeCompare(b.role)
      }
      return a.lastName.localeCompare(b.lastName)
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching available users:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
