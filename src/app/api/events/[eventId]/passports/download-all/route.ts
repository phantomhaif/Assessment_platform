import { NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensurePassportPdf, readPassportPdf, type SkillPassportRecord } from "@/lib/passports"
import type { PassportLocale } from "@/lib/pdf/render-skill-passport"
import { canManageEvent, isAdmin } from "@/lib/authz"

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim() || "passport"
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const locale: PassportLocale =
      req.nextUrl.searchParams.get("lang")?.toLowerCase() === "en" ? "en" : "ru"

    const canViewAll =
      isAdmin(session.user.role) || (await canManageEvent(session, eventId))
    let expertTeamIds: string[] | null = null

    if (!canViewAll) {
      const expertTeams = session.user.role === "EXPERT"
        ? await prisma.teamMember.findMany({
            where: {
              userId: session.user.id,
              role: "EXPERT",
              team: { eventId },
            },
            select: { teamId: true },
          })
        : []

      expertTeamIds = expertTeams.map((member) => member.teamId)

      if (expertTeamIds.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const passports = await prisma.skillPassport.findMany({
      where: {
        eventId,
        user: { role: { not: "EXPERT" } },
        ...(expertTeamIds
          ? {
              teamId: { in: expertTeamIds },
              userId: { not: session.user.id },
            }
          : {}),
      },
      include: {
        user: true,
        event: {
          include: {
            assessmentSchema: {
              include: {
                modules: {
                  orderBy: { order: "asc" },
                  select: { code: true, name: true, nameEn: true },
                },
              },
            },
          },
        },
        team: true,
      },
      orderBy: { totalScore: "desc" },
    })

    if (passports.length === 0) {
      return NextResponse.json({ error: "Нет паспортов для скачивания" }, { status: 404 })
    }

    const zip = new JSZip()
    const usedNames = new Set<string>()

    for (const passport of passports) {
      await ensurePassportPdf(passport as unknown as SkillPassportRecord, locale)
      const pdfBuffer = await readPassportPdf(passport.id, locale)

      const fullName = sanitizeFileNamePart(
        `${passport.user.lastName} ${passport.user.firstName}`.trim()
      )
      let entryName = `${fullName}.pdf`
      let counter = 2
      while (usedNames.has(entryName)) {
        entryName = `${fullName} (${counter}).pdf`
        counter += 1
      }
      usedNames.add(entryName)

      zip.file(entryName, pdfBuffer)
    }

    const archive = await zip.generateAsync({ type: "nodebuffer" })

    const eventName = passports[0]?.event?.name || "event"
    const zipName = `${sanitizeFileNamePart(eventName)}-skill-passports-${locale}.zip`
    const asciiZipName = zipName.normalize("NFKD").replace(/[^\x20-\x7E]/g, "_")

    return new NextResponse(new Uint8Array(archive), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(archive.length),
        "Content-Disposition": `attachment; filename="${asciiZipName}"; filename*=UTF-8''${encodeURIComponent(zipName)}`,
      },
    })
  } catch (error) {
    console.error("Error generating passports archive:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
