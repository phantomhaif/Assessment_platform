import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const body = await req.json()
    const { role, firstName, lastName, middleName, organization, position, phone } = body

    const data: Record<string, unknown> = {}
    if (role !== undefined) data.role = role
    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName
    if (middleName !== undefined) data.middleName = middleName
    if (organization !== undefined) data.organization = organization
    if (position !== undefined) data.position = position
    if (phone !== undefined) data.phone = phone

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params

    // Allow admin to delete any user, or user to delete themselves
    const isAdmin = session.user.role === "ADMIN"
    const isSelf = session.user.id === userId

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete related data first (cascade)
    await prisma.score.deleteMany({ where: { expertId: userId } })
    await prisma.protocolSignature.deleteMany({ where: { userId } })
    await prisma.protocolAssignment.deleteMany({ where: { userId } })
    await prisma.expertAssignment.deleteMany({ where: { expertId: userId } })
    await prisma.teamMember.deleteMany({ where: { userId } })
    await prisma.teamFile.deleteMany({ where: { uploadedById: userId } })
    await prisma.skillPassport.deleteMany({ where: { userId } })
    await prisma.application.deleteMany({ where: { userId } })

    // Delete the user
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
