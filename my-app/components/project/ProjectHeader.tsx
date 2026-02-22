"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MoreVertical,
  Settings,
  Users,
  Copy,
  Archive,
  Trash2,
  FileDown,
  Check,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProjectFull } from "@/contexts/ProjectContext";
import { canManageProject, canDeleteProject, canArchiveProject } from "@/lib/permissions";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, getDaysRemaining, getStatusLabel, getStatusColor } from "@/lib/projects/board-utils";
import { cn } from "@/lib/utils";

interface ProjectHeaderProps {
  project: ProjectFull;
  userRole: string;
}

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planejamento", color: "bg-blue-500" },
  { value: "IN_PROGRESS", label: "Em andamento", color: "bg-emerald-500" },
  { value: "ON_HOLD", label: "Pausado", color: "bg-amber-500" },
  { value: "COMPLETED", label: "Concluído", color: "bg-purple-500" },
  { value: "CANCELLED", label: "Cancelado", color: "bg-red-500" },
];

export function ProjectHeader({ project, userRole }: ProjectHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canManage = canManageProject(userRole);
  const canDelete = canDeleteProject(userRole);
  const canArchive = canArchiveProject(userRole);

  const daysRemaining = getDaysRemaining(project.endDate);
  const progress = project.progress || 0;

  // Focar input ao iniciar edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = async () => {
    if (projectName.trim() === project.name || projectName.trim() === "") {
      setProjectName(project.name);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.patch(`/projects/${project.id}`, { name: projectName.trim() });
      toast.success("Nome do projeto atualizado");
      router.refresh();
    } catch {
      toast.error("Erro ao atualizar nome");
      setProjectName(project.name);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setProjectName(project.name);
      setIsEditing(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === project.status) return;
    
    setIsUpdatingStatus(true);
    try {
      await apiClient.patch(`/projects/${project.id}`, { status: newStatus });
      toast.success("Status atualizado");
      router.refresh();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      await apiClient.post(`/projects/${project.id}/duplicate`);
      toast.success("Projeto duplicado com sucesso");
    } catch {
      toast.error("Erro ao duplicar projeto");
    }
  };

  const handleArchive = async () => {
    try {
      await apiClient.patch(`/projects/${project.id}`, { status: "ARCHIVED" });
      toast.success("Projeto arquivado");
      router.push("/projects");
    } catch {
      toast.error("Erro ao arquivar projeto");
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/projects/${project.id}`);
      toast.success("Projeto excluído");
      router.push("/projects");
    } catch {
      toast.error("Erro ao excluir projeto");
    }
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === project.status);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b bg-card"
    >
      {/* Seção 1 - Barra superior */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Botão voltar */}
            <Button variant="ghost" size="sm" asChild className="mt-0.5">
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Projetos
              </Link>
            </Button>

            {/* Logo/Capa */}
            <div
              className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{
                background: project.coverUrl
                  ? `url(${project.coverUrl}) center/cover`
                  : project.color
                  ? `linear-gradient(135deg, ${project.color}, ${project.color}88)`
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              {!project.coverUrl && (
                <span className="text-white font-bold text-lg">
                  {project.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Nome e cliente */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveName}
                    disabled={isSaving}
                    className="h-8 text-xl font-bold max-w-md"
                  />
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleSaveName}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setProjectName(project.name);
                          setIsEditing(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <h1
                  className={cn(
                    "text-xl font-bold truncate cursor-pointer hover:text-primary transition-colors",
                    canManage && "hover:underline"
                  )}
                  onClick={() => canManage && setIsEditing(true)}
                  title={canManage ? "Clique para editar" : undefined}
                >
                  {project.name}
                </h1>
              )}
              {project.client && (
                <Link
                  href={`/clients/${project.client.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {project.client.name}
                </Link>
              )}
            </div>
          </div>

          {/* Status e Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status Dropdown */}
            {canManage ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    className="gap-1"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        currentStatus?.color
                      )}
                    />
                    {currentStatus?.label || project.status}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-sm text-sm hover:bg-accent transition-colors",
                        status.value === project.status && "bg-accent"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full", status.color)} />
                      {status.label}
                      {status.value === project.status && (
                        <Check className="h-3 w-3 ml-auto" />
                      )}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <span className={cn("w-2 h-2 rounded-full", currentStatus?.color)} />
                {currentStatus?.label || project.status}
              </Badge>
            )}

            {/* Menu de ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                {canManage && (
                  <>
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar projeto
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar relatório
                </DropdownMenuItem>
                {canArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar projeto
                    </DropdownMenuItem>
                  </>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir projeto
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Seção 2 - Metadados (apenas para ADMIN/SUPER_ADMIN) */}
      {canManage && (
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-t bg-muted/30">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm">
            {/* Período */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Início"}
                {" → "}
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Término"}
              </span>
              {daysRemaining && (
                <Badge
                  variant={daysRemaining.variant}
                  className="text-xs"
                >
                  {daysRemaining.label}
                </Badge>
              )}
            </div>

            {/* Orçamento */}
            {project.budget && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{formatCurrency(project.budget)}</span>
              </div>
            )}

            {/* Progresso */}
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-muted-foreground">{progress}%</span>
              <Progress value={progress} className="h-2 flex-1" />
            </div>

            {/* Membros */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {project.members.slice(0, 4).map((member) => (
                  <Avatar
                    key={member.id}
                    className="h-7 w-7 border-2 border-background"
                  >
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {member.user.name?.charAt(0).toUpperCase() ||
                        member.user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.members.length > 4 && (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{project.members.length - 4}
                  </div>
                )}
              </div>
              <Link
                href={`/projects/${project.id}/team`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Users className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}
