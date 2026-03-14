import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100)

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : []
    const markAll = Boolean(body?.all)

    if (!markAll && ids.length === 0) {
      return NextResponse.json({ error: "No notifications selected" }, { status: 400 })
    }

    const where = markAll
      ? { userId: session.user.id, isRead: false }
      : { userId: session.user.id, id: { in: ids } }

    await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({ success: true, unreadCount })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
