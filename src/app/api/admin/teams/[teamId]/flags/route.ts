import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_KEYS = new Set(["obs_submitted"])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { teamId } = await params
    const body = await req.json()
    const key = String(body.key || "")

    if (!ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: "Unsupported flag" }, { status: 400 })
    }

    const flag = await prisma.teamAdminFlag.upsert({
      where: {
        teamId_key: {
          teamId,
          key,
        },
      },
      create: {
        teamId,
        key,
        value: Boolean(body.value),
        note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
        updatedById: session.user.id,
      },
      update: {
        value: Boolean(body.value),
        note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
        updatedById: session.user.id,
      },
    })

    return NextResponse.json(flag)
  } catch (error) {
    console.error("Error updating team flag:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
