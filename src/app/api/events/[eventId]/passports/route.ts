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

    const passports = await prisma.skillPassport.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            organization: true,
          },
        },
        event: {
          select: {
            name: true,
            competency: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { totalScore: "desc" },
    })

    return NextResponse.json(passports)
  } catch (error) {
    console.error("Error fetching passports:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
