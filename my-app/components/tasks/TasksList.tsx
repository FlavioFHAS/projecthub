"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Task, KanbanColumn } from "@/hooks/tasks/useTasks";
import { getPriorityConfig, getTaskStatusConfig, isTaskOverdue } from "@/lib/tasks/kanban-utils";
import { cn } from "@/lib/utils";
import { Calendar, MessageSquare, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TasksListProps {
  tasks: Task[];
  columns: KanbanColumn[];
  members: { id: string; name: string | null; image: string | null; email: string }[];
}

export function TasksList({ tasks, columns, members }: TasksListProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const toggleSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((t) => t.id));
    }
  };

  const getColumnName = (columnId: string) => {
    return columns.find((c) => c.id === columnId)?.name || "-";
  };

  return (
    <div className="border rounded-lg bg-card">
      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedTasks.length} tarefa(s) selecionada(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Mover para
            </Button>
            <Button variant="destructive" size="sm">
              Excluir
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selectedTasks.length === tasks.length && tasks.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsáveis</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhuma tarefa encontrada
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const priorityConfig = getPriorityConfig(task.priority);
              const statusConfig = getTaskStatusConfig(task.status);
              const overdue = isTaskOverdue(task);

              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    selectedTasks.includes(task.id) && "bg-muted/50"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => toggleSelection(task.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                    {task._count.comments > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MessageSquare className="h-3 w-3" />
                        {task._count.comments}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig.className}>
                      {getColumnName(task.columnId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityConfig.className}>
                      {priorityConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-1">
                      {task.assignees.slice(0, 3).map((assignee) => (
                        <Avatar
                          key={assignee.id}
                          className="h-6 w-6 border-2 border-background"
                        >
                          <AvatarImage src={assignee.user.image || undefined} />
                          <AvatarFallback className="text-[8px] bg-primary/10">
                            {assignee.user.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] border-2 border-background">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <span
                        className={cn(
                          "flex items-center gap-1 text-sm",
                          overdue && "text-destructive"
                        )}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
