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

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: protocolId } = await params

    // Get protocol info
    const protocol = await prisma.protocol.findUnique({
      where: { id: protocolId },
      select: { title: true },
    })

    if (!protocol) {
      return NextResponse.json({ error: "Protocol not found" }, { status: 404 })
    }

    // Get all assigned users
    const assignments = await prisma.protocolAssignment.findMany({
      where: { protocolId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            role: true,
          },
        },
      },
    })

    // Get all signatures
    const signatures = await prisma.protocolSignature.findMany({
      where: { protocolId },
      select: {
        userId: true,
        signedAt: true,
      },
    })

    const signatureMap = new Map(
      signatures.map(s => [s.userId, s.signedAt])
    )

    // Build response
    const signatureInfos = assignments.map(a => ({
      userId: a.user.id,
      userName: `${a.user.lastName} ${a.user.firstName} ${a.user.middleName || ""}`.trim(),
      email: a.user.email,
      role: a.user.role,
      isSigned: signatureMap.has(a.user.id),
      signedAt: signatureMap.get(a.user.id)?.toISOString() || null,
    }))

    return NextResponse.json({
      protocolTitle: protocol.title,
      signatures: signatureInfos,
    })
  } catch (error) {
    console.error("Error fetching signatures:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
