import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const locale = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "ru"
    const { id } = await params

    const protocol = await prisma.protocol.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            nameEn: true,
          },
        },
        signatures: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
            signedAt: true,
          },
        },
      },
    })

    if (!protocol) {
      return NextResponse.json({ error: "Regulation not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: protocol.id,
      title: locale === "en" ? protocol.titleEn || protocol.title : protocol.title,
      content: locale === "en" ? protocol.contentEn || protocol.content : protocol.content,
      version: protocol.version,
      eventId: protocol.eventId,
      eventName: locale === "en" ? protocol.event.nameEn || protocol.event.name : protocol.event.name,
      createdAt: protocol.createdAt,
      isSigned: protocol.signatures.length > 0,
      signedAt: protocol.signatures[0]?.signedAt || null,
    })
  } catch (error) {
    console.error("Error fetching regulation:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
