import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

interface RouteContext {
  params: Promise<{ fieldId: string }>
}

const updateFieldSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  type: z.enum(["TEXT", "TEXTAREA", "SELECT", "DATE"]).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  optionsEn: z.array(z.string()).optional(),
  order: z.number().optional(),
})

// PATCH - update field
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { fieldId } = await context.params
    const body = await req.json()
    const data = updateFieldSchema.parse(body)

    const field = await prisma.profileField.update({
      where: { id: fieldId },
      data,
    })

    return NextResponse.json(field)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message },
        { status: 400 }
      )
    }
    console.error("Error updating profile field:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE - remove field
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { fieldId } = await context.params

    await prisma.profileField.delete({
      where: { id: fieldId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting profile field:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
