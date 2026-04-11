import { existsSync } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import JSZip from "jszip"
import { prisma } from "@/lib/prisma"
import { UPLOADS_BASE, getUploadsPath } from "@/lib/uploads"

const TEAM_FILES_EXPORT_STATUS = {
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const

declare global {
  // eslint-disable-next-line no-var
  var __teamFilesExportJobs: Set<string> | undefined
}

const runningJobs = globalThis.__teamFilesExportJobs ?? (globalThis.__teamFilesExportJobs = new Set<string>())

const sanitizePathSegment = (value: string) =>
  value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "unnamed"

function getArchiveDir(eventId: string) {
  return getUploadsPath("team-file-archives", eventId)
}

function getArchivePath(eventId: string) {
  return path.join(getArchiveDir(eventId), "team-submissions.zip")
}

type ExportStatusRecord = {
  teamFilesExportStatus: string | null
  teamFilesExportTotal: number
  teamFilesExportCompleted: number
  teamFilesExportError: string | null
  teamFilesExportStartedAt: Date | null
  teamFilesExportFinishedAt: Date | null
  teamFilesExportCachedAt: Date | null
}

export async function getTeamFilesExportStatus(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      teamFilesExportStatus: true,
      teamFilesExportTotal: true,
      teamFilesExportCompleted: true,
      teamFilesExportError: true,
      teamFilesExportStartedAt: true,
      teamFilesExportFinishedAt: true,
      teamFilesExportCachedAt: true,
    },
  })

  if (!event) {
    return null
  }

  const archivePath = getArchivePath(eventId)
  const ready =
    event.teamFilesExportStatus === TEAM_FILES_EXPORT_STATUS.COMPLETED &&
    !!event.teamFilesExportCachedAt &&
    existsSync(archivePath)

  return {
    ...event,
    ready,
  }
}

export async function invalidateTeamFilesExportCache(eventId: string) {
  await rm(getArchiveDir(eventId), { recursive: true, force: true })

  await prisma.event.update({
    where: { id: eventId },
    data: {
      teamFilesExportStatus: null,
      teamFilesExportTotal: 0,
      teamFilesExportCompleted: 0,
      teamFilesExportError: null,
      teamFilesExportStartedAt: null,
      teamFilesExportFinishedAt: null,
      teamFilesExportCachedAt: null,
    },
  }).catch(() => undefined)
}

type LoadedEvent = Awaited<ReturnType<typeof loadTeamFilesExportSource>>

async function loadTeamFilesExportSource(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      assessmentSchema: {
        include: {
          modules: {
            orderBy: { order: "asc" },
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
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })
}

type ExportEntry = {
  fullFilePath: string
  zipFolderPath: string[]
  outputFileName: string
}

function collectExportEntries(event: NonNullable<LoadedEvent>) {
  const entries: ExportEntry[] = []
  const schemaModules = event.assessmentSchema?.modules ?? []

  for (const team of event.teams) {
    const teamFolderName = sanitizePathSegment(team.number ? `${team.number}_${team.name}` : team.name)
    const moduleFolderNames = new Map<string, string>()

    schemaModules.forEach((module) => {
      moduleFolderNames.set(module.code, sanitizePathSegment(`${module.code}_${module.name || module.code}`))
    })

    for (const file of team.files) {
      const relativeFilePath = file.fileUrl.replace(/^\/api\/files\//, "")
      const fullFilePath = path.join(UPLOADS_BASE, relativeFilePath)

      if (!existsSync(fullFilePath)) {
        continue
      }

      entries.push({
        fullFilePath,
        zipFolderPath: [
          sanitizePathSegment(event.name),
          teamFolderName,
          moduleFolderNames.get(file.moduleCode) ?? sanitizePathSegment(file.moduleCode),
        ],
        outputFileName: sanitizePathSegment(file.fileName),
      })
    }
  }

  return entries
}

export async function startBackgroundTeamFilesExport(eventId: string) {
  const currentStatus = await getTeamFilesExportStatus(eventId)

  if (!currentStatus) {
    throw new Error("Event not found")
  }

  if (currentStatus.ready) {
    return { started: false, reason: "ready" as const, total: currentStatus.teamFilesExportTotal }
  }

  if (runningJobs.has(eventId) || currentStatus.teamFilesExportStatus === TEAM_FILES_EXPORT_STATUS.RUNNING) {
    return { started: false, reason: "already-running" as const, total: currentStatus.teamFilesExportTotal }
  }

  const event = await loadTeamFilesExportSource(eventId)

  if (!event) {
    throw new Error("Event not found")
  }

  const entries = collectExportEntries(event)
  const totalSteps = entries.length + 1

  await rm(getArchiveDir(eventId), { recursive: true, force: true })

  await prisma.event.update({
    where: { id: eventId },
    data: {
      teamFilesExportStatus: TEAM_FILES_EXPORT_STATUS.RUNNING,
      teamFilesExportTotal: totalSteps,
      teamFilesExportCompleted: 0,
      teamFilesExportError: null,
      teamFilesExportStartedAt: new Date(),
      teamFilesExportFinishedAt: null,
      teamFilesExportCachedAt: null,
    },
  })

  runningJobs.add(eventId)

  setTimeout(() => {
    void runBackgroundTeamFilesExport(eventId)
  }, 0)

  return { started: true, total: totalSteps }
}

async function updateProgress(eventId: string, data: Partial<ExportStatusRecord>) {
  await prisma.event.update({
    where: { id: eventId },
    data,
  })
}

async function runBackgroundTeamFilesExport(eventId: string) {
  try {
    const event = await loadTeamFilesExportSource(eventId)

    if (!event) {
      throw new Error("Event not found")
    }

    const entries = collectExportEntries(event)
    const zip = new JSZip()
    const totalSteps = entries.length + 1
    let completed = 0

    for (const entry of entries) {
      const fileBuffer = await readFile(entry.fullFilePath)
      const folder = zip.folder(entry.zipFolderPath.join("/"))

      if (folder) {
        folder.file(entry.outputFileName, fileBuffer)
      }

      completed += 1
      await updateProgress(eventId, {
        teamFilesExportCompleted: completed,
        teamFilesExportTotal: totalSteps,
        teamFilesExportError: null,
      })
    }

    if (entries.length === 0) {
      zip.folder(sanitizePathSegment(event.name))
    }

    const archiveBuffer = await zip.generateAsync({
      type: "nodebuffer",
      streamFiles: true,
      compression: "STORE",
    })

    await mkdir(getArchiveDir(eventId), { recursive: true })
    await writeFile(getArchivePath(eventId), archiveBuffer)

    await updateProgress(eventId, {
      teamFilesExportStatus: TEAM_FILES_EXPORT_STATUS.COMPLETED,
      teamFilesExportTotal: totalSteps,
      teamFilesExportCompleted: totalSteps,
      teamFilesExportError: null,
      teamFilesExportFinishedAt: new Date(),
      teamFilesExportCachedAt: new Date(),
    })
  } catch (error) {
    console.error("Background team files export failed:", error)

    await updateProgress(eventId, {
      teamFilesExportStatus: TEAM_FILES_EXPORT_STATUS.FAILED,
      teamFilesExportError: error instanceof Error ? error.message : "Unknown error",
      teamFilesExportFinishedAt: new Date(),
      teamFilesExportCachedAt: null,
    }).catch(() => undefined)
  } finally {
    runningJobs.delete(eventId)
  }
}

export async function readTeamFilesExportArchive(eventId: string) {
  return readFile(getArchivePath(eventId))
}
