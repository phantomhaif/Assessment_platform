import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderSkillPassportPdf } from "@/lib/pdf/render-skill-passport"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    const dateRange = formatDateRange(startDate, endDate)

    const skillGroups = (passport.skillGroupScores as any[]) || []
    const formattedSkillGroups = skillGroups.map((group: any) => ({
      number: group.number,
      name: group.name || group.nameEn || `Группа ${group.number}`,
      score: group.score,
      maxScore: group.maxScore,
    }))

    const modules = (passport.moduleScores as any[]) || []
    const formattedModules = modules.map((module: any) => ({
      code: module.code,
      name: module.name || `Модуль ${module.code}`,
      score: module.score,
      maxScore: module.maxScore,
    }))

    const passportData = {
      participantName: `${passport.user.lastName} ${passport.user.firstName}`,
      participantMiddleName: passport.user.middleName || undefined,
      organization: passport.user.organization || passport.team?.name || "",
      eventName: passport.event.name,
      competency: passport.event.competency,
      dateRange,
      totalScore: passport.totalScore,
      skillGroups: formattedSkillGroups,
      modules: formattedModules,
    }

    const pdfBuffer = await renderSkillPassportPdf(passportData)

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="skill-passport-${passport.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

function formatDateRange(start: Date, end: Date): string {
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ]

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}-${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()} г.`
  }

  return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()} г.`
}
