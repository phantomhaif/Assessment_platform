import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const passports = await prisma.skillPassport.findMany({
      where: {
        userId: session.user.id,
        publishedAt: { not: null },
      },
      include: {
        event: {
          select: {
            name: true,
            competency: true,
            eventStart: true,
            eventEnd: true,
          },
        },
        team: {
          select: {
            name: true,
            rank: true,
            totalScore: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    })

    return NextResponse.json(passports)
  } catch (error) {
    console.error("Error fetching passports:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
