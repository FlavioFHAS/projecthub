"use client"

import { useRouter } from "next/navigation"
import {
  Plus,
  Folder,
  CheckSquare,
  Users,
  Calendar,
  FileText,
  Settings,
  Home,
  LayoutDashboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"

interface QuickAction {
  id: string
  label: string
  shortcut?: string
  icon: React.ElementType
  onClick: () => void
  roles?: Role[]
}

interface QuickActionsProps {
  onSelect: () => void
}

export function QuickActions({ onSelect }: QuickActionsProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user?.role as Role) || Role.CLIENT

  const actions: QuickAction[] = [
    {
      id: "home",
      label: "Ir para Home",
      shortcut: "G H",
      icon: Home,
      onClick: () => router.push("/"),
    },
    {
      id: "dashboard",
      label: "Ir para Dashboard",
      shortcut: "G D",
      icon: LayoutDashboard,
      onClick: () => router.push("/dashboard"),
    },
    {
      id: "new-project",
      label: "Novo Projeto",
      shortcut: "C P",
      icon: Folder,
      onClick: () => router.push("/projects/new"),
      roles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    {
      id: "new-task",
      label: "Nova Tarefa",
      shortcut: "C T",
      icon: CheckSquare,
      onClick: () => router.push("/tasks/new"),
      roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.COLLABORATOR],
    },
    {
      id: "new-client",
      label: "Novo Cliente",
      shortcut: "C C",
      icon: Users,
      onClick: () => router.push("/clients/new"),
      roles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    {
      id: "new-meeting",
      label: "Nova Reunião",
      shortcut: "C M",
      icon: Calendar,
      onClick: () => router.push("/meetings/new"),
      roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.COLLABORATOR],
    },
    {
      id: "new-note",
      label: "Nova Nota",
      shortcut: "C N",
      icon: FileText,
      onClick: () => router.push("/notes/new"),
    },
    {
      id: "settings",
      label: "Configurações",
      shortcut: "G S",
      icon: Settings,
      onClick: () => router.push("/settings"),
    },
  ]

  // Filtra ações por role
  const filteredActions = actions.filter(
    (action) => !action.roles || action.roles.includes(userRole)
  )

  return (
    <div className="py-2">
      <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Ações Rápidas
      </p>
      <div className="space-y-0.5">
        {filteredActions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              action.onClick()
              onSelect()
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2",
              "hover:bg-accent hover:text-accent-foreground",
              "rounded-sm transition-colors text-left"
            )}
          >
            <div className="flex items-center gap-3">
              <action.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{action.label}</span>
            </div>
            {action.shortcut && (
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                {action.shortcut.split(" ").map((key, i) => (
                  <span key={i}>
                    {key}
                    {i < action.shortcut!.split(" ").length - 1 && (
                      <span className="text-muted-foreground/50">+</span>
                    )}
                  </span>
                ))}
              </kbd>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
