import { NotificationType, UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type NotificationPayload = {
  userId: string
  title: string
  message: string
  link?: string
  type?: NotificationType
}

export async function createNotifications(payloads: NotificationPayload[]) {
  if (payloads.length === 0) return

  await prisma.notification.createMany({
    data: payloads.map((payload) => ({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      type: payload.type ?? "INFO",
    })),
  })
}

export async function notifyTeamFileActivity(params: {
  teamId: string
  actorId: string
  moduleCode: string
  fileName: string
  action: "uploaded" | "replaced" | "deleted"
}) {
  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    select: {
      id: true,
      name: true,
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        select: {
          userId: true,
        },
      },
    },
  })

  if (!team) return

  const actor = await prisma.user.findUnique({
    where: { id: params.actorId },
    select: {
      firstName: true,
      lastName: true,
    },
  })

  const actorName = actor
    ? `${actor.lastName} ${actor.firstName}`.trim()
    : "Participant"

  const actionLabels = {
    uploaded: {
      title: `Новая работа по модулю ${params.moduleCode}`,
      adminMessage: `${actorName} загрузил файл ${params.fileName} для команды "${team.name}" в мероприятии "${team.event.name}".`,
      teamMessage: `${actorName} загрузил файл ${params.fileName} по модулю ${params.moduleCode} для вашей команды в мероприятии "${team.event.name}".`,
      type: "SUCCESS" as NotificationType,
    },
    replaced: {
      title: `Обновлена работа по модулю ${params.moduleCode}`,
      adminMessage: `${actorName} заменил файл ${params.fileName} для команды "${team.name}" в мероприятии "${team.event.name}".`,
      teamMessage: `${actorName} обновил файл ${params.fileName} по модулю ${params.moduleCode} для вашей команды в мероприятии "${team.event.name}".`,
      type: "INFO" as NotificationType,
    },
    deleted: {
      title: `Удалена работа по модулю ${params.moduleCode}`,
      adminMessage: `${actorName} удалил файл ${params.fileName} команды "${team.name}" в мероприятии "${team.event.name}".`,
      teamMessage: `${actorName} удалил файл ${params.fileName} по модулю ${params.moduleCode} для вашей команды в мероприятии "${team.event.name}".`,
      type: "WARNING" as NotificationType,
    },
  }

  const content = actionLabels[params.action]
  const adminUsers = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.ADMIN, UserRole.ORGANIZER],
      },
    },
    select: {
      id: true,
    },
  })

  const adminLink = `/admin/submissions?eventId=${team.event.id}`
  const teamLink = "/submissions"

  const adminNotifications: NotificationPayload[] = adminUsers.map((user) => ({
    userId: user.id,
    title: content.title,
    message: content.adminMessage,
    link: adminLink,
    type: content.type,
  }))

  const teammateNotifications: NotificationPayload[] = team.members
    .filter((member) => member.userId !== params.actorId)
    .map((member) => ({
      userId: member.userId,
      title: content.title,
      message: content.teamMessage,
      link: teamLink,
      type: content.type,
    }))

  await createNotifications([...adminNotifications, ...teammateNotifications])
}
