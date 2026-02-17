import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
        organization: organization || null,
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        organization: true,
        position: true,
        phone: true,
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
