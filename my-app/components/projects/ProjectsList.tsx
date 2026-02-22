"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, CheckCircle2 } from "lucide-react";

import {
  getStatusBadgeClass,
  getStatusLabel,
  getDaysRemaining,
} from "@/lib/projects/board-utils";

import type { ProjectWithClient } from "@/types/project";

interface ProjectsListProps {
  projects: ProjectWithClient[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px]">Projeto</TableHead>
            <TableHead className="hidden md:table-cell">Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Progresso</TableHead>
            <TableHead className="hidden sm:table-cell">Equipe</TableHead>
            <TableHead className="hidden md:table-cell">Prazo</TableHead>
            <TableHead className="hidden lg:table-cell">Tarefas</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const daysRemaining = getDaysRemaining(project.endDate);
            const statusClass = getStatusBadgeClass(project.status);
            const statusLabel = getStatusLabel(project.status);

            const progressColor =
              project.progress >= 70
                ? "bg-emerald-500"
                : project.progress >= 30
                ? "bg-amber-500"
                : "bg-red-500";

            return (
              <TableRow key={project.id} className="group cursor-pointer">
                <TableCell>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      style={{
                        background: project.coverUrl
                          ? `url(${project.coverUrl}) center/cover`
                          : `linear-gradient(135deg, ${project.color || "#6366f1"} 0%, ${project.color ? `${project.color}dd` : "#4f46e5"} 100%)`,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate hidden sm:block">
                        {project.client?.name}
                      </p>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {project.client?.name || "-"}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className={statusClass}>
                    {statusLabel}
                  </Badge>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressColor}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {project.progress}%
                    </span>
                  </div>
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 3).map((member, i) => (
                      <Avatar
                        key={i}
                        className="h-6 w-6 border-2 border-background"
                      >
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
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {daysRemaining.days !== null ? (
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
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>
                      {project.completedTasks}/{project.totalTasks}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/projects/${project.id}`}>
                          Abrir projeto
                        </Link>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
