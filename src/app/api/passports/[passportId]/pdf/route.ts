import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderSkillPassportPdf, type PassportLocale } from "@/lib/pdf/render-skill-passport"

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const locale: PassportLocale =
      req.nextUrl.searchParams.get("lang")?.toLowerCase() === "en" ? "en" : "ru"

    const { passportId } = await params

    const passport = await prisma.skillPassport.findUnique({
      where: { id: passportId },
      include: {
        user: true,
        event: true,
        team: true,
      },
    })

    if (!passport) {
      return NextResponse.json({ error: "Passport not found" }, { status: 404 })
    }

    if (
      passport.userId !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "ORGANIZER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const startDate = new Date(passport.event.eventStart)
    const endDate = new Date(passport.event.eventEnd)
    const dateRange = formatDateRange(startDate, endDate, locale)

    const skillGroups = ((passport.skillGroupScores as unknown as ScoreGroup[]) || []).map(
      (group, index) => ({
        number: Number(group.number ?? index + 1),
        name:
          locale === "en"
            ? group.nameEn || group.name || `Skill group ${Number(group.number ?? index + 1)}`
            : group.name || group.nameEn || `Группа ${Number(group.number ?? index + 1)}`,
        score: Number(group.score ?? 0),
        maxScore: Number(group.maxScore ?? 0),
      })
    )

    const modules = ((passport.moduleScores as unknown as ScoreModule[]) || []).map(
      (module, index) => ({
        code: String(module.code || String.fromCharCode(65 + index)),
        name:
          locale === "en"
            ? module.nameEn || module.name || `Module ${String(module.code || index + 1)}`
            : module.name || module.nameEn || `Модуль ${String(module.code || index + 1)}`,
        score: Number(module.score ?? 0),
        maxScore: Number(module.maxScore ?? 0),
      })
    )

    const passportData = {
      participantName: `${passport.user.lastName} ${passport.user.firstName}`,
      participantMiddleName: passport.user.middleName || undefined,
      organization: passport.user.organization || passport.team?.name || "",
      eventName: passport.event.name,
      competency: passport.event.competency,
      dateRange,
      totalScore: Number(passport.totalScore ?? 0),
      locale,
      skillGroups,
      modules,
    }

    const pdfBuffer = await renderSkillPassportPdf(passportData)

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="skill-passport-${passport.id}-${locale}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating passport PDF:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

function formatDateRange(start: Date, end: Date, locale: PassportLocale): string {
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
    if (startYear === endYear) return `${startDay} ${capitalize(startMonth)} - ${endDay} ${capitalize(endMonth)} ${endYear}`
    return `${startDay} ${capitalize(startMonth)} ${startYear} - ${endDay} ${capitalize(endMonth)} ${endYear}`
  }

  if (sameMonth) return `${startDay}-${endDay} ${endMonth} ${endYear} г.`
  if (startYear === endYear) return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear} г.`
  return `${startDay} ${startMonth} ${startYear} г. - ${endDay} ${endMonth} ${endYear} г.`
}

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}
