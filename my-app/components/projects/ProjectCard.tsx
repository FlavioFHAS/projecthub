"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  CheckCircle2,
  GripVertical,
  MoreVertical,
  Users,
  ClipboardList,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

import {
  getStatusBadgeClass,
  getStatusLabel,
  getProjectGradient,
  getDaysRemaining,
} from "@/lib/projects/board-utils";

import type { ProjectWithClient } from "@/types/project";

interface ProjectCardProps {
  project: ProjectWithClient;
  index: number;
  isDragging?: boolean;
}

export const ProjectCard = memo(function ProjectCard({
  project,
  index,
  isDragging,
}: ProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const daysRemaining = getDaysRemaining(project.endDate);
  const statusClass = getStatusBadgeClass(project.status);
  const statusLabel = getStatusLabel(project.status);
  const gradient = getProjectGradient(project.color || "#6366f1");

  // Calculate progress color
  const progressColor =
    project.progress >= 70
      ? "bg-emerald-500"
      : project.progress >= 30
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -4 }}
      className={`group relative bg-card rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${
        isDragging
          ? "opacity-50 scale-105 shadow-2xl ring-2 ring-primary"
          : "hover:shadow-lg"
      } ${isOver ? "ring-2 ring-primary/50" : ""}`}
    >
      {/* Cover */}
      <div
        className="relative h-32 overflow-hidden"
        style={{
          background: project.coverUrl
            ? `url(${project.coverUrl}) center/cover`
            : gradient,
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-white/80" />
        </div>

        {/* Status Badge */}
        <Badge
          variant="outline"
          className={`absolute top-3 right-10 ${statusClass} border-white/30`}
        >
          {statusLabel}
        </Badge>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}`}>Abrir projeto</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Editar projeto</DropdownMenuItem>
            <DropdownMenuItem>Duplicar projeto</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Arquivar projeto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Client Logo */}
        {project.client?.logo && (
          <div className="absolute bottom-3 left-3">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={project.client.logo} alt={project.client.name} />
              <AvatarFallback>{project.client.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Card Body */}
      <Link href={`/projects/${project.id}`} className="block p-4">
        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {project.name}
        </h3>

        {/* Client Name */}
        <p className="text-sm text-muted-foreground mb-3">
          {project.client?.name || "Sem cliente"}
        </p>

        {/* Members & Deadline Row */}
        <div className="flex items-center justify-between mb-4">
          {/* Members */}
          <div className="flex -space-x-2">
            {project.members?.slice(0, 3).map((member, i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-background">
                <AvatarImage
                  src={member.user.avatar || undefined}
                  alt={member.user.name}
                />
                <AvatarFallback className="text-[10px]">
                  {member.user.name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.members && project.members.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground">
                +{project.members.length - 3}
              </div>
            )}
          </div>

          {/* Deadline */}
          {daysRemaining.days !== null && (
            <div
              className={`flex items-center gap-1 text-xs ${
                daysRemaining.variant === "danger"
                  ? "text-red-500"
                  : daysRemaining.variant === "warning"
                  ? "text-amber-500"
                  : daysRemaining.variant === "completed"
                  ? "text-emerald-500"
                  : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {daysRemaining.label}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>
              {project.completedTasks}/{project.totalTasks} tarefas
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{project._count?.meetings || 0} reuniões</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
