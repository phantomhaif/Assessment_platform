import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const assignmentsSchema = z.object({
  userIds: z.array(z.string()),
})

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

    const assignments = await prisma.protocolAssignment.findMany({
      where: { protocolId },
      select: {
        userId: true,
      },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(
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
    const body = await req.json()
    const { userIds } = assignmentsSchema.parse(body)

    // Delete all existing assignments
    await prisma.protocolAssignment.deleteMany({
      where: { protocolId },
    })

    // Create new assignments
    if (userIds.length > 0) {
      await prisma.protocolAssignment.createMany({
        data: userIds.map((userId) => ({
          protocolId,
          userId,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }
    console.error("Error saving assignments:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
