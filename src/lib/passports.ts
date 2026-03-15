import { existsSync } from "fs"
import { mkdir, readFile, rm, writeFile } from "fs/promises"
import path from "path"
import { renderSkillPassportPdf, type PassportLocale, type SkillPassportData } from "@/lib/pdf/render-skill-passport"

type ScoreGroup = {
  number?: number
  name?: string
  nameEn?: string
  score?: number
  maxScore?: number
}

type ScoreModule = {
  code?: string
  name?: string
  nameEn?: string
  score?: number
  maxScore?: number
}

export type SkillPassportRecord = {
  id: string
  totalScore: number
  moduleScores: unknown
  skillGroupScores: unknown
  user: {
    firstName: string
    lastName: string
    middleName: string | null
    organization: string | null
  }
  event: {
    name: string
    competency: string
    eventStart: Date
    eventEnd: Date
  }
  team: {
    name: string
  } | null
}

const UPLOADS_BASE = process.env.NODE_ENV === "production"
  ? "/app/uploads"
  : path.join(process.cwd(), "public", "uploads")

function capitalize(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatPassportDateRange(
  start: Date,
  end: Date,
  locale: PassportLocale
): string {
  const monthLocale = locale === "en" ? "en-US" : "ru-RU"
  const monthFormatter = new Intl.DateTimeFormat(monthLocale, {
    month: "long",
    timeZone: "UTC",
  })

  const startDay = start.getUTCDate()
  const endDay = end.getUTCDate()
  const startMonth = monthFormatter.format(start)
  const endMonth = monthFormatter.format(end)
  const startYear = start.getUTCFullYear()
  const endYear = end.getUTCFullYear()
  const sameMonth = start.getUTCMonth() === end.getUTCMonth() && startYear === endYear

  if (locale === "en") {
    if (sameMonth) return `${startDay}-${endDay} ${capitalize(endMonth)} ${endYear}`
    if (startYear === endYear) {
      return `${startDay} ${capitalize(startMonth)} - ${endDay} ${capitalize(endMonth)} ${endYear}`
    }
    return `${startDay} ${capitalize(startMonth)} ${startYear} - ${endDay} ${capitalize(endMonth)} ${endYear}`
  }

  if (sameMonth) return `${startDay}-${endDay} ${endMonth} ${endYear} г.`
  if (startYear === endYear) return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear} г.`
  return `${startDay} ${startMonth} ${startYear} г. - ${endDay} ${endMonth} ${endYear} г.`
}

export function buildSkillPassportData(
  passport: SkillPassportRecord,
  locale: PassportLocale
): SkillPassportData {
  const skillGroups = ((passport.skillGroupScores as ScoreGroup[]) || []).map((group, index) => ({
    number: Number(group.number ?? index + 1),
    name:
      locale === "en"
        ? group.nameEn || group.name || `Skill group ${Number(group.number ?? index + 1)}`
        : group.name || group.nameEn || `Группа ${Number(group.number ?? index + 1)}`,
    score: Number(group.score ?? 0),
    maxScore: Number(group.maxScore ?? 0),
  }))

  const modules = ((passport.moduleScores as ScoreModule[]) || []).map((module, index) => ({
    code: String(module.code || String.fromCharCode(65 + index)),
    name:
      locale === "en"
        ? module.nameEn || module.name || `Module ${String(module.code || index + 1)}`
        : module.name || module.nameEn || `Модуль ${String(module.code || index + 1)}`,
    score: Number(module.score ?? 0),
    maxScore: Number(module.maxScore ?? 0),
  }))

  return {
    participantName: `${passport.user.lastName} ${passport.user.firstName}`,
    participantMiddleName: passport.user.middleName || undefined,
    organization: passport.user.organization || passport.team?.name || "",
    eventName: passport.event.name,
    competency: passport.event.competency,
    dateRange: formatPassportDateRange(
      new Date(passport.event.eventStart),
      new Date(passport.event.eventEnd),
      locale
    ),
    totalScore: Number(passport.totalScore ?? 0),
    locale,
    skillGroups,
    modules,
  }
}

export function getPassportPdfFileName(passportId: string, locale: PassportLocale): string {
  return `skill-passport-${passportId}-${locale}.pdf`
}

export function getPassportPdfDir(passportId: string): string {
  return path.join(UPLOADS_BASE, "passports", passportId)
}

export function getPassportPdfFilePath(passportId: string, locale: PassportLocale): string {
  return path.join(getPassportPdfDir(passportId), getPassportPdfFileName(passportId, locale))
}

export function getPassportPdfFileUrl(passportId: string, locale: PassportLocale): string {
  return `/api/files/passports/${passportId}/${getPassportPdfFileName(passportId, locale)}`
}

export async function removePassportPdfCache(passportId: string): Promise<void> {
  await rm(getPassportPdfDir(passportId), { recursive: true, force: true })
}

export async function ensurePassportPdf(
  passport: SkillPassportRecord,
  locale: PassportLocale,
  force = false
): Promise<{ filePath: string; fileUrl: string }> {
  const filePath = getPassportPdfFilePath(passport.id, locale)
  const fileUrl = getPassportPdfFileUrl(passport.id, locale)

  if (!force && existsSync(filePath)) {
    return { filePath, fileUrl }
  }

  await mkdir(getPassportPdfDir(passport.id), { recursive: true })
  const pdf = await renderSkillPassportPdf(buildSkillPassportData(passport, locale))
  await writeFile(filePath, Buffer.from(pdf))

  return { filePath, fileUrl }
}

export async function readPassportPdf(passportId: string, locale: PassportLocale): Promise<Buffer> {
  return readFile(getPassportPdfFilePath(passportId, locale))
}
