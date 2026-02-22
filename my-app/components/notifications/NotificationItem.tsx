"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Check,
  FileText,
  MessageSquare,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
  actor?: {
    name: string | null
    image: string | null
  } | null
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  compact?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  TASK_ASSIGNED: User,
  TASK_COMPLETED: CheckCircle,
  TASK_COMMENT: MessageSquare,
  PROJECT_INVITE: User,
  MEETING_SCHEDULED: Calendar,
  PROPOSAL_APPROVED: CheckCircle,
  PROPOSAL_REJECTED: AlertTriangle,
  NOTE_MENTION: MessageSquare,
  COST_ALERT: AlertTriangle,
  SYSTEM: Info,
}

const colorMap: Record<string, string> = {
  TASK_ASSIGNED: "bg-blue-500/10 text-blue-500",
  TASK_COMPLETED: "bg-green-500/10 text-green-500",
  TASK_COMMENT: "bg-purple-500/10 text-purple-500",
  PROJECT_INVITE: "bg-indigo-500/10 text-indigo-500",
  MEETING_SCHEDULED: "bg-orange-500/10 text-orange-500",
  PROPOSAL_APPROVED: "bg-green-500/10 text-green-500",
  PROPOSAL_REJECTED: "bg-red-500/10 text-red-500",
  NOTE_MENTION: "bg-pink-500/10 text-pink-500",
  COST_ALERT: "bg-red-500/10 text-red-500",
  SYSTEM: "bg-gray-500/10 text-gray-500",
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }, [notification, onMarkAsRead, router])

  const Icon = iconMap[notification.type] || Info
  const colorClass = colorMap[notification.type] || colorMap.SYSTEM

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-start gap-3 p-3 text-left",
          "hover:bg-accent transition-colors",
          "border-b border-border last:border-0",
          !notification.read && "bg-primary/5"
        )}
      >
        <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", !notification.read && "text-primary")}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        {!notification.read && (
          <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
        )}
      </button>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4",
        "border-b border-border last:border-0",
        !notification.read && "bg-primary/5"
      )}
    >
      {/* Avatar do ator ou ícone */}
      {notification.actor ? (
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={notification.actor.image || undefined} />
          <AvatarFallback>
            {notification.actor.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className={cn("p-2.5 rounded-xl shrink-0", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                !notification.read && "text-primary"
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {notification.message}
            </p>
          </div>
          {!notification.read && (
            <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>

          <div className="flex items-center gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar como lida
              </Button>
            )}
            {notification.link && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleClick}
              >
                <FileText className="h-3 w-3 mr-1" />
                Ver
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
