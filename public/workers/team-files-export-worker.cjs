const fs = require("node:fs")
const fsp = require("node:fs/promises")
const path = require("node:path")

const STATUS_RUNNING = "RUNNING"
const STATUS_COMPLETED = "COMPLETED"
const STATUS_FAILED = "FAILED"

async function writeStatus(statusPath, status) {
  await fsp.mkdir(path.dirname(statusPath), { recursive: true })
  await fsp.writeFile(statusPath, JSON.stringify(status), "utf8")
}

async function main() {
  const manifestPath = process.argv[2]
  if (!manifestPath) {
    throw new Error("Manifest path is required")
  }

  const JSZip = require("jszip")
  const manifestRaw = await fsp.readFile(manifestPath, "utf8")
  const manifest = JSON.parse(manifestRaw)
  const zip = new JSZip()
  let completed = 0

  try {
    for (const entry of manifest.entries) {
      if (!fs.existsSync(entry.fullFilePath)) {
        completed += 1
        await writeStatus(manifest.statusPath, {
          status: STATUS_RUNNING,
          total: manifest.total,
          completed,
          error: null,
          startedAt: manifest.startedAt,
          finishedAt: null,
          cachedAt: null,
        })
        continue
      }

      const fileBuffer = await fsp.readFile(entry.fullFilePath)
      const folder = zip.folder(entry.zipFolderPath.join("/"))

      if (folder) {
        folder.file(entry.outputFileName, fileBuffer)
      }

      completed += 1
      await writeStatus(manifest.statusPath, {
        status: STATUS_RUNNING,
        total: manifest.total,
        completed,
        error: null,
        startedAt: manifest.startedAt,
        finishedAt: null,
        cachedAt: null,
      })
    }

    if (manifest.entries.length === 0) {
      zip.folder(manifest.rootFolderName)
    }

    const archiveBuffer = await zip.generateAsync({
      type: "nodebuffer",
      streamFiles: true,
      compression: "STORE",
    })

    await fsp.mkdir(path.dirname(manifest.archivePath), { recursive: true })
    await fsp.writeFile(manifest.archivePath, archiveBuffer)

    await writeStatus(manifest.statusPath, {
      status: STATUS_COMPLETED,
      total: manifest.total,
      completed: manifest.total,
      error: null,
      startedAt: manifest.startedAt,
      finishedAt: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
    })
  } catch (error) {
    await writeStatus(manifest.statusPath, {
      status: STATUS_FAILED,
      total: manifest.total,
      completed,
      error: error instanceof Error ? error.message : "Unknown error",
      startedAt: manifest.startedAt,
      finishedAt: new Date().toISOString(),
      cachedAt: null,
    })
    throw error
  }
}

main().catch(() => {
  process.exit(1)
})
