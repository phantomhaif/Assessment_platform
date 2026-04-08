import path from "path"

export const UPLOADS_BASE =
  process.env.NODE_ENV === "production"
    ? "/app/uploads"
    : path.join(process.cwd(), "public", "uploads")

export function getUploadsPath(...segments: string[]) {
  return path.join(UPLOADS_BASE, ...segments)
}

export function getApiFileUrl(...segments: string[]) {
  const normalized = segments
    .flatMap((segment) => segment.split(/[\\/]+/))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return `/api/files/${normalized}`
}

export function getUploadsFilePathFromApiUrl(fileUrl: string) {
  if (!fileUrl.startsWith("/api/files/")) {
    return null
  }

  const relativePath = fileUrl
    .slice("/api/files/".length)
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))

  if (relativePath.length === 0) {
    return null
  }

  return path.join(UPLOADS_BASE, ...relativePath)
}
