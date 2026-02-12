import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

// Use Railway Volume path in production, local public folder in development
const UPLOADS_BASE = process.env.NODE_ENV === "production"
  ? "/app/uploads"
  : path.join(process.cwd(), "public", "uploads")

// GET - fetch all files for a team
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

    // Check if user is team member or admin/organizer
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "ORGANIZER" || session.user.role === "EXPERT"

    if (!isAdmin) {
      const isMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: session.user.id,
        },
      })

      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const files = await prisma.teamFile.findMany({
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

    return NextResponse.json(files)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// POST - upload a file
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

    // Check if user is team member
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
      include: {
        team: {
          include: {
            event: true,
          },
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check event status allows uploads
    const eventStatus = teamMember.team.event.status
    if (!["IN_PROGRESS", "SCORING"].includes(eventStatus)) {
      return NextResponse.json(
        { error: "Загрузка файлов недоступна в текущем статусе мероприятия" },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const moduleCode = formData.get("moduleCode") as string

    if (!file || !moduleCode) {
      return NextResponse.json({ error: "File and module code required" }, { status: 400 })
    }

    // Delete existing file for this module
    const existingFile = await prisma.teamFile.findFirst({
      where: { teamId, moduleCode },
    })

    if (existingFile) {
      // Delete physical file
      try {
        const oldFilePath = existingFile.fileUrl.replace(/^\/api\/files\//, "")
        const fullOldPath = path.join(UPLOADS_BASE, oldFilePath)
        if (existsSync(fullOldPath)) {
          await unlink(fullOldPath)
        }
      } catch (e) {
        // Ignore if file doesn't exist
      }

      await prisma.teamFile.delete({
        where: { id: existingFile.id },
      })
    }

    // Create uploads directory
    const uploadsDir = path.join(UPLOADS_BASE, "team-files", teamId)
    await mkdir(uploadsDir, { recursive: true })

    // Generate filename
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `${moduleCode}-${timestamp}${ext}`
    const filePath = path.join(uploadsDir, filename)

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Create database record (use API route for serving files)
    const teamFile = await prisma.teamFile.create({
      data: {
        teamId,
        uploadedById: session.user.id,
        moduleCode,
        fileName: file.name,
        fileUrl: `/api/files/team-files/${teamId}/${filename}`,
        fileSize: buffer.length,
      },
    })

    return NextResponse.json(teamFile)
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Ошибка загрузки файла" }, { status: 500 })
  }
}

// DELETE - delete a file
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId } = await params
    const url = new URL(req.url)
    const fileId = url.searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    // Check if user is team member or admin
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "ORGANIZER"

    if (!isAdmin) {
      const isMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: session.user.id,
        },
      })

      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Get file record
    const file = await prisma.teamFile.findUnique({
      where: { id: fileId, teamId },
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete physical file
    try {
      const relativeFilePath = file.fileUrl.replace(/^\/api\/files\//, "")
      const fullFilePath = path.join(UPLOADS_BASE, relativeFilePath)
      if (existsSync(fullFilePath)) {
        await unlink(fullFilePath)
      }
    } catch (e) {
      // Ignore if file doesn't exist
    }

    // Delete database record
    await prisma.teamFile.delete({
      where: { id: fileId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
