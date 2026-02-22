"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2, GripVertical, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  getStatusBadgeClass,
  getStatusLabel,
  getProjectGradient,
  getDaysRemaining,
} from "@/lib/projects/board-utils";

import type { ProjectWithClient } from "@/types/project";

interface ProjectCardOverlayProps {
  project: ProjectWithClient;
}

export function ProjectCardOverlay({ project }: ProjectCardOverlayProps) {
  const daysRemaining = getDaysRemaining(project.endDate);
  const statusClass = getStatusBadgeClass(project.status);
  const statusLabel = getStatusLabel(project.status);
  const gradient = getProjectGradient(project.color || "#6366f1");

  const progressColor =
    project.progress >= 70
      ? "bg-emerald-500"
      : project.progress >= 30
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <motion.div
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.05, rotate: 2 }}
      className="relative bg-card rounded-xl border-2 border-primary shadow-2xl overflow-hidden cursor-grabbing"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Drag handle */}
        <div className="absolute top-3 left-3">
          <GripVertical className="h-5 w-5 text-white/80" />
        </div>

        {/* Status Badge */}
        <Badge
          variant="outline"
          className={`absolute top-3 right-10 ${statusClass} border-white/30`}
        >
          {statusLabel}
        </Badge>

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
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-2 mb-1">
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
              className={`h-full rounded-full ${progressColor}`}
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
      </div>
    </motion.div>
  );
}
