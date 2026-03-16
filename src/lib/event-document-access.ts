import { prisma } from "@/lib/prisma"

type AccessContext = {
  isAdminOrOrganizer: boolean
  isParticipant: boolean
  isExpert: boolean
}

const ADMIN_ROLES = new Set(["ADMIN", "ORGANIZER"])

export async function resolveEventDocumentAccessContext(
  eventId: string,
  userId?: string,
  systemRole?: string
): Promise<AccessContext> {
  if (systemRole && ADMIN_ROLES.has(systemRole)) {
    return {
      isAdminOrOrganizer: true,
      isParticipant: false,
      isExpert: false,
    }
  }

  if (!userId) {
    return {
      isAdminOrOrganizer: false,
      isParticipant: false,
      isExpert: false,
    }
  }

  const [application, membership, expertAssignment] = await Promise.all([
    prisma.application.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      select: {
        status: true,
        requestedRole: true,
        approvedRole: true,
      },
    }),
    prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          eventId,
        },
      },
      select: { id: true },
    }),
    prisma.expertAssignment.findFirst({
      where: {
        eventId,
        expertId: userId,
      },
      select: { id: true },
    }),
  ])

  const approvedRole =
    application?.status === "APPROVED"
      ? application.approvedRole ?? application.requestedRole
      : null

  return {
    isAdminOrOrganizer: false,
    isParticipant: Boolean(membership) || approvedRole === "PARTICIPANT",
    isExpert: Boolean(expertAssignment) || approvedRole === "EXPERT",
  }
}

export function canAccessEventDocument(access: string[], context: AccessContext) {
  if (context.isAdminOrOrganizer) {
    return true
  }

  if (access.includes("PUBLIC")) {
    return true
  }

  if (access.includes("PARTICIPANTS") && context.isParticipant) {
    return true
  }

  if (access.includes("EXPERTS") && context.isExpert) {
    return true
  }

  if (access.includes("ORGANIZERS") && context.isAdminOrOrganizer) {
    return true
  }

  return false
}
