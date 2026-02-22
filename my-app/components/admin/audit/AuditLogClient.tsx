"use client"

import { useState, useCallback } from "react"
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AuditAction } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

interface AuditLog {
  id: string
  action: AuditAction
  entity: string
  entityId: string
  description: string
  oldValue: string | null
  newValue: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  project: {
    id: string
    name: string
  } | null
}

interface AuditLogClientProps {
  initialLogs: AuditLog[]
  totalCount: number
  isSuperAdmin: boolean
  users: { id: string; name: string | null; email: string; image: string | null }[]
  projects: { id: string; name: string }[]
}

const actionColors: Record<AuditAction, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  UPDATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  STATUS_CHANGE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  LOGIN: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  PERMISSION_CHANGE: "bg-violet-500/10 text-violet-500 border-violet-500/20",
}

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Criar",
  UPDATE: "Atualizar",
  DELETE: "Excluir",
  STATUS_CHANGE: "Mudar Status",
  LOGIN: "Login",
  PERMISSION_CHANGE: "Permissões",
}

export function AuditLogClient({
  initialLogs,
  totalCount,
  isSuperAdmin,
  users,
  projects,
}: AuditLogClientProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [hasMore, setHasMore] = useState(initialLogs.length >= 50)
  const [loading, setLoading] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUser = userFilter === "all" || log.user.id === userFilter
    const matchesProject =
      projectFilter === "all" || log.project?.id === projectFilter
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesEntity = entityFilter === "all" || log.entity === entityFilter
    return (
      matchesSearch &&
      matchesUser &&
      matchesProject &&
      matchesAction &&
      matchesEntity
    )
  })

  const activeFilters = [
    userFilter !== "all" && `Usuário: ${users.find((u) => u.id === userFilter)?.name || userFilter}`,
    projectFilter !== "all" && `Projeto: ${projects.find((p) => p.id === projectFilter)?.name || projectFilter}`,
    actionFilter !== "all" && `Ação: ${actionLabels[actionFilter]}`,
    entityFilter !== "all" && `Entidade: ${entityFilter}`,
    searchQuery && `Busca: "${searchQuery}"`,
  ].filter(Boolean)

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    setLoading(true)
    try {
      const lastLog = logs[logs.length - 1]
      const params = new URLSearchParams({
        cursor: lastLog.id,
        limit: "50",
        ...(userFilter !== "all" && { userId: userFilter }),
        ...(projectFilter !== "all" && { projectId: projectFilter }),
        ...(actionFilter !== "all" && { action: actionFilter }),
        ...(entityFilter !== "all" && { entity: entityFilter }),
        ...(searchQuery && { q: searchQuery }),
      })
      const res = await fetch(`/api/audit?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs((prev) => [...prev, ...data.items])
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error("Erro ao carregar mais logs:", error)
    } finally {
      setLoading(false)
    }
  }, [logs, hasMore, loading, userFilter, projectFilter, actionFilter, entityFilter, searchQuery])

  const exportCSV = () => {
    const csv = [
      ["Data", "Usuário", "Ação", "Entidade", "Descrição", "Projeto"].join(", "),
      ...filteredLogs.map((log) =>
        [
          format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
          log.user.name || log.user.email,
          actionLabels[log.action],
          log.entity,
          log.description,
          log.project?.name || "",
        ].join(", ")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `auditoria-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setUserFilter("all")
    setProjectFilter("all")
    setActionFilter("all")
    setEntityFilter("all")
  }

  const entities = Array.from(new Set(logs.map((l) => l.entity)))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auditoria</h2>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? "Log completo de todas as ações da plataforma"
              : "Log de ações dos seus projetos"}
            {" "}({totalCount} registros)
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por usuário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={actionFilter}
          onValueChange={(v) => setActionFilter(v as AuditAction | "all")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filtrar por ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.values(AuditAction).map((action) => (
              <SelectItem key={action} value={action}>
                {actionLabels[action]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filtrar por entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as entidades</SelectItem>
            {entities.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {entity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {activeFilters.map((filter, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {filter}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <>
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() =>
                    setExpandedLog(expandedLog === log.id ? null : log.id)
                  }
                >
                  <TableCell className="whitespace-nowrap">
                    <span title={format(new Date(log.createdAt), "PPpp", { locale: ptBR })}>
                      {format(new Date(log.createdAt), "dd/MM HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={log.user.image || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {log.user.name?.charAt(0).toUpperCase() ||
                            log.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {log.user.name || log.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn("text-[10px]", actionColors[log.action])}
                    >
                      {actionLabels[log.action]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.entity}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.description}
                  </TableCell>
                  <TableCell>
                    {log.project ? (
                      <span className="text-sm text-muted-foreground">
                        {log.project.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {expandedLog === log.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </TableCell>
                </TableRow>
                {expandedLog === log.id && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/50 p-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Detalhes da Ação</p>
                        <p className="text-sm">{log.description}</p>
                        {(log.oldValue || log.newValue) && (
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            {log.oldValue && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Antes:
                                </p>
                                <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto max-h-40">
                                  {log.oldValue}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Depois:
                                </p>
                                <pre className="text-xs bg-emerald-500/10 p-2 rounded overflow-auto max-h-40">
                                  {log.newValue}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  )
}
