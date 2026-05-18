import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export type SessionLike = {
  user?: { id?: string | null; role?: string | null } | null
} | null

export function isAdmin(role?: string | null): boolean {
  return role === "ADMIN"
}

/** Roles allowed to enter the admin/management area at all. */
export function canManageEvents(role?: string | null): boolean {
  return role === "ADMIN" || role === "ORGANIZER"
}

/** Event IDs the given user is assigned to organize. */
export async function getOrganizerEventIds(userId: string): Promise<string[]> {
  const events = await prisma.event.findMany({
    where: { organizers: { some: { id: userId } } },
    select: { id: true },
  })
  return events.map((event) => event.id)
}

/**
 * True if the session may fully manage the given event.
 * ADMIN → any event. ORGANIZER → only events they are assigned to.
 */
export async function canManageEvent(
  session: SessionLike,
  eventId: string
): Promise<boolean> {
  const role = session?.user?.role
  const userId = session?.user?.id
  if (!userId) return false
  if (isAdmin(role)) return true
  if (role !== "ORGANIZER") return false

  const count = await prisma.event.count({
    where: { id: eventId, organizers: { some: { id: userId } } },
  })
  return count > 0
}

/**
 * Guard for event-scoped management routes. Returns a ready-to-return
 * NextResponse on failure, or null when the caller may proceed.
 */
export async function guardEventManager(
  session: SessionLike,
  eventId: string
): Promise<NextResponse | null> {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await canManageEvent(session, eventId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

/**
 * True if the session may view/edit the given user account.
 * ADMIN → anyone. ORGANIZER → only users who participate (application or
 * team membership) in one of the organizer's events. Self is always allowed.
 */
export async function canManageUser(
  session: SessionLike,
  targetUserId: string
): Promise<boolean> {
  const role = session?.user?.role
  const userId = session?.user?.id
  if (!userId) return false
  if (isAdmin(role)) return true
  if (userId === targetUserId) return true
  if (role !== "ORGANIZER") return false

  const eventIds = await getOrganizerEventIds(userId)
  if (eventIds.length === 0) return false

  const linked = await prisma.user.count({
    where: {
      id: targetUserId,
      OR: [
        { applications: { some: { eventId: { in: eventIds } } } },
        { teamMemberships: { some: { team: { eventId: { in: eventIds } } } } },
      ],
    },
  })
  return linked > 0
}

/**
 * Prisma `where` clause that limits a user query to accounts the session may
 * manage. ADMIN gets no restriction; ORGANIZER is scoped to participants of
 * their events; anyone else is scoped to nothing.
 */
export async function organizerScopedUserWhere(
  session: SessionLike
): Promise<Record<string, unknown>> {
  const role = session?.user?.role
  const userId = session?.user?.id
  if (isAdmin(role)) return {}
  if (!userId || role !== "ORGANIZER") return { id: "__none__" }

  const eventIds = await getOrganizerEventIds(userId)
  if (eventIds.length === 0) return { id: "__none__" }

  return {
    OR: [
      { id: userId },
      { applications: { some: { eventId: { in: eventIds } } } },
      { teamMemberships: { some: { team: { eventId: { in: eventIds } } } } },
    ],
  }
}
