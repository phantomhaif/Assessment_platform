import { mkdir, rm, writeFile } from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { removeEventPassportPdfCaches } from "@/lib/passports"
import { prisma } from "@/lib/prisma"
import { getApiFileUrl, getUploadsFilePathFromApiUrl, getUploadsPath } from "@/lib/uploads"

type BackgroundLocale = "ru" | "en"

function normalizeLocale(value: string | null): BackgroundLocale {
  return value?.toLowerCase() === "en" ? "en" : "ru"
}

function getFieldName(locale: BackgroundLocale) {
  return locale === "en" ? "passportBackgroundEn" : "passportBackgroundRu"
}

function getOtherFieldName(locale: BackgroundLocale) {
  return locale === "en" ? "passportBackgroundRu" : "passportBackgroundEn"
}

async function authorize() {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (!["ADMIN", "ORGANIZER"].includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const authResult = await authorize()
    if ("error" in authResult) {
      return authResult.error
    }

    const { eventId } = await params
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const locale = normalizeLocale((formData.get("locale") as string | null) || "ru")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only PNG, JPEG and WebP are allowed" }, { status: 400 })
    }

    const maxSize = 15 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 15MB limit" }, { status: 400 })
    }

    const fieldName = getFieldName(locale)
    const otherFieldName = getOtherFieldName(locale)

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        passportBackgroundRu: true,
        passportBackgroundEn: true,
      },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const uploadDir = getUploadsPath("passport-backgrounds", eventId)
    await mkdir(uploadDir, { recursive: true })

    const extension = path.extname(file.name).toLowerCase() || (
      file.type === "image/png" ? ".png" :
      file.type === "image/webp" ? ".webp" :
      ".jpg"
    )
    const filename = `${locale}-${Date.now()}${extension}`
    const filePath = path.join(uploadDir, filename)

    await writeFile(filePath, Buffer.from(await file.arrayBuffer()))

    const fileUrl = getApiFileUrl("passport-backgrounds", eventId, filename)
    const previousUrl = existingEvent[fieldName]
    const otherUrl = existingEvent[otherFieldName]

    await prisma.event.update({
      where: { id: eventId },
      data: {
        [fieldName]: fileUrl,
      },
    })

    await removeEventPassportPdfCaches(eventId)

    if (previousUrl && previousUrl !== otherUrl && previousUrl !== fileUrl) {
      const previousPath = getUploadsFilePathFromApiUrl(previousUrl)
      if (previousPath) {
        await rm(previousPath, { force: true }).catch(() => undefined)
      }
    }

    return NextResponse.json({
      locale,
      url: fileUrl,
      field: fieldName,
    })
  } catch (error) {
    console.error("Error uploading passport background:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const authResult = await authorize()
    if ("error" in authResult) {
      return authResult.error
    }

    const { eventId } = await params
    const locale = normalizeLocale(req.nextUrl.searchParams.get("locale"))
    const fieldName = getFieldName(locale)
    const otherFieldName = getOtherFieldName(locale)

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        passportBackgroundRu: true,
        passportBackgroundEn: true,
      },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const previousUrl = existingEvent[fieldName]
    const otherUrl = existingEvent[otherFieldName]

    await prisma.event.update({
      where: { id: eventId },
      data: {
        [fieldName]: null,
      },
    })

    await removeEventPassportPdfCaches(eventId)

    if (previousUrl && previousUrl !== otherUrl) {
      const previousPath = getUploadsFilePathFromApiUrl(previousUrl)
      if (previousPath) {
        await rm(previousPath, { force: true }).catch(() => undefined)
      }
    }

    return NextResponse.json({ locale, success: true })
  } catch (error) {
    console.error("Error deleting passport background:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
