import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { computeEventResults, loadEventResultsSource } from "@/lib/event-results"
import { ensurePassportPdf, removePassportPdfCache, type SkillPassportRecord } from "@/lib/passports"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params
    const event = await loadEventResultsSource(eventId)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.assessmentSchema) {
      return NextResponse.json({ error: "No assessment schema" }, { status: 400 })
    }

    const results = computeEventResults(event)
    let passportsPrepared = 0
    let pdfsPrepared = 0

    for (const team of results) {
      for (const member of team.members) {
        const passport = await prisma.skillPassport.upsert({
          where: {
            userId_eventId: {
              userId: member.userId,
              eventId,
            },
          },
          update: {
            teamId: team.teamId,
            totalScore: team.totalScore,
            moduleScores: team.moduleScores,
            skillGroupScores: team.skillGroupScores,
            publishedAt: null,
          },
          create: {
            userId: member.userId,
            eventId,
            teamId: team.teamId,
            totalScore: team.totalScore,
            moduleScores: team.moduleScores,
            skillGroupScores: team.skillGroupScores,
            publishedAt: null,
          },
        })

        await removePassportPdfCache(passport.id)

        const passportRecord = {
          id: passport.id,
          totalScore: team.totalScore,
          moduleScores: team.moduleScores,
          skillGroupScores: team.skillGroupScores,
          user: {
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            middleName: member.user.middleName,
            organization: member.user.organization,
          },
          event: {
            name: event.name,
            nameEn: event.nameEn,
            competency: event.competency,
            competencyEn: event.competencyEn,
            eventStart: event.eventStart,
            eventEnd: event.eventEnd,
            assessmentSchema: {
              modules: event.assessmentSchema.modules.map((module) => ({
                code: module.code,
                name: module.name,
                nameEn: module.nameEn,
              })),
            },
          },
          team: { name: team.teamName },
        } satisfies SkillPassportRecord

        const { fileUrl } = await ensurePassportPdf(passportRecord, "ru", true)
        await ensurePassportPdf(passportRecord, "en", true)
        await prisma.skillPassport.update({
          where: { id: passport.id },
          data: { pdfUrl: fileUrl },
        })

        passportsPrepared += 1
        pdfsPrepared += 2
      }
    }

    return NextResponse.json({ passportsPrepared, pdfsPrepared })
  } catch (error) {
    console.error("Error preparing passport preview:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
