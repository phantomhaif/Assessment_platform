import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET all profile fields
export async function GET() {
  try {
    const fields = await prisma.profileField.findMany({
      orderBy: { order: "asc" },
    })
    return NextResponse.json(fields)
  } catch (error) {
    console.error("Error fetching profile fields:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

const createFieldSchema = z.object({
  name: z.string().min(1, "Введите название поля"),
  nameEn: z.string().optional(),
  type: z.enum(["TEXT", "TEXTAREA", "SELECT", "DATE"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  optionsEn: z.array(z.string()).default([]),
})

// POST - create new field (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const data = createFieldSchema.parse(body)

    // Get max order
    const maxOrder = await prisma.profileField.aggregate({
      _max: { order: true },
    })

    const field = await prisma.profileField.create({
      data: {
        ...data,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    })

    return NextResponse.json(field, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message },
        { status: 400 }
      )
    }
    console.error("Error creating profile field:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
