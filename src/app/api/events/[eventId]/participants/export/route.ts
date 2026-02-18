import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import iconv from "iconv-lite"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params

    const applications = await prisma.application.findMany({
      where: {
        eventId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { user: { lastName: "asc" } },
        { user: { firstName: "asc" } },
      ],
    })

    // Build CSV: Имя;Фамилия;Email
    const rows = [["Имя", "Фамилия", "Email"]]
    for (const app of applications) {
      rows.push([app.user.firstName, app.user.lastName, app.user.email])
    }

    const csv = rows.map((row) => row.join(";")).join("\r\n")

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    })
    const fileName = `participants-${event?.name ?? eventId}.csv`
      .replace(/[^\w\-а-яА-ЯёЁ .]/gi, "_")

    // Encode as Windows-1251 for Excel compatibility
    const buffer = iconv.encode(csv, "win1251")

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "text/csv; charset=windows-1251",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    })
  } catch (error) {
    console.error("Error exporting participants:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
