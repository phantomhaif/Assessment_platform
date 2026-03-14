import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import JSZip from "jszip"
import path from "path"
import { existsSync } from "fs"
import { readFile } from "fs/promises"

const UPLOADS_BASE =
  process.env.NODE_ENV === "production"
    ? "/app/uploads"
    : path.join(process.cwd(), "public", "uploads")

const sanitizePathSegment = (value: string) =>
  value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "unnamed"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        assessmentSchema: {
          include: {
            modules: {
              orderBy: {
                order: "asc",
              },
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        teams: {
          orderBy: [{ number: "asc" }, { name: "asc" }],
          include: {
            files: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const zip = new JSZip()
    const eventFolder = zip.folder(sanitizePathSegment(event.name))

    if (!eventFolder) {
      return NextResponse.json({ error: "Failed to create archive" }, { status: 500 })
    }

    const schemaModules = event.assessmentSchema?.modules ?? []

    for (const team of event.teams) {
      const teamFolderName = sanitizePathSegment(
        team.number ? `${team.number}_${team.name}` : team.name
      )
      const teamFolder = eventFolder.folder(teamFolderName)
      if (!teamFolder) continue

      const moduleFolders = new Map<string, JSZip>()
      schemaModules.forEach((module) => {
        const moduleFolder = teamFolder.folder(
          sanitizePathSegment(`${module.code}_${module.name || module.code}`)
        )

        if (moduleFolder) {
          moduleFolders.set(module.code, moduleFolder)
        }
      })

      for (const file of team.files) {
        const relativeFilePath = file.fileUrl.replace(/^\/api\/files\//, "")
        const fullFilePath = path.join(UPLOADS_BASE, relativeFilePath)
        if (!existsSync(fullFilePath)) continue

        const moduleFolder =
          moduleFolders.get(file.moduleCode) ??
          teamFolder.folder(sanitizePathSegment(file.moduleCode))

        if (!moduleFolder) continue

        const buffer = await readFile(fullFilePath)
        moduleFolder.file(sanitizePathSegment(file.fileName), buffer)
      }
    }

    const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })
    const filename = `${sanitizePathSegment(event.name)}-team-submissions.zip`
    const asciiFilename = filename.normalize("NFKD").replace(/[^\x20-\x7E]/g, "_")

    return new NextResponse(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Error exporting team files:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
