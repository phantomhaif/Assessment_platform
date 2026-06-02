import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { normalizeOrganizationType } from "@/lib/organizations"

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const mergeIntoId = normalizeText(body.mergeIntoId)

    if (mergeIntoId && mergeIntoId !== id) {
      const target = await prisma.organization.findUnique({
        where: { id: mergeIntoId },
        select: { name: true },
      })

      if (!target) {
        return NextResponse.json({ error: "Target organization not found" }, { status: 404 })
      }

      await prisma.$transaction([
        prisma.user.updateMany({
          where: { organizationId: id },
          data: { organizationId: mergeIntoId, organization: target.name },
        }),
        prisma.organization.delete({ where: { id } }),
      ])

      return NextResponse.json({ merged: true })
    }

    const data: {
      name?: string
      type?: string | null
      country?: string | null
      isApproved?: boolean
    } = {}

    const name = normalizeText(body.name)
    if (name) data.name = name
    if ("type" in body) data.type = normalizeOrganizationType(body.type)
    if ("country" in body) data.country = normalizeText(body.country)
    if ("isApproved" in body) data.isApproved = Boolean(body.isApproved)

    const [organization] = await prisma.$transaction([
      prisma.organization.update({
        where: { id },
        data,
      }),
      ...(data.name
        ? [
            prisma.user.updateMany({
              where: { organizationId: id },
              data: { organization: data.name },
            }),
          ]
        : []),
    ])

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const usersCount = await prisma.user.count({ where: { organizationId: id } })

    if (usersCount > 0) {
      return NextResponse.json({ error: "Organization is used by users" }, { status: 409 })
    }

    await prisma.organization.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
