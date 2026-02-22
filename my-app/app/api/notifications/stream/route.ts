import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Global Map para armazenar conexões ativas (em produção, use Redis Pub/Sub)
const activeStreams = new Map<string, ReadableStreamController<Uint8Array>>()

// Heartbeat interval (30 segundos)
const HEARTBEAT_INTERVAL = 30000

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
  userId: string
  actorId?: string
  actor?: {
    name: string | null
    image: string | null
  } | null
}

function formatSSEEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const userId = session.user.id

  const stream = new ReadableStream({
    start(controller) {
      // Armazena o controller para enviar notificações posteriormente
      activeStreams.set(userId, controller)

      // Envia evento de conexão bem-sucedida
      const connectedEvent = formatSSEEvent("connected", {
        message: "Conectado ao stream de notificações",
        userId,
        timestamp: new Date().toISOString(),
      })
      controller.enqueue(new TextEncoder().encode(connectedEvent))

      // Configura heartbeat para manter a conexão viva
      const heartbeat = setInterval(() => {
        try {
          const heartbeatEvent = formatSSEEvent("heartbeat", {
            timestamp: new Date().toISOString(),
          })
          controller.enqueue(new TextEncoder().encode(heartbeatEvent))
        } catch {
          // Cliente desconectou
          clearInterval(heartbeat)
          activeStreams.delete(userId)
        }
      }, HEARTBEAT_INTERVAL)

      // Limpa quando o cliente desconecta
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        activeStreams.delete(userId)
        controller.close()
      })
    },
    cancel() {
      activeStreams.delete(userId)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}

// Função para broadcast de notificações (usada por outros módulos)
export function broadcastNotification(
  userId: string,
  notification: Notification
): void {
  const controller = activeStreams.get(userId)
  if (!controller) return

  try {
    const event = formatSSEEvent("notification", { notification })
    controller.enqueue(new TextEncoder().encode(event))
  } catch (error) {
    console.error("Erro ao enviar notificação:", error)
    activeStreams.delete(userId)
  }
}

// Função para broadcast para múltiplos usuários
export function broadcastToUsers(
  userIds: string[],
  notification: Notification
): void {
  userIds.forEach((userId) => broadcastNotification(userId, notification))
}

// API para marcar notificação como lida
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { notificationId, read = true } = await req.json()

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id, // Garante que só atualiza suas próprias notificações
      },
      data: { read },
    })

    return Response.json({ success: true, notification })
  } catch (error) {
    console.error("Erro ao atualizar notificação:", error)
    return Response.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

// API para marcar todas como lidas
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: { read: true },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error)
    return Response.json(
      { error: "Failed to mark all as read" },
      { status: 500 }
    )
  }
}
