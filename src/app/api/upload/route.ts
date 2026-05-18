import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { canManageUser } from "@/lib/authz"

// Use Railway Volume path in production, local public folder in development
const UPLOADS_BASE = process.env.NODE_ENV === "production"
  ? "/app/uploads"
  : path.join(process.cwd(), "public", "uploads")

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as string | null
    const targetUserIdValue = formData.get("userId")
    const targetUserId = typeof targetUserIdValue === "string" && targetUserIdValue.trim()
      ? targetUserIdValue.trim()
      : session.user.id

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (
      targetUserId !== session.user.id &&
      !(await canManageUser(session, targetUserId))
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    // Validate file type for avatars
    if (type === "avatar") {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" },
          { status: 400 }
        )
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "jpg"
    const filename = `${targetUserId}_${timestamp}.${extension}`

    // Determine upload directory
    let uploadDir: string
    let subPath: string
    if (type === "avatar") {
      subPath = "avatars"
      uploadDir = path.join(UPLOADS_BASE, "avatars")
    } else if (type === "document") {
      subPath = "documents"
      uploadDir = path.join(UPLOADS_BASE, "documents")
    } else if (type === "team") {
      subPath = "teams"
      uploadDir = path.join(UPLOADS_BASE, "teams")
    } else {
      subPath = ""
      uploadDir = UPLOADS_BASE
    }

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // Generate URL (use API route to serve files in production)
    const url = subPath
      ? `/api/files/${subPath}/${filename}`
      : `/api/files/${filename}`

    // If avatar upload, update user profile
    if (type === "avatar") {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { photo: url },
      })
    }

    return NextResponse.json({ url, filename })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
