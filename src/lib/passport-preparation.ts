import { computeEventResults, loadEventResultsSource } from "@/lib/event-results"
import { ensurePassportPdf, removePassportPdfCache, type SkillPassportRecord } from "@/lib/passports"
import { prisma } from "@/lib/prisma"

type LoadedEvent = NonNullable<Awaited<ReturnType<typeof loadEventResultsSource>>>
type ComputedTeam = ReturnType<typeof computeEventResults>[number]
type ComputedMember = ComputedTeam["members"][number]

declare global {
  // eslint-disable-next-line no-var
  var __passportPreparationJobs: Set<string> | undefined
}

const runningJobs = globalThis.__passportPreparationJobs ?? (globalThis.__passportPreparationJobs = new Set<string>())

function buildPassportRecord(
  passportId: string,
  event: LoadedEvent,
  team: ComputedTeam,
  member: ComputedMember
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
        modules:
          event.assessmentSchema?.modules.map((module) => ({
            code: module.code,
            name: module.name,
            nameEn: module.nameEn,
          })) || [],
      },
    },
    team: { name: team.teamName },
  } satisfies SkillPassportRecord
}

async function preparePassportForMember(eventId: string, event: LoadedEvent, team: ComputedTeam, member: ComputedMember) {
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
    },
    create: {
      userId: member.userId,
      eventId,
      teamId: team.teamId,
      totalScore: team.totalScore,
      moduleScores: team.moduleScores,
      skillGroupScores: team.skillGroupScores,
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

  return passport.id
}

export async function prepareSamplePassport(eventId: string) {
  const event = await loadEventResultsSource(eventId)

  if (!event) {
    throw new Error("Event not found")
  }

  if (!event.assessmentSchema) {
    throw new Error("No assessment schema")
  }

  const results = computeEventResults(event)
  const sample = results.flatMap((team) => team.members.map((member) => ({ team, member })))[0]

  if (!sample) {
    throw new Error("No participants with results")
  }

  const passportId = await preparePassportForMember(eventId, event, sample.team, sample.member)

  return {
    passportId,
    passportsPrepared: 1,
    pdfsPrepared: 2,
  }
}

export async function getPassportPreparationStatus(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      passportPreparationStatus: true,
      passportPreparationTotal: true,
      passportPreparationCompleted: true,
      passportPreparationError: true,
      passportPreparationStartedAt: true,
      passportPreparationFinishedAt: true,
    },
  })

  return event
}

export async function startBackgroundPassportPreparation(eventId: string) {
  if (runningJobs.has(eventId)) {
    return { started: false, reason: "already-running" as const }
  }

  const event = await loadEventResultsSource(eventId)

  if (!event) {
    throw new Error("Event not found")
  }

  if (!event.assessmentSchema) {
    throw new Error("No assessment schema")
  }

  const results = computeEventResults(event)
  const members = results.flatMap((team) => team.members.map((member) => ({ team, member })))

  if (members.length === 0) {
    throw new Error("No participants with results")
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      passportPreparationStatus: "RUNNING",
      passportPreparationTotal: members.length,
      passportPreparationCompleted: 0,
      passportPreparationError: null,
      passportPreparationStartedAt: new Date(),
      passportPreparationFinishedAt: null,
    },
  })

  runningJobs.add(eventId)

  setTimeout(() => {
    void runBackgroundPassportPreparation(eventId)
  }, 0)

  return { started: true, total: members.length }
}

async function runBackgroundPassportPreparation(eventId: string) {
  try {
    const event = await loadEventResultsSource(eventId)

    if (!event?.assessmentSchema) {
      throw new Error("Event not found or schema missing")
    }

    const results = computeEventResults(event)
    const members = results.flatMap((team) => team.members.map((member) => ({ team, member })))

    let completed = 0

    for (const { team, member } of members) {
      await preparePassportForMember(eventId, event, team, member)
      completed += 1

      await prisma.event.update({
        where: { id: eventId },
        data: {
          passportPreparationCompleted: completed,
          passportPreparationError: null,
        },
      })
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        passportPreparationStatus: "COMPLETED",
        passportPreparationFinishedAt: new Date(),
        passportPreparationError: null,
      },
    })
  } catch (error) {
    console.error("Background passport preparation failed:", error)

    await prisma.event.update({
      where: { id: eventId },
      data: {
        passportPreparationStatus: "FAILED",
        passportPreparationFinishedAt: new Date(),
        passportPreparationError: error instanceof Error ? error.message : "Unknown error",
      },
    }).catch(() => undefined)
  } finally {
    runningJobs.delete(eventId)
  }
}
