import { existsSync } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { prisma } from "@/lib/prisma"
import { getUploadsPath } from "@/lib/uploads"

const STATUS_RUNNING = "RUNNING"
const STATUS_COMPLETED = "COMPLETED"
const STATUS_FAILED = "FAILED"
const ARCHIVE_FILE_NAME = "team-submissions.zip"
const STATUS_FILE_NAME = "status.json"
const MANIFEST_FILE_NAME = "manifest.json"
const STALE_RUNNING_MS = 1000 * 60 * 60 * 2

type WorkerStatusFile = {
  status: string | null
  total: number
  completed: number
  error: string | null
  startedAt: string | null
  finishedAt: string | null
  cachedAt: string | null
}

type ExportEntry = {
  fullFilePath: string
  zipFolderPath: string[]
  outputFileName: string
}

type ExportManifest = {
  archivePath: string
  statusPath: string
  total: number
  rootFolderName: string
  startedAt: string
  entries: ExportEntry[]
}

const sanitizePathSegment = (value: string) =>
  value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "unnamed"

function getArchiveDir(eventId: string) {
  return getUploadsPath("team-file-archives", eventId)
}

function getArchivePath(eventId: string) {
  return path.join(getArchiveDir(eventId), ARCHIVE_FILE_NAME)
}

function getStatusPath(eventId: string) {
  return path.join(getArchiveDir(eventId), STATUS_FILE_NAME)
}

function getManifestPath(eventId: string) {
  return path.join(getArchiveDir(eventId), MANIFEST_FILE_NAME)
}

function getWorkerScriptPath() {
  return path.join(process.cwd(), "public", "workers", "team-files-export-worker.cjs")
}

async function readStatusFile(eventId: string): Promise<WorkerStatusFile | null> {
  const statusPath = getStatusPath(eventId)

  if (!existsSync(statusPath)) {
    return null
  }

  try {
    const raw = await readFile(statusPath, "utf8")
    return JSON.parse(raw) as WorkerStatusFile
  } catch {
    return null
  }
}

async function writeStatusFile(eventId: string, status: WorkerStatusFile) {
  await mkdir(getArchiveDir(eventId), { recursive: true })
  await writeFile(getStatusPath(eventId), JSON.stringify(status), "utf8")
}

function isStaleRunningStatus(status: WorkerStatusFile | null) {
  if (!status || status.status !== STATUS_RUNNING || !status.startedAt) {
    return false
  }

  return Date.now() - new Date(status.startedAt).getTime() > STALE_RUNNING_MS
}

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

function collectExportEntries(event: NonNullable<Awaited<ReturnType<typeof loadTeamFilesExportSource>>>) {
  const schemaModules = event.assessmentSchema?.modules ?? []
  const entries: ExportEntry[] = []

  for (const team of event.teams) {
    const teamFolderName = sanitizePathSegment(team.number ? `${team.number}_${team.name}` : team.name)
    const moduleFolderNames = new Map<string, string>()

    schemaModules.forEach((module) => {
      moduleFolderNames.set(module.code, sanitizePathSegment(`${module.code}_${module.name || module.code}`))
    })

    for (const file of team.files) {
      const relativeFilePath = file.fileUrl.replace(/^\/api\/files\//, "")
      const fullFilePath = getUploadsPath(relativeFilePath)

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

export async function invalidateTeamFilesExportCache(eventId: string) {
  await rm(getArchiveDir(eventId), { recursive: true, force: true })
}

export async function getTeamFilesExportStatus(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
    },
  })

  if (!event) {
    return null
  }

  const status = await readStatusFile(eventId)
  const archiveExists = existsSync(getArchivePath(eventId))
  const ready = status?.status === STATUS_COMPLETED && archiveExists

  return {
    id: event.id,
    name: event.name,
    teamFilesExportStatus: status?.status ?? null,
    teamFilesExportTotal: status?.total ?? 0,
    teamFilesExportCompleted: status?.completed ?? 0,
    teamFilesExportError: status?.error ?? null,
    teamFilesExportStartedAt: status?.startedAt ?? null,
    teamFilesExportFinishedAt: status?.finishedAt ?? null,
    teamFilesExportCachedAt: status?.cachedAt ?? null,
    ready,
  }
}

export async function startBackgroundTeamFilesExport(eventId: string) {
  const currentStatus = await readStatusFile(eventId)
  const archiveExists = existsSync(getArchivePath(eventId))

  if (currentStatus?.status === STATUS_COMPLETED && archiveExists) {
    return { started: false, reason: "ready" as const, total: currentStatus.total }
  }

  if (currentStatus?.status === STATUS_RUNNING && !isStaleRunningStatus(currentStatus)) {
    return { started: false, reason: "already-running" as const, total: currentStatus.total }
  }

  const event = await loadTeamFilesExportSource(eventId)
  if (!event) {
    throw new Error("Event not found")
  }

  const entries = collectExportEntries(event)
  const total = entries.length + 1
  const archiveDir = getArchiveDir(eventId)
  const archivePath = getArchivePath(eventId)
  const statusPath = getStatusPath(eventId)
  const manifestPath = getManifestPath(eventId)

  await rm(archiveDir, { recursive: true, force: true })
  await mkdir(archiveDir, { recursive: true })

  const startedAt = new Date().toISOString()

  await writeStatusFile(eventId, {
    status: STATUS_RUNNING,
    total,
    completed: 0,
    error: null,
    startedAt,
    finishedAt: null,
    cachedAt: null,
  })

  const manifest: ExportManifest = {
    archivePath,
    statusPath,
    total,
    rootFolderName: sanitizePathSegment(event.name),
    startedAt,
    entries,
  }

  await writeFile(manifestPath, JSON.stringify(manifest), "utf8")

  const workerScriptPath = getWorkerScriptPath()
  if (!existsSync(workerScriptPath)) {
    throw new Error("ZIP worker script not found")
  }

  const child = spawn(process.execPath, [workerScriptPath, manifestPath], {
    detached: true,
    stdio: "ignore",
  })

  child.unref()

  return { started: true, total }
}

export async function readTeamFilesExportArchive(eventId: string) {
  return readFile(getArchivePath(eventId))
}
