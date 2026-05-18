import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeOrganizationName } from "@/lib/organizations"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get("q") || "").trim()
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 50)

    if (query.length < 2) {
      return NextResponse.json([])
    }

    const organizations = await prisma.organization.findMany({
      where: {
        isApproved: true,
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
      },
    })

    const uniqueOrganizations = Array.from(
      new Map(
        organizations.map((organization) => [
          normalizeOrganizationName(organization.name)?.toLowerCase() || organization.id,
          organization,
        ])
      ).values()
    )

    return NextResponse.json(uniqueOrganizations)
  } catch (error) {
    console.error("Error searching organizations:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
