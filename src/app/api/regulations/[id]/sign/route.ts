import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if protocol exists
    const protocol = await prisma.protocol.findUnique({
      where: { id },
    })

    if (!protocol) {
      return NextResponse.json({ error: "Regulation not found" }, { status: 404 })
    }

    // Check if already signed
    const existingSignature = await prisma.protocolSignature.findUnique({
      where: {
        protocolId_userId: {
          protocolId: id,
          userId: session.user.id,
        },
      },
    })

    if (existingSignature) {
      return NextResponse.json(
        { error: "Regulation already signed" },
        { status: 400 }
      )
    }

    // Get IP address from request headers
    const forwarded = req.headers.get("x-forwarded-for")
    const ipAddress = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || null

    // Create signature
    const signature = await prisma.protocolSignature.create({
      data: {
        protocolId: id,
        userId: session.user.id,
        ipAddress,
      },
    })

    return NextResponse.json({
      success: true,
      signedAt: signature.signedAt,
    })
  } catch (error) {
    console.error("Error signing regulation:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
