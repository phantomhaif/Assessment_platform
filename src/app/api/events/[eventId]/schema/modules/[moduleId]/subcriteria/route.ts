import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageEvent } from "@/lib/authz"
import { z } from "zod"

const subCriterionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().min(0).optional(),
})

// POST - create sub-criterion
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; moduleId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId, moduleId } = await params
    if (!(await canManageEvent(session, eventId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const body = await req.json()
    const data = subCriterionSchema.parse(body)

    // Get max order
    const maxOrderSub = await prisma.subCriterion.findFirst({
      where: { moduleId },
      orderBy: { order: "desc" },
    })

    const subCriterion = await prisma.subCriterion.create({
      data: {
        moduleId,
        code: data.code,
        name: data.name,
        order: data.order ?? (maxOrderSub?.order ?? -1) + 1,
      },
    })

    return NextResponse.json({ subCriterion })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Error creating sub-criterion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
