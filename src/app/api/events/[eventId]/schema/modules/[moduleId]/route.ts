import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageEvent } from "@/lib/authz"
import { z } from "zod"

const updateModuleSchema = z.object({
  code: z.string().min(1).max(10).optional(),
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

// GET single module
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; moduleId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { moduleId } = await params

    const module = await prisma.assessmentModule.findUnique({
      where: { id: moduleId },
      include: {
        subCriteria: {
          orderBy: { order: "asc" },
          include: {
            criteria: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    return NextResponse.json({ module })
  } catch (error) {
    console.error("Error fetching module:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - update module
export async function PUT(
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
    const data = updateModuleSchema.parse(body)

    const module = await prisma.assessmentModule.update({
      where: { id: moduleId },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn || null }),
        ...(data.order !== undefined && { order: data.order }),
      },
    })

    return NextResponse.json({ module })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Error updating module:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE module
export async function DELETE(
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

    // Delete all related data (cascading)
    await prisma.assessmentModule.delete({
      where: { id: moduleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting module:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
