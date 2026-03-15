import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { computeEventResults, loadEventResultsSource } from "@/lib/event-results"
import { ensurePassportPdf, removePassportPdfCache, type SkillPassportRecord } from "@/lib/passports"
import { prisma } from "@/lib/prisma"

function buildPassportRecord(
  passportId: string,
  event: NonNullable<Awaited<ReturnType<typeof loadEventResultsSource>>>,
  team: ReturnType<typeof computeEventResults>[number],
  member: ReturnType<typeof computeEventResults>[number]["members"][number]
) {
  return {
    id: passportId,
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
        modules: event.assessmentSchema?.modules.map((module) => ({
          code: module.code,
          name: module.name,
          nameEn: module.nameEn,
        })) || [],
      },
    },
    team: { name: team.teamName },
  } satisfies SkillPassportRecord
}

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
    const body = await req.json().catch(() => ({}))
    const mode = body.mode === "all" ? "all" : "sample"
    const event = await loadEventResultsSource(eventId)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.assessmentSchema) {
      return NextResponse.json({ error: "No assessment schema" }, { status: 400 })
    }

    const results = computeEventResults(event)
    const members = results.flatMap((team) => team.members.map((member) => ({ team, member })))

    if (members.length === 0) {
      return NextResponse.json({ error: "No participants with results" }, { status: 400 })
    }

    let passportsPrepared = 0
    let pdfsPrepared = 0
    const preparedIds: string[] = []

    const targets = mode === "all" ? members : [members[0]]

    for (const { team, member } of targets) {
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

      const passportRecord = buildPassportRecord(passport.id, event, team, member)
      const { fileUrl } = await ensurePassportPdf(passportRecord, "ru", true)
      await ensurePassportPdf(passportRecord, "en", true)
      await prisma.skillPassport.update({
        where: { id: passport.id },
        data: { pdfUrl: fileUrl },
      })

      passportsPrepared += 1
      pdfsPrepared += 2
      preparedIds.push(passport.id)
    }

    return NextResponse.json({
      mode,
      passportsPrepared,
      pdfsPrepared,
      preparedPassportIds: preparedIds,
      samplePassportId: mode === "sample" ? preparedIds[0] ?? null : null,
    })
  } catch (error) {
    console.error("Error preparing passport preview:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
