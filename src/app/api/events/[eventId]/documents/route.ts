import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// Use Railway Volume path in production, local public folder in development
const UPLOADS_BASE = process.env.NODE_ENV === "production"
  ? "/app/uploads"
  : path.join(process.cwd(), "public", "uploads")

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const documents = await prisma.eventDocument.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params
    const formData = await req.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const access = formData.get("access") as string || "PARTICIPANTS"

    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 })
    }

    if (!name || !type) {
      return NextResponse.json({ error: "Не указано название или тип документа" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(UPLOADS_BASE, "documents", eventId)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = path.join(uploadsDir, filename)

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Get current version for this document type
    const existingDocs = await prisma.eventDocument.findMany({
      where: { eventId, type: type as any },
      orderBy: { version: "desc" },
      take: 1,
    })
    const newVersion = existingDocs.length > 0 ? existingDocs[0].version + 1 : 1

    // Create document record (use API route for serving files)
    const document = await prisma.eventDocument.create({
      data: {
        eventId,
        name,
        type: type as any,
        access: access as any,
        fileUrl: `/api/files/documents/${eventId}/${filename}`,
        version: newVersion,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Ошибка загрузки документа" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const url = new URL(req.url)
    const documentId = url.searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    await prisma.eventDocument.delete({
      where: { id: documentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
