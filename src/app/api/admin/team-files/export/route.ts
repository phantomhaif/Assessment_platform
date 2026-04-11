import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { Readable } from "node:stream"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getTeamFilesExportArchivePath,
  getTeamFilesExportStatus,
  startBackgroundTeamFilesExport,
} from "@/lib/team-files-export"

async function requireAdminSession() {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (!["ADMIN", "ORGANIZER"].includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session }
}

function buildDownloadFilename(eventName: string) {
  const filename = `${eventName || "team-submissions"}-team-submissions.zip`
  const asciiFilename = filename.normalize("NFKD").replace(/[^\x20-\x7E]/g, "_")

  return {
    filename,
    asciiFilename,
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminSession()
    if ("error" in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")
    const download = searchParams.get("download") === "1"

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    const status = await getTeamFilesExportStatus(eventId)

    if (!status) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!download) {
      return NextResponse.json(status)
    }

    if (!status.ready) {
      return NextResponse.json(
        {
          error:
            status.teamFilesExportStatus === "RUNNING"
              ? "Archive generation is still running"
              : "Archive is not ready",
          status,
        },
        { status: 409 }
      )
    }

    const archivePath = getTeamFilesExportArchivePath(eventId)
    const archiveStats = await stat(archivePath)
    const { filename, asciiFilename } = buildDownloadFilename(status.name)

    return new NextResponse(Readable.toWeb(createReadStream(archivePath)) as ReadableStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(archiveStats.size),
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Error fetching team files export:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdminSession()
    if ("error" in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const started = await startBackgroundTeamFilesExport(eventId)
    const status = await getTeamFilesExportStatus(eventId)

    if (!started.started) {
      if (started.reason === "ready") {
        return NextResponse.json({
          queued: false,
          ready: true,
          status,
        })
      }

      return NextResponse.json(
        {
          queued: false,
          ready: false,
          status,
        },
        { status: 202 }
      )
    }

    return NextResponse.json(
      {
        queued: true,
        ready: false,
        total: started.total,
        status,
      },
      { status: 202 }
    )
  } catch (error) {
    console.error("Error starting team files export:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
