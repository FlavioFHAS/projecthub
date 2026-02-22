import { prisma } from "@/lib/prisma"
import { broadcastNotification, broadcastToUsers } from "@/app/api/notifications/stream/route"
import { NotificationType } from "@prisma/client"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  actorId?: string
}

interface CreateBulkNotificationParams {
  userIds: string[]
  type: NotificationType
  title: string
  message: string
  link?: string
  actorId?: string
}

/**
 * Cria uma notificação no banco de dados e envia via SSE
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  actorId,
}: CreateNotificationParams) {
  try {
    // Cria a notificação no banco de dados
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        actorId,
        read: false,
      },
      include: {
        actor: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    // Envia a notificação em tempo real via SSE
    broadcastNotification(userId, notification)

    return notification
  } catch (error) {
    console.error("Erro ao criar notificação:", error)
    throw error
  }
}

/**
 * Cria notificações em massa para múltiplos usuários
 */
export async function createBulkNotifications({
  userIds,
  type,
  title,
  message,
  link,
  actorId,
}: CreateBulkNotificationParams) {
  try {
    // Cria todas as notificações no banco de dados
    const notifications = await prisma.$transaction(
      userIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            link,
            actorId,
            read: false,
          },
          include: {
            actor: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        })
      )
    )

    // Envia as notificações em tempo real via SSE
    notifications.forEach((notification) => {
      broadcastNotification(notification.userId, notification)
    })

    return notifications
  } catch (error) {
    console.error("Erro ao criar notificações em massa:", error)
    throw error
  }
}

/**
 * Notifica todos os membros de um projeto
 */
export async function notifyProjectMembers({
  projectId,
  excludeUserId,
  type,
  title,
  message,
  link,
  actorId,
}: {
  projectId: string
  excludeUserId?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  actorId?: string
}) {
  try {
    // Busca todos os membros do projeto
    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
        ...(excludeUserId && { userId: { not: excludeUserId } }),
      },
      select: { userId: true },
    })

    const userIds = members.map((m) => m.userId)

    if (userIds.length === 0) return []

    // Cria notificações em massa
    return createBulkNotifications({
      userIds,
      type,
      title,
      message,
      link,
      actorId,
    })
  } catch (error) {
    console.error("Erro ao notificar membros do projeto:", error)
    throw error
  }
}

/**
 * Notifica quando uma tarefa é atribuída
 */
export async function notifyTaskAssigned({
  taskId,
  assigneeId,
  assignerId,
  taskTitle,
  projectName,
  projectId,
}: {
  taskId: string
  assigneeId: string
  assignerId: string
  taskTitle: string
  projectName: string
  projectId: string
}) {
  return createNotification({
    userId: assigneeId,
    type: NotificationType.TASK_ASSIGNED,
    title: "Nova tarefa atribuída",
    message: `Você foi atribuído à tarefa "${taskTitle}" no projeto ${projectName}`,
    link: `/projects/${projectId}/tasks?task=${taskId}`,
    actorId: assignerId,
  })
}

/**
 * Notifica quando uma tarefa é concluída
 */
export async function notifyTaskCompleted({
  taskId,
  projectId,
  taskTitle,
  projectName,
  completedById,
  notifyUserIds,
}: {
  taskId: string
  projectId: string
  taskTitle: string
  projectName: string
  completedById: string
  notifyUserIds: string[]
}) {
  return createBulkNotifications({
    userIds: notifyUserIds,
    type: NotificationType.TASK_COMPLETED,
    title: "Tarefa concluída",
    message: `A tarefa "${taskTitle}" no projeto ${projectName} foi concluída`,
    link: `/projects/${projectId}/tasks?task=${taskId}`,
    actorId: completedById,
  })
}

/**
 * Notifica sobre um novo comentário em tarefa
 */
export async function notifyTaskComment({
  taskId,
  projectId,
  taskTitle,
  commenterId,
  notifyUserIds,
}: {
  taskId: string
  projectId: string
  taskTitle: string
  commenterId: string
  notifyUserIds: string[]
}) {
  return createBulkNotifications({
    userIds: notifyUserIds,
    type: NotificationType.TASK_COMMENT,
    title: "Novo comentário",
    message: `Novo comentário na tarefa "${taskTitle}"`,
    link: `/projects/${projectId}/tasks?task=${taskId}`,
    actorId: commenterId,
  })
}

/**
 * Notifica sobre convite para projeto
 */
export async function notifyProjectInvite({
  projectId,
  projectName,
  invitedById,
  inviteeId,
}: {
  projectId: string
  projectName: string
  invitedById: string
  inviteeId: string
}) {
  return createNotification({
    userId: inviteeId,
    type: NotificationType.PROJECT_INVITE,
    title: "Convite para projeto",
    message: `Você foi convidado para participar do projeto "${projectName}"`,
    link: `/projects/${projectId}`,
    actorId: invitedById,
  })
}

/**
 * Notifica sobre reunião agendada
 */
export async function notifyMeetingScheduled({
  meetingId,
  projectId,
  meetingTitle,
  scheduledById,
  notifyUserIds,
}: {
  meetingId: string
  projectId: string
  meetingTitle: string
  scheduledById: string
  notifyUserIds: string[]
}) {
  return createBulkNotifications({
    userIds: notifyUserIds,
    type: NotificationType.MEETING_SCHEDULED,
    title: "Reunião agendada",
    message: `Nova reunião agendada: "${meetingTitle}"`,
    link: `/projects/${projectId}/meetings?id=${meetingId}`,
    actorId: scheduledById,
  })
}

/**
 * Notifica sobre proposta aprovada
 */
export async function notifyProposalApproved({
  proposalId,
  projectId,
  proposalTitle,
  approvedById,
  notifyUserIds,
}: {
  proposalId: string
  projectId: string
  proposalTitle: string
  approvedById: string
  notifyUserIds: string[]
}) {
  return createBulkNotifications({
    userIds: notifyUserIds,
    type: NotificationType.PROPOSAL_APPROVED,
    title: "Proposta aprovada",
    message: `A proposta "${proposalTitle}" foi aprovada`,
    link: `/projects/${projectId}/proposals?id=${proposalId}`,
    actorId: approvedById,
  })
}

/**
 * Notifica sobre proposta rejeitada
 */
export async function notifyProposalRejected({
  proposalId,
  projectId,
  proposalTitle,
  rejectedById,
  notifyUserIds,
}: {
  proposalId: string
  projectId: string
  proposalTitle: string
  rejectedById: string
  notifyUserIds: string[]
}) {
  return createBulkNotifications({
    userIds: notifyUserIds,
    type: NotificationType.PROPOSAL_REJECTED,
    title: "Proposta rejeitada",
    message: `A proposta "${proposalTitle}" foi rejeitada`,
    link: `/projects/${projectId}/proposals?id=${proposalId}`,
    actorId: rejectedById,
  })
}

/**
 * Notifica sobre alerta de custo
 */
export async function notifyCostAlert({
  projectId,
  projectName,
  alertMessage,
  notifyUserIds,
}: {
  projectId: string
  projectName: string
  alertMessage: string
  notifyUserIds: string[]
}) {
  return createBulkNotifications({
    userIds: notifyUserIds,
    type: NotificationType.COST_ALERT,
    title: "Alerta de custo",
    message: `${projectName}: ${alertMessage}`,
    link: `/projects/${projectId}/costs`,
  })
}
