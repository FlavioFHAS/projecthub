"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  MessageSquare,
  Clock,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Task } from "@/hooks/tasks/useTasks";
import {
  getPriorityConfig,
  isTaskOverdue,
  isDueToday,
} from "@/lib/tasks/kanban-utils";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: (task: Task) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  isDragging,
  onClick,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const overdue = isTaskOverdue(task);
  const dueToday = isDueToday(task);

  const displayPriority = task.priority === "CRITICAL" || task.priority === "HIGH";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task)}
      className={cn(
        "group relative rounded-lg border bg-card p-3 cursor-grab",
        "hover:border-primary/30 hover:shadow-md transition-all",
        (isDragging || isSortableDragging) && "opacity-50 rotate-2 scale-105 shadow-xl z-50"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1 flex-1">
          {displayPriority && (
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0", priorityConfig.className)}
            >
              {priorityConfig.label}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm line-clamp-2 mb-3">{task.title}</h4>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignees */}
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 2).map((assignee) => (
            <Avatar
              key={assignee.id}
              className="h-6 w-6 border-2 border-card"
            >
              <AvatarImage src={assignee.user.image || undefined} />
              <AvatarFallback className="text-[8px] bg-primary/10">
                {assignee.user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ))}
          {task.assignees.length > 2 && (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] border-2 border-card">
              +{task.assignees.length - 2}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-muted-foreground">
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                overdue && "text-destructive",
                dueToday && "text-amber-500"
              )}
            >
              {overdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : dueToday ? (
                <Clock className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}

          {task._count.comments > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}

          {task.actualHours && task.actualHours > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {task.actualHours}h
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
