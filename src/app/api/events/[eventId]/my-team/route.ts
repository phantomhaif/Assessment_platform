import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Find team where user is a member for this event
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        team: {
          eventId: eventId,
        },
      },
      include: {
        team: true,
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: teamMember.team.id,
      name: teamMember.team.name,
      number: teamMember.team.number,
      role: teamMember.role,
    })
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
