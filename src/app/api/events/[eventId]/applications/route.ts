import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageEvent, isAdmin } from "@/lib/authz"

const eventApplicationRoles = ["PARTICIPANT", "EXPERT"] as const
type EventApplicationRole = (typeof eventApplicationRoles)[number]

function normalizeApplicationRole(value: unknown): EventApplicationRole {
  return value === "EXPERT" ? "EXPERT" : "PARTICIPANT"
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

    // For admin / managing organizer - return all applications
    if (isAdmin(session.user.role) || (await canManageEvent(session, eventId))) {
      const applications = await prisma.application.findMany({
        where: { eventId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organization: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(applications)
    }

    // For regular users - return only their application
    const application = await prisma.application.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    })

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching applications:", error)
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
    const body = await req.json()

    // Check if event exists and registration is open
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: "Мероприятие не найдено" }, { status: 404 })
    }

    if (event.status !== "REGISTRATION_OPEN") {
      return NextResponse.json({ error: "Регистрация закрыта" }, { status: 400 })
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json({ error: "Вы уже подали заявку на это мероприятие" }, { status: 400 })
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        eventId,
        agreedToRegulation: body.agreedToRegulation || false,
        requestedRole: normalizeApplicationRole(body.requestedRole),
        status: "PENDING",
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json({ error: "Ошибка подачи заявки" }, { status: 500 })
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

    const { applicationId, status, comment, approvedRole } = await req.json()

    const existingApplication = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    })

    if (!existingApplication || existingApplication.eventId !== eventId) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const normalizedApprovedRole = normalizeApplicationRole(
      approvedRole ?? existingApplication.approvedRole ?? existingApplication.requestedRole
    )

    const application = await prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.application.update({
        where: { id: applicationId },
        data: {
          status,
          comment,
          approvedRole: status === "APPROVED" ? normalizedApprovedRole : existingApplication.approvedRole,
        },
      })

      if (status === "APPROVED") {
        if (
          normalizedApprovedRole === "EXPERT" &&
          !["ADMIN", "ORGANIZER"].includes(existingApplication.user.role)
        ) {
          await tx.user.update({
            where: { id: existingApplication.user.id },
            data: { role: "EXPERT" },
          })
        } else if (existingApplication.user.role === "GUEST") {
          await tx.user.update({
            where: { id: existingApplication.user.id },
            data: { role: "PARTICIPANT" },
          })
        }
      }

      return updatedApplication
    })

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error updating application:", error)
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

    const { eventId } = await params

    // User can withdraw their own application
    const application = await prisma.application.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }

    if (application.status !== "PENDING") {
      return NextResponse.json({ error: "Нельзя отозвать обработанную заявку" }, { status: 400 })
    }

    await prisma.application.delete({
      where: { id: application.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
