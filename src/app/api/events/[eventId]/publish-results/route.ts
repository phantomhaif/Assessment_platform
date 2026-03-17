import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeEventResults, loadEventResultsSource } from "@/lib/event-results"

export async function GET(
  req: NextRequest,
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

    const preview = computeEventResults(event).map((team) => ({
      id: team.teamId,
      name: team.teamName,
      number: team.teamNumber,
      rank: team.rank ?? null,
      totalScore: team.totalScore,
      members: team.members.map((member) => ({
        user: {
          id: member.user.id,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          email: member.user.email,
        },
      })),
    }))

    return NextResponse.json({ teams: preview })
  } catch (error) {
    console.error("Error preparing results preview:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
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
    const publishPassports = body.publishPassports !== false

    if (publishPassports) {
      const passportPreparationState = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          passportPreparationStatus: true,
          passportPreparationTotal: true,
          passportPreparationCompleted: true,
        },
      })

      const passportsReady =
        passportPreparationState?.passportPreparationStatus === "COMPLETED" &&
        passportPreparationState.passportPreparationTotal > 0 &&
        passportPreparationState.passportPreparationCompleted >= passportPreparationState.passportPreparationTotal

      if (!passportsReady) {
        return NextResponse.json(
          { error: "Prepare all passports before publishing results with passports enabled" },
          { status: 400 }
        )
      }
    }

    const event = await loadEventResultsSource(eventId)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.assessmentSchema) {
      return NextResponse.json({ error: "No assessment schema" }, { status: 400 })
    }

    const results = computeEventResults(event)
    let passportsTouched = 0

    for (const team of results) {
      await prisma.team.update({
        where: { id: team.teamId },
        data: {
          rank: team.rank ?? null,
          totalScore: team.totalScore,
        },
      })

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
            publishedAt: publishPassports ? new Date() : null,
          },
          create: {
            userId: member.userId,
            eventId,
            teamId: team.teamId,
            totalScore: team.totalScore,
            moduleScores: team.moduleScores,
            skillGroupScores: team.skillGroupScores,
            publishedAt: publishPassports ? new Date() : null,
          },
        })

        passportsTouched += 1
      }
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: "RESULTS_PUBLISHED" },
    })

    return NextResponse.json({
      success: true,
      passportsTouched,
      pdfsPrepared: 0,
      publishPassports,
    })
  } catch (error) {
    console.error("Error publishing results:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
