import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get protocols assigned to this user
    const assignments = await prisma.protocolAssignment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        protocol: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
            signatures: {
              where: {
                userId: session.user.id,
              },
              select: {
                id: true,
                signedAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform data to include signed status
    const regulationsWithStatus = assignments.map(({ protocol }) => ({
      id: protocol.id,
      title: protocol.title,
      version: protocol.version,
      eventId: protocol.eventId,
      eventName: protocol.event?.name || "Общий регламент",
      createdAt: protocol.createdAt,
      isSigned: protocol.signatures.length > 0,
      signedAt: protocol.signatures[0]?.signedAt || null,
    }))

    return NextResponse.json(regulationsWithStatus)
  } catch (error) {
    console.error("Error fetching regulations:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
