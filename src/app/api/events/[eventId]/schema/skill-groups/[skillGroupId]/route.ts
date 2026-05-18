import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageEvent } from "@/lib/authz"
import { z } from "zod"

const updateSkillGroupSchema = z.object({
  name: z.string().trim().min(1).optional(),
  nameEn: z.string().trim().optional().nullable(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; skillGroupId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId, skillGroupId } = await params
    if (!(await canManageEvent(session, eventId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const body = await req.json()
    const data = updateSkillGroupSchema.parse(body)

    const skillGroup = await prisma.skillGroup.findFirst({
      where: {
        id: skillGroupId,
        schema: { eventId },
      },
    })

    if (!skillGroup) {
      return NextResponse.json({ error: "Skill group not found" }, { status: 404 })
    }

    const updatedSkillGroup = await prisma.skillGroup.update({
      where: { id: skillGroupId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn || null } : {}),
      },
    })

    return NextResponse.json({ skillGroup: updatedSkillGroup })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Error updating skill group:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
