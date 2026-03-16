import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessEventDocument, resolveEventDocumentAccessContext } from "@/lib/event-document-access"
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
    const session = await auth()
    const { eventId } = await params

    const allDocuments = await prisma.eventDocument.findMany({
      where: { eventId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })

    const accessContext = await resolveEventDocumentAccessContext(
      eventId,
      session?.user?.id,
      session?.user?.role
    )

    const documents =
      accessContext.isAdminOrOrganizer
        ? allDocuments
        : allDocuments.filter((document) => canAccessEventDocument(document.access, accessContext))

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
    const accessString = formData.get("access") as string
    const access = accessString ? JSON.parse(accessString) : ["PARTICIPANTS"]

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

    const lastDocument = await prisma.eventDocument.findFirst({
      where: { eventId },
      orderBy: [{ order: "desc" }, { createdAt: "desc" }],
      select: { order: true },
    })

    // Create document record (use API route for serving files)
    const document = await prisma.eventDocument.create({
      data: {
        eventId,
        name,
        type: type as any,
        access: Array.isArray(access) ? access : [access],
        fileUrl: `/api/files/documents/${eventId}/${filename}`,
        version: newVersion,
        order: (lastDocument?.order ?? -1) + 1,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Ошибка загрузки документа" }, { status: 500 })
  }
}

export async function PATCH(
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
    const body = await req.json()
    const orderedIds: string[] = Array.isArray(body?.orderedIds)
      ? body.orderedIds.filter((id: unknown): id is string => typeof id === "string")
      : []

    if (orderedIds.length === 0) {
      return NextResponse.json({ error: "Ordered document IDs are required" }, { status: 400 })
    }

    const existingDocuments = await prisma.eventDocument.findMany({
      where: { eventId },
      select: { id: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })

    if (existingDocuments.length !== orderedIds.length) {
      return NextResponse.json({ error: "Invalid document list length" }, { status: 400 })
    }

    const existingIds = new Set(existingDocuments.map((doc) => doc.id))
    if (orderedIds.some((id) => !existingIds.has(id))) {
      return NextResponse.json({ error: "Invalid document IDs" }, { status: 400 })
    }

    await prisma.$transaction(
      orderedIds.map((documentId, index) =>
        prisma.eventDocument.update({
          where: { id: documentId },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering documents:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
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
