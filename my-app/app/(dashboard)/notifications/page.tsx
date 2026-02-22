"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  CheckCheck,
  Filter,
  Trash2,
  Volume2,
  VolumeX,
  ArrowLeft,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NotificationItem } from "@/components/notifications/NotificationItem"
import { useNotifications, useNotificationsPaginated } from "@/hooks/notifications/useNotifications"

const NOTIFICATION_TYPES = [
  { value: "all", label: "Todos os tipos" },
  { value: "TASK_ASSIGNED", label: "Tarefas atribuídas" },
  { value: "TASK_COMPLETED", label: "Tarefas concluídas" },
  { value: "TASK_COMMENT", label: "Comentários" },
  { value: "PROJECT_INVITE", label: "Convites" },
  { value: "MEETING_SCHEDULED", label: "Reuniões" },
  { value: "PROPOSAL_APPROVED", label: "Propostas aprovadas" },
  { value: "PROPOSAL_REJECTED", label: "Propostas rejeitadas" },
  { value: "COST_ALERT", label: "Alertas de custo" },
  { value: "SYSTEM", label: "Sistema" },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [page, setPage] = useState(1)

  const {
    notifications: recentNotifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const { data, isLoading } = useNotificationsPaginated(
    page,
    20,
    activeTab === "unread"
  )

  const notifications = data?.notifications || recentNotifications
  const filteredNotifications =
    selectedType === "all"
      ? notifications
      : notifications.filter((n) => n.type === selectedType)

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                  {unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} não lidas
                    </span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas notificações e mantenha-se atualizado
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSound}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 mr-2" />
                ) : (
                  <VolumeX className="h-4 w-4 mr-2" />
                )}
                Som {soundEnabled ? "ligado" : "desligado"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">
                Todas
                <span className="ml-2 text-xs text-muted-foreground">
                  ({notifications.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Não lidas
                {unreadCount > 0 && (
                  <span className="ml-2 bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            <NotificationList
              notifications={filteredNotifications}
              isLoading={isLoading}
              onMarkAsRead={markAsRead}
            />
          </TabsContent>

          <TabsContent value="unread" className="m-0">
            <NotificationList
              notifications={filteredNotifications.filter((n) => !n.read)}
              isLoading={isLoading}
              onMarkAsRead={markAsRead}
              emptyMessage="Nenhuma notificação não lida"
            />
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.pagination.totalPages, p + 1))
              }
              disabled={page === data.pagination.totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

interface NotificationListProps {
  notifications: Array<{
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
  }>
  isLoading: boolean
  onMarkAsRead: (id: string) => void
  emptyMessage?: string
}

function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  emptyMessage = "Nenhuma notificação encontrada",
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Bell className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">{emptyMessage}</p>
        <p className="text-sm">
          Você será notificado quando houver atividades importantes
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border">
      <AnimatePresence initial={false}>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
          >
            <NotificationItem
              notification={notification}
              onMarkAsRead={onMarkAsRead}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
