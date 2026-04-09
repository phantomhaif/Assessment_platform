import { existsSync } from "fs"
import { mkdir, readFile, rm, writeFile } from "fs/promises"
import path from "path"
import { renderSkillPassportPdf, type PassportLocale, type SkillPassportData } from "@/lib/pdf/render-skill-passport"
import { prisma } from "@/lib/prisma"
import { UPLOADS_BASE } from "@/lib/uploads"
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
    nameEn?: string | null
    competency: string
    competencyEn?: string | null
    passportBackgroundRu?: string | null
    passportBackgroundEn?: string | null
    eventStart: Date
    eventEnd: Date
    assessmentSchema?: {
      modules: {
        code: string
        name: string
        nameEn?: string | null
      }[]
    } | null
  }
  team: {
    name: string
  } | null
}

const PASSPORT_CACHE_VERSION = "v5"

function capitalize(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function hasCyrillic(value: string) {
  return /[А-Яа-яЁё]/.test(value)
}

function transliterateRu(value: string) {
  const map: Record<string, string> = {
    А: "A", а: "a", Б: "B", б: "b", В: "V", в: "v", Г: "G", г: "g",
    Д: "D", д: "d", Е: "E", е: "e", Ё: "E", ё: "e", Ж: "Zh", ж: "zh",
    З: "Z", з: "z", И: "I", и: "i", Й: "Y", й: "y", К: "K", к: "k",
    Л: "L", л: "l", М: "M", м: "m", Н: "N", н: "n", О: "O", о: "o",
    П: "P", п: "p", Р: "R", р: "r", С: "S", с: "s", Т: "T", т: "t",
    У: "U", у: "u", Ф: "F", ф: "f", Х: "Kh", х: "kh", Ц: "Ts", ц: "ts",
    Ч: "Ch", ч: "ch", Ш: "Sh", ш: "sh", Щ: "Shch", щ: "shch", Ъ: "", ъ: "",
    Ы: "Y", ы: "y", Ь: "", ь: "", Э: "E", э: "e", Ю: "Yu", ю: "yu",
    Я: "Ya", я: "ya",
  }

  return value
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
}

function toEnglishText(primary: string | null | undefined, fallback: string | null | undefined) {
  const primaryValue = primary?.trim()
  if (primaryValue) return primaryValue
  const fallbackValue = fallback?.trim() || ""
  return hasCyrillic(fallbackValue) ? transliterateRu(fallbackValue) : fallbackValue
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
  const schemaModulesByCode = new Map(
    (passport.event.assessmentSchema?.modules || []).map((module) => [module.code, module])
  )

  const skillGroups = ((passport.skillGroupScores as ScoreGroup[]) || []).map((group, index) => ({
    number: Number(group.number ?? index + 1),
    name:
      locale === "en"
        ? toEnglishText(group.nameEn, group.name) || `Skill group ${Number(group.number ?? index + 1)}`
        : group.name || group.nameEn || `Группа ${Number(group.number ?? index + 1)}`,
    score: Number(group.score ?? 0),
    maxScore: Number(group.maxScore ?? 0),
  }))

  const modules = ((passport.moduleScores as ScoreModule[]) || []).map((module, index) => ({
    code: String(module.code || String.fromCharCode(65 + index)),
    name:
      (() => {
        const schemaModule = schemaModulesByCode.get(String(module.code || ""))
        if (locale === "en") {
          return (
            (module.nameEn || schemaModule?.nameEn || "").trim() ||
            module.name ||
            schemaModule?.name ||
            `Module ${String(module.code || index + 1)}`
          )
        }
        return module.name || schemaModule?.name || module.nameEn || schemaModule?.nameEn || `Модуль ${String(module.code || index + 1)}`
      })(),
    score: Number(module.score ?? 0),
    maxScore: Number(module.maxScore ?? 0),
  }))

  return {
    participantName:
      locale === "en"
        ? toEnglishText(
            [passport.user.lastName, passport.user.firstName].filter(Boolean).join(" "),
            [passport.user.lastName, passport.user.firstName].filter(Boolean).join(" ")
          )
        : `${passport.user.lastName} ${passport.user.firstName}`,
    participantMiddleName:
      locale === "en"
        ? toEnglishText(passport.user.middleName, passport.user.middleName) || undefined
        : passport.user.middleName || undefined,
    organization:
      locale === "en"
        ? toEnglishText(passport.user.organization, passport.team?.name || "") || ""
        : passport.user.organization || passport.team?.name || "",
    eventName:
      locale === "en"
        ? toEnglishText(passport.event.nameEn, passport.event.name)
        : passport.event.name,
    competency:
      locale === "en"
        ? toEnglishText(passport.event.competencyEn, passport.event.competency)
        : passport.event.competency,
    passportBackgroundUrl:
      locale === "en"
        ? passport.event.passportBackgroundEn || passport.event.passportBackgroundRu || undefined
        : passport.event.passportBackgroundRu || passport.event.passportBackgroundEn || undefined,
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
  return `skill-passport-${passportId}-${locale}-${PASSPORT_CACHE_VERSION}.pdf`
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

export async function removeEventPassportPdfCaches(eventId: string): Promise<void> {
  const passports = await prisma.skillPassport.findMany({
    where: { eventId },
    select: { id: true },
  })

  await Promise.all(passports.map((passport) => removePassportPdfCache(passport.id)))
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
