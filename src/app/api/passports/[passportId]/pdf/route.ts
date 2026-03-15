import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensurePassportPdf, readPassportPdf, type SkillPassportRecord } from "@/lib/passports"
import type { PassportLocale } from "@/lib/pdf/render-skill-passport"

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
        event: {
          include: {
            assessmentSchema: {
              include: {
                modules: {
                  orderBy: { order: "asc" },
                  select: {
                    code: true,
                    name: true,
                    nameEn: true,
                  },
                },
              },
            },
          },
        },
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

    const { fileUrl } = await ensurePassportPdf(passport as SkillPassportRecord, locale)
    const pdfBuffer = await readPassportPdf(passport.id, locale)

    if (locale === "ru" && passport.pdfUrl !== fileUrl) {
      await prisma.skillPassport.update({
        where: { id: passport.id },
        data: { pdfUrl: fileUrl },
      })
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
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
