import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSubCriterionSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
})

// PUT - update sub-criterion
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; subCriterionId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { subCriterionId } = await params
    const body = await req.json()
    const data = updateSubCriterionSchema.parse(body)

    const subCriterion = await prisma.subCriterion.update({
      where: { id: subCriterionId },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.order !== undefined && { order: data.order }),
      },
    })

    return NextResponse.json({ subCriterion })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating sub-criterion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE sub-criterion
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; subCriterionId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { subCriterionId } = await params

    await prisma.subCriterion.delete({
      where: { id: subCriterionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sub-criterion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
