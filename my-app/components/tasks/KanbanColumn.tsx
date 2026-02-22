"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MoreVertical, Plus, Edit2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, KanbanColumn, useUpdateColumn, useDeleteColumn } from "@/hooks/tasks/useTasks";
import { useProjectId } from "@/contexts/ProjectContext";
import { TaskCard } from "./TaskCard";
import { getColumnColor } from "@/lib/tasks/kanban-utils";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: KanbanColumn;
  tasks: Task[];
  members: { id: string; name: string | null; image: string | null; email: string }[];
  onAddTask: () => void;
  canEdit: boolean;
}

export function KanbanColumn({
  column,
  tasks,
  members,
  onAddTask,
  canEdit,
}: KanbanColumnProps) {
  const projectId = useProjectId();
  const updateColumnMutation = useUpdateColumn(projectId);
  const deleteColumnMutation = useDeleteColumn(projectId);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const columnColor = getColumnColor(column);
  const taskCount = tasks.length;

  const handleSaveName = () => {
    if (editName.trim() && editName !== column.name) {
      updateColumnMutation.mutate({
        columnId: column.id,
        data: { name: editName.trim() },
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (taskCount > 0) {
      alert("Não é possível excluir uma coluna com tarefas. Mova ou exclua as tarefas primeiro.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir esta coluna?")) {
      deleteColumnMutation.mutate(column.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 flex-shrink-0 flex flex-col rounded-lg border bg-card",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: columnColor }}
          />
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") {
                  setEditName(column.name);
                  setIsEditing(false);
                }
              }}
              className="h-7 text-sm"
              autoFocus
            />
          ) : (
            <button
              onClick={() => canEdit && setIsEditing(true)}
              className={cn(
                "font-semibold text-sm uppercase tracking-wide truncate",
                canEdit && "hover:text-primary cursor-pointer"
              )}
            >
              {column.name}
            </button>
          )}
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {taskCount}
          </span>
        </div>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
                disabled={taskCount > 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => {}}
            />
          ))}
        </SortableContext>
      </div>

      {/* Footer */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onAddTask}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar tarefa
        </Button>
      </div>
    </div>
  );
}
