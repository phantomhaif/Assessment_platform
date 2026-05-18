import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const UPLOADS_BASE = process.env.NODE_ENV === "production"
  ? "/app/uploads"
  : path.join(process.cwd(), "public", "uploads")

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; photoId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, photoId } = await params
    const photo = await prisma.teamPhoto.findFirst({
      where: { id: photoId, teamId },
    })

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    const isAdmin = ["ADMIN", "ORGANIZER"].includes(session.user.role)
    if (!isAdmin && photo.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
      const relativeFilePath = photo.fileUrl.replace(/^\/api\/files\//, "")
      const fullFilePath = path.join(UPLOADS_BASE, relativeFilePath)
      if (existsSync(fullFilePath)) {
        await unlink(fullFilePath)
      }
    } catch {
      // Ignore missing local files.
    }

    await prisma.teamPhoto.delete({ where: { id: photoId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team photo:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
