import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const UPLOADS_BASE = process.env.NODE_ENV === "production"
  ? "/app/uploads"
  : path.join(process.cwd(), "public", "uploads")

const PHOTO_MAX_SIZE = 10 * 1024 * 1024
const PHOTO_LIMIT = 30
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

async function canAccessTeam(teamId: string, userId: string, role: string) {
  if (["ADMIN", "ORGANIZER"].includes(role)) return true

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId },
    select: { id: true },
  })

  return Boolean(member)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId } = await params
    const allowed = await canAccessTeam(teamId, session.user.id, session.user.role)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const photos = await prisma.teamPhoto.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error("Error fetching team photos:", error)
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

    const { teamId } = await params
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        event: {
          select: { status: true },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const allowed = await canAccessTeam(teamId, session.user.id, session.user.role)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!["IN_PROGRESS", "SCORING", "RESULTS_PUBLISHED", "ARCHIVED"].includes(team.event.status)) {
      return NextResponse.json({ error: "Photo report is not available for this event status" }, { status: 400 })
    }

    const existingCount = await prisma.teamPhoto.count({ where: { teamId } })
    if (existingCount >= PHOTO_LIMIT) {
      return NextResponse.json({ error: "Photo limit reached" }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const captionValue = formData.get("caption")
    const caption = typeof captionValue === "string" && captionValue.trim() ? captionValue.trim() : null

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG and WebP images are allowed" }, { status: 400 })
    }

    if (file.size > PHOTO_MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10 MB limit" }, { status: 400 })
    }

    const uploadsDir = path.join(UPLOADS_BASE, "team-photos", teamId)
    await mkdir(uploadsDir, { recursive: true })

    const extension = path.extname(file.name) || `.${file.type.split("/")[1] || "jpg"}`
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`
    const filePath = path.join(uploadsDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())

    await writeFile(filePath, buffer)

    const photo = await prisma.teamPhoto.create({
      data: {
        teamId,
        uploadedById: session.user.id,
        fileName: file.name,
        fileUrl: `/api/files/team-photos/${teamId}/${filename}`,
        fileSize: buffer.length,
        mimeType: file.type,
        caption,
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error("Error uploading team photo:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
