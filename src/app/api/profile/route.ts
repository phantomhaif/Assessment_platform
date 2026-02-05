import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  organization: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  photo: z.string().nullable().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        organization: true,
        position: true,
        phone: true,
        photo: true,
        role: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = profileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        middleName: validatedData.middleName || null,
        organization: validatedData.organization || null,
        position: validatedData.position || null,
        phone: validatedData.phone || null,
        photo: validatedData.photo,
      },
      select: {
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        organization: true,
        position: true,
        phone: true,
        photo: true,
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
