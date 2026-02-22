"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
  userId: string
  actorId?: string
  actor?: {
    name: string | null
    image: string | null
  } | null
}

interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  unreadCount: number
}

// Som de notificação usando Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch {
    // Silently fail if audio is not supported
  }
}

// Busca notificações da API
async function fetchNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    unreadOnly: String(unreadOnly),
  })
  
  const res = await fetch(`/api/notifications?${params}`)
  if (!res.ok) throw new Error("Failed to fetch notifications")
  return res.json()
}

// Marca notificação como lida
async function markNotificationAsRead(notificationId: string) {
  const res = await fetch("/api/notifications/stream", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId, read: true }),
  })
  if (!res.ok) throw new Error("Failed to mark as read")
  return res.json()
}

// Marca todas como lidas
async function markAllNotificationsAsRead() {
  const res = await fetch("/api/notifications/stream", {
    method: "PUT",
  })
  if (!res.ok) throw new Error("Failed to mark all as read")
  return res.json()
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Query para buscar notificações
  const { data, isLoading, error } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(1, 20),
    refetchInterval: 60000, // Refetch a cada 60 segundos como fallback
  })

  // Mutação para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Mutação para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Conexão SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream")
    eventSourceRef.current = eventSource

    eventSource.addEventListener("connected", () => {
      setIsConnected(true)
      console.log("[SSE] Conectado ao stream de notificações")
    })

    eventSource.addEventListener("notification", (event) => {
      try {
        const { notification } = JSON.parse(event.data)
        
        // Atualiza o cache do TanStack Query
        queryClient.setQueryData<NotificationsResponse>(
          ["notifications"],
          (old) => {
            if (!old) return old
            return {
              ...old,
              notifications: [notification, ...old.notifications],
              unreadCount: old.unreadCount + 1,
            }
          }
        )

        // Mostra toast
        toast.info(notification.title, {
          description: notification.message,
          action: notification.link
            ? {
                label: "Ver",
                onClick: () => (window.location.href = notification.link),
              }
            : undefined,
        })

        // Toca som se habilitado
        if (soundEnabled) {
          playNotificationSound()
        }
      } catch (error) {
        console.error("Erro ao processar notificação:", error)
      }
    })

    eventSource.addEventListener("heartbeat", () => {
      // Heartbeat recebido, conexão está viva
    })

    eventSource.onerror = () => {
      setIsConnected(false)
      console.log("[SSE] Erro na conexão, tentando reconectar...")
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [queryClient, soundEnabled])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await markAsReadMutation.mutateAsync(notificationId)
    },
    [markAsReadMutation]
  )

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync()
  }, [markAllAsReadMutation])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev)
  }, [])

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    pagination: data?.pagination,
    isLoading,
    error,
    isConnected,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    toggleSound,
  }
}

// Hook para notificações paginadas (página completa)
export function useNotificationsPaginated(page = 1, limit = 20, unreadOnly = false) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", "paginated", page, limit, unreadOnly],
    queryFn: () => fetchNotifications(page, limit, unreadOnly),
    keepPreviousData: true,
  })
}
