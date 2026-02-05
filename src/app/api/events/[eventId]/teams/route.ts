import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const teams = await prisma.team.findMany({
      where: { eventId },
      include: {
        members: {
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
        },
        _count: {
          select: { scores: true },
        },
      },
      orderBy: { number: "asc" },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams:", error)
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

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params
    const { name, number, memberIds } = await req.json()

    const team = await prisma.team.create({
      data: {
        eventId,
        name,
        number,
        members: memberIds
          ? {
              create: memberIds.map((userId: string, index: number) => ({
                userId,
                role: index === 0 ? "CAPTAIN" : "MEMBER",
              })),
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
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

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const url = new URL(req.url)
    const teamId = url.searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 })
    }

    await prisma.team.delete({
      where: { id: teamId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
