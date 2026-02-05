import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params

    const members = await prisma.teamMember.findMany({
      where: { teamId },
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

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { teamId } = await params
    const { userId, role = "MEMBER" } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check if user is already in this team
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already in this team" },
        { status: 400 }
      )
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { teamId } = await params
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 })
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
