import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check if user already has application for this event
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

    // Create application with APPROVED status
    const application = await prisma.application.create({
      data: {
        userId,
        eventId,
        agreedToRegulation: true,
        status: "APPROVED",
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
          },
        },
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error creating manual application:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
