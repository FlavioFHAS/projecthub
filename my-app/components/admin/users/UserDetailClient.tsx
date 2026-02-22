"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Building,
  Calendar,
  CheckSquare,
  Activity,
  Folder,
  Shield,
  User,
  MoreHorizontal,
  LogOut,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Role, AuditAction } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UserDetailClientProps {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: Role
    isActive: boolean
    createdAt: Date
    lastLoginAt: Date | null
    jobTitle: string | null
    bio: string | null
    projectMembers: {
      id: string
      projectRole: string
      project: {
        id: string
        name: string
        status: string
        color: string | null
      }
    }[]
    auditLogs: {
      id: string
      action: AuditAction
      entity: string
      description: string
      createdAt: Date
      project: {
        id: string
        name: string
      } | null
    }[]
    _count: {
      projectMembers: number
      createdProjects: number
      tasks: number
    }
  }
}

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  COLLABORATOR: "Colaborador",
  CLIENT: "Cliente",
}

const roleColors: Record<Role, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-500",
  ADMIN: "bg-blue-500/10 text-blue-500",
  COLLABORATOR: "bg-green-500/10 text-green-500",
  CLIENT: "bg-purple-500/10 text-purple-500",
}

const actionColors: Record<AuditAction, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-500",
  UPDATE: "bg-blue-500/10 text-blue-500",
  DELETE: "bg-red-500/10 text-red-500",
  STATUS_CHANGE: "bg-amber-500/10 text-amber-500",
  LOGIN: "bg-slate-500/10 text-slate-500",
  PERMISSION_CHANGE: "bg-violet-500/10 text-violet-500",
}

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Criar",
  UPDATE: "Atualizar",
  DELETE: "Excluir",
  STATUS_CHANGE: "Mudar Status",
  LOGIN: "Login",
  PERMISSION_CHANGE: "Permissões",
}

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter()
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-2xl">
                {user.name?.charAt(0).toUpperCase() ||
                  user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {user.name || "Sem nome"}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={roleColors[user.role]}>
                  {roleLabels[user.role]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Membro desde{" "}
                  {format(new Date(user.createdAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              {user.jobTitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  {user.jobTitle}
                </p>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="h-4 w-4 mr-2" />
              Resetar Senha
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowImpersonateDialog(true)}>
              <User className="h-4 w-4 mr-2" />
              Impersonar Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.projectMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos Criados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.createdProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tarefas Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.tasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.lastLoginAt
                ? format(new Date(user.lastLoginAt), "dd/MM", { locale: ptBR })
                : "Nunca"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Projetos do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.projectMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => router.push(`/projects/${member.project.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: member.project.color || "#ccc" }}
                    />
                    <div>
                      <p className="font-medium">{member.project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.projectRole}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{member.project.status}</Badge>
                </div>
              ))}
              {user.projectMembers.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Usuário não participa de nenhum projeto
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-auto">
              {user.auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <Badge
                    className={cn("text-[10px] shrink-0", actionColors[log.action])}
                  >
                    {actionLabels[log.action]}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p>{log.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{log.entity}</span>
                      {log.project && (
                        <>
                          <span>•</span>
                          <span>{log.project.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {format(new Date(log.createdAt), "dd/MM HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {user.auditLogs.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impersonate Dialog */}
      <Dialog open={showImpersonateDialog} onOpenChange={setShowImpersonateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonar Usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a acessar a plataforma como{" "}
              <strong>{user.name || user.email}</strong>. Todas as suas ações serão
              registradas no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImpersonateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // TODO: Implement impersonation
                setShowImpersonateDialog(false)
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Impersonar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
