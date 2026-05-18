import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canManageEvent } from "@/lib/authz"
import { computeEventResults, loadEventResultsSource } from "@/lib/event-results"
import {
  getPassportPreparationStatus,
  prepareSamplePassport,
  startBackgroundPassportPreparation,
} from "@/lib/passport-preparation"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    if (!(await canManageEvent(session, eventId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const status = await getPassportPreparationStatus(eventId)

    return NextResponse.json(status)
  } catch (error) {
    console.error("Error fetching passport preparation status:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
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

    const { eventId } = await params
    if (!(await canManageEvent(session, eventId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const mode = body.mode === "all" ? "all" : "sample"

    if (mode === "sample") {
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

      const result = await prepareSamplePassport(eventId)

      return NextResponse.json({
        mode,
        passportsPrepared: result.passportsPrepared,
        pdfsPrepared: result.pdfsPrepared,
        preparedPassportIds: [result.passportId],
        samplePassportId: result.passportId,
      })
    }

    const started = await startBackgroundPassportPreparation(eventId)

    if (!started.started) {
      return NextResponse.json({ error: "Preparation already running" }, { status: 409 })
    }

    return NextResponse.json(
      {
        mode,
        queued: true,
        passportsPrepared: 0,
        pdfsPrepared: 0,
        total: started.total,
      },
      { status: 202 }
    )
  } catch (error) {
    console.error("Error preparing passport preview:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
