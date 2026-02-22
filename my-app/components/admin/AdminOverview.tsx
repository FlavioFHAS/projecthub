"use client"

import {
  Users,
  UserCheck,
  Building,
  Briefcase,
  CheckSquare,
  Zap,
  TrendingUp,
  Activity,
  Database,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface AdminOverviewProps {
  platformStats: {
    totalUsers: {
      count: number
      activeLastMonth: number
      byRole: Record<string, number>
    }
    totalClients: {
      count: number
      activeProjects: number
    }
    totalProjects: {
      count: number
      byStatus: Record<string, number>
    }
    totalTasks: {
      count: number
      completedThisMonth: number
    }
  }
  growth: {
    newUsersPerMonth: { month: string; count: number }[]
    newProjectsPerMonth: { month: string; count: number }[]
    tasksCompletedPerMonth: { month: string; count: number }[]
  }
  topProjects: {
    id: string
    name: string
    client: string
    status: string
    progress: number
    taskCount: number
    memberCount: number
    activityCount: number
  }[]
  systemHealth: {
    dbResponseMs: number
    activeSSEConns: number
    notifQueueSize: number
  }
}

export function AdminOverview({
  platformStats,
  growth,
  topProjects,
  systemHealth,
}: AdminOverviewProps) {
  const stats = [
    {
      title: "Total de Usuários",
      value: platformStats.totalUsers.count,
      icon: Users,
      description: `${platformStats.totalUsers.activeLastMonth} ativos nos últimos 30 dias`,
    },
    {
      title: "Usuários Ativos",
      value: platformStats.totalUsers.activeLastMonth,
      icon: UserCheck,
      description: `${Math.round(
        (platformStats.totalUsers.activeLastMonth /
          platformStats.totalUsers.count) *
          100
      )}% do total`,
    },
    {
      title: "Total de Clientes",
      value: platformStats.totalClients.count,
      icon: Building,
      description: `${platformStats.totalClients.activeProjects} com projetos ativos`,
    },
    {
      title: "Projetos Ativos",
      value: platformStats.totalProjects.byStatus.ACTIVE || 0,
      icon: Briefcase,
      description: `de ${platformStats.totalProjects.count} total`,
    },
    {
      title: "Tarefas este Mês",
      value: platformStats.totalTasks.completedThisMonth,
      icon: CheckSquare,
      description: `concluídas de ${platformStats.totalTasks.count} total`,
    },
    {
      title: "Conexões SSE",
      value: systemHealth.activeSSEConns,
      icon: Zap,
      description: "conexões ativas em tempo real",
    },
  ]

  const getDbStatusColor = (ms: number) => {
    if (ms < 50) return "text-green-500"
    if (ms < 200) return "text-yellow-500"
    return "text-red-500"
  }

  const getDbStatusText = (ms: number) => {
    if (ms < 50) return "Excelente"
    if (ms < 200) return "Bom"
    return "Lento"
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Growth Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Crescimento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Users */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Novos Usuários</span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {growth.newUsersPerMonth.map((m, i) => {
                  const max = Math.max(
                    ...growth.newUsersPerMonth.map((x) => x.count)
                  )
                  const height = max > 0 ? (m.count / max) * 100 : 0
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors relative group"
                      style={{ height: `${Math.max(height, 10)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {m.count}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                {growth.newUsersPerMonth.map((m, i) => (
                  <span key={i}>{m.month.split("/")[0]}</span>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Novos Projetos</span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {growth.newProjectsPerMonth.map((m, i) => {
                  const max = Math.max(
                    ...growth.newProjectsPerMonth.map((x) => x.count)
                  )
                  const height = max > 0 ? (m.count / max) * 100 : 0
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500/20 rounded-t hover:bg-blue-500/40 transition-colors relative group"
                      style={{ height: `${Math.max(height, 10)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {m.count}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                {growth.newProjectsPerMonth.map((m, i) => (
                  <span key={i}>{m.month.split("/")[0]}</span>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  Tarefas Concluídas
                </span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {growth.tasksCompletedPerMonth.map((m, i) => {
                  const max = Math.max(
                    ...growth.tasksCompletedPerMonth.map((x) => x.count)
                  )
                  const height = max > 0 ? (m.count / max) * 100 : 0
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-green-500/20 rounded-t hover:bg-green-500/40 transition-colors relative group"
                      style={{ height: `${Math.max(height, 10)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {m.count}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                {growth.tasksCompletedPerMonth.map((m, i) => (
                  <span key={i}>{m.month.split("/")[0]}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(platformStats.totalUsers.byRole).map(
              ([role, count]) => {
                const total = platformStats.totalUsers.count
                const percentage = total > 0 ? (count / total) * 100 : 0
                const roleLabels: Record<string, string> = {
                  SUPER_ADMIN: "Super Admin",
                  ADMIN: "Admin",
                  COLLABORATOR: "Colaborador",
                  CLIENT: "Cliente",
                }
                const roleColors: Record<string, string> = {
                  SUPER_ADMIN: "bg-red-500",
                  ADMIN: "bg-blue-500",
                  COLLABORATOR: "bg-green-500",
                  CLIENT: "bg-purple-500",
                }
                return (
                  <div key={role} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{roleLabels[role] || role}</span>
                      <span className="text-muted-foreground">
                        {count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", roleColors[role])}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              }
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Projetos Mais Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Tarefas</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Atividade (30d)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.client}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="w-20" />
                      <span className="text-xs">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{project.taskCount}</TableCell>
                  <TableCell>{project.memberCount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project.activityCount}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Saúde do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-3 w-3 rounded-full",
                  getDbStatusColor(systemHealth.dbResponseMs)
                )}
              />
              <div>
                <p className="text-sm font-medium">Banco de Dados</p>
                <p className="text-xs text-muted-foreground">
                  {systemHealth.dbResponseMs}ms —{" "}
                  {getDbStatusText(systemHealth.dbResponseMs)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Conexões SSE</p>
                <p className="text-xs text-muted-foreground">
                  {systemHealth.activeSSEConns} conexões ativas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Fila de Notificações</p>
                <p className="text-xs text-muted-foreground">
                  {systemHealth.notifQueueSize} pendentes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
