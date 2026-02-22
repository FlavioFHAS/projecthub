"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { differenceInDays, format, isToday, isTomorrow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface MyTasksListProps {
  tasks: any[];
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

function getUrgencyGroup(task: any): { label: string; color: string; order: number } {
  if (!task.dueDate) return { label: "Sem prazo", color: "text-muted-foreground", order: 4 };

  const due = new Date(task.dueDate);

  if (isPast(due) && !isToday(due)) {
    return { label: "Atrasada", color: "text-red-600", order: 0 };
  }
  if (isToday(due)) {
    return { label: "Hoje", color: "text-amber-600", order: 1 };
  }
  if (isTomorrow(due)) {
    return { label: "Amanhã", color: "text-blue-600", order: 2 };
  }

  const daysUntil = differenceInDays(due, new Date());
  if (daysUntil <= 7) {
    return { label: "Esta semana", color: "text-muted-foreground", order: 3 };
  }

  return { label: "Mais tarde", color: "text-muted-foreground", order: 5 };
}

export function MyTasksList({ tasks }: MyTasksListProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const handleComplete = async (taskId: string) => {
    // Optimistic update
    setCompletedTasks((prev) => new Set([...prev, taskId]));

    // TODO: API call to complete task
    toast.success("Tarefa concluída! 🎉");

    // Confetti effect for first task of the day
    const todayCompleted = localStorage.getItem("tasksCompletedToday");
    const today = new Date().toDateString();

    if (todayCompleted !== today) {
      localStorage.setItem("tasksCompletedToday", today);
      // Trigger confetti (would use canvas-confetti in real implementation)
    }
  };

  // Group tasks by urgency
  const groupedTasks = tasks.reduce((groups, task) => {
    const urgency = getUrgencyGroup(task);
    if (!groups[urgency.label]) {
      groups[urgency.label] = { tasks: [], order: urgency.order, color: urgency.color };
    }
    groups[urgency.label].tasks.push(task);
    return groups;
  }, {} as Record<string, { tasks: any[]; order: number; color: string }>);

  // Sort groups by urgency
  const sortedGroups = Object.entries(groupedTasks).sort(
    ([, a]: [string, any], [, b]: [string, any]) => a.order - b.order
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Minhas Tarefas</CardTitle>
        <Link
          href="/projects"
          className="text-sm text-primary hover:underline"
        >
          Ver todas
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedGroups.map(([groupName, group]: [string, any]) => (
            <div key={groupName}>
              <h4 className={cn("text-sm font-medium mb-2", group.color)}>
                {groupName} ({group.tasks.length})
              </h4>
              <div className="space-y-2">
                <AnimatePresence>
                  {group.tasks
                    .filter((t: any) => !completedTasks.has(t.id))
                    .map((task: any) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Checkbox
                          onCheckedChange={() => handleComplete(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                PRIORITY_COLORS[task.priority] || "bg-gray-500"
                              )}
                            />
                            <span className="font-medium text-sm truncate">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: task.project?.color || "#3b82f6" }}
                              />
                              {task.project?.name}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.dueDate), "dd/MM", { locale: ptBR })}
                              </span>
                            )}
                            {task.estimatedHours && (
                              <span>⏱️ {task.estimatedHours}h</span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/projects/${task.projectId}/tasks`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
              <p>Sem tarefas pendentes!</p>
              <p className="text-sm">Aproveite para descansar ou ajudar a equipe</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
