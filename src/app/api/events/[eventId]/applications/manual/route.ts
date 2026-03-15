import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function normalizeApplicationRole(value: unknown) {
  return value === "EXPERT" ? "EXPERT" : "PARTICIPANT"
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

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params
    const { userId, requestedRole } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "Пользователь уже подал заявку на это мероприятие" },
        { status: 400 }
      )
    }

    const role = normalizeApplicationRole(requestedRole)

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          userId,
          eventId,
          agreedToRegulation: true,
          status: "APPROVED",
          requestedRole: role,
          approvedRole: role,
          comment: "Добавлен администратором",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organization: true,
              role: true,
            },
          },
        },
      })

      if (role === "EXPERT" && !["ADMIN", "ORGANIZER"].includes(created.user.role)) {
        await tx.user.update({
          where: { id: userId },
          data: { role: "EXPERT" },
        })
      } else if (created.user.role === "GUEST") {
        await tx.user.update({
          where: { id: userId },
          data: { role: "PARTICIPANT" },
        })
      }

      return created
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error creating manual application:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
