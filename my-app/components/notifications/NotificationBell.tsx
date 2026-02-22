"use client"

import { Bell } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
  unreadCount: number
  isConnected?: boolean
  onClick?: () => void
  className?: string
}

export function NotificationBell({
  unreadCount,
  isConnected = true,
  onClick,
  className,
}: NotificationBellProps) {
  const hasUnread = unreadCount > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      aria-label={`Notificações${hasUnread ? ` (${unreadCount} não lidas)` : ""}`}
    >
      <Bell className="h-5 w-5" />
      
      {/* Indicador de conexão */}
      <span
        className={cn(
          "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-red-500"
        )}
        title={isConnected ? "Conectado" : "Desconectado"}
      />
      
      {/* Badge de notificações não lidas */}
      <AnimatePresence>
        {hasUnread && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
              "flex items-center justify-center",
              "bg-primary text-primary-foreground",
              "text-[10px] font-bold rounded-full",
              "border-2 border-background"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
