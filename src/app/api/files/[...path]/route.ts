import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// Use Railway Volume path in production, local public folder in development
const UPLOADS_BASE = process.env.NODE_ENV === "production"
  ? "/app/uploads"
  : path.join(process.cwd(), "public", "uploads")

// MIME types mapping
const MIME_TYPES: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Archives
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  // Text
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "File path required" }, { status: 400 })
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = pathSegments
      .map(segment => segment.replace(/\.\./g, "").replace(/[<>:"|?*]/g, ""))
      .join("/")

    const filePath = path.join(UPLOADS_BASE, sanitizedPath)

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Determine MIME type
    const extension = path.extname(filePath).slice(1).toLowerCase()
    const mimeType = MIME_TYPES[extension] || "application/octet-stream"

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
