import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { normalizeOrganizationName } from "@/lib/organizations"
import { organizerScopedUserWhere } from "@/lib/authz"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { email, password, firstName, lastName, middleName, organization, position, phone, role } = body
    const organizationName = normalizeOrganizationName(organization)
    const organizationRecord = organizationName
      ? await prisma.organization.findFirst({
          where: {
            name: {
              equals: organizationName,
              mode: "insensitive",
            },
          },
          select: { id: true },
        }).then(async (existing) => {
          if (existing) return existing
          return prisma.organization.create({
            data: { name: organizationName, isApproved: true, createdById: session.user.id },
            select: { id: true },
          })
        })
      : null

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Required: email, password, firstName, lastName" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        middleName: middleName || null,
        organization: organizationName,
        organizationId: organizationRecord?.id || null,
        position: position || null,
        phone: phone || null,
        role: role || "PARTICIPANT",
      },
    })

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Organizers only see users who participate in events they organize.
    const scopedWhere = await organizerScopedUserWhere(session)

    const users = await prisma.user.findMany({
      where: scopedWhere,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        organization: true,
        organizationId: true,
        position: true,
        phone: true,
        photo: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            applications: true,
            skillPassports: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
