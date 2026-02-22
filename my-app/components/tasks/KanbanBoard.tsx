"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Task, KanbanColumn, useReorderTasks, useCreateColumn } from "@/hooks/tasks/useTasks";
import { useProjectId, useProjectRole } from "@/contexts/ProjectContext";
import { KanbanColumn as KanbanColumnComponent } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { AddColumnModal } from "./AddColumnModal";
import {
  findTaskById,
  findTaskColumn,
  getTargetColumnId,
  moveTaskBetweenColumns,
  reorderTasksInColumn,
  calculateNewOrder,
} from "@/lib/tasks/kanban-utils";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  columns: KanbanColumn[];
  tasksByColumn: Record<string, Task[]>;
  members: { id: string; name: string | null; image: string | null; email: string }[];
  onAddTask: (columnId?: string) => void;
}

export function KanbanBoard({
  columns,
  tasksByColumn,
  members,
  onAddTask,
}: KanbanBoardProps) {
  const projectId = useProjectId();
  const userRole = useProjectRole();
  const canManageColumns = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const reorderMutation = useReorderTasks(projectId);
  const createColumnMutation = useCreateColumn(projectId);

  const [localTasksByColumn, setLocalTasksByColumn] = useState(tasksByColumn);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);

  // Sync with props
  useEffect(() => {
    setLocalTasksByColumn(tasksByColumn);
  }, [tasksByColumn]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = findTaskById(localTasksByColumn, event.active.id as string);
    if (task) {
      setActiveTask(task);
    }
  }, [localTasksByColumn]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumnId = findTaskColumn(localTasksByColumn, activeId);
    const overColumnId = getTargetColumnId(localTasksByColumn, columns, overId);

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
      return;
    }

    // Move task between columns visually
    setLocalTasksByColumn((prev) =>
      moveTaskBetweenColumns(prev, activeId, activeColumnId, overColumnId)
    );
  }, [localTasksByColumn, columns]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = findTaskColumn(localTasksByColumn, activeId);
    const overColumnId = getTargetColumnId(localTasksByColumn, columns, overId);

    if (!activeColumnId || !overColumnId) return;

    // Reorder within the same column or move between columns
    const columnTasks = localTasksByColumn[overColumnId] || [];
    const overIndex = columnTasks.findIndex((t) => t.id === overId);

    // Create new order
    const newTasksByColumn = { ...localTasksByColumn };
    const columnTaskIds = columnTasks.map((t) => t.id);
    const activeIndex = columnTaskIds.indexOf(activeId);

    if (activeIndex !== -1) {
      // Reorder within same column
      columnTaskIds.splice(activeIndex, 1);
      const insertIndex = overIndex === -1 ? columnTaskIds.length : overIndex;
      columnTaskIds.splice(insertIndex, 0, activeId);
    } else {
      // Task came from another column
      const insertIndex = overIndex === -1 ? columnTaskIds.length : overIndex;
      columnTaskIds.splice(insertIndex, 0, activeId);
    }

    const reordered = reorderTasksInColumn(newTasksByColumn, overColumnId, columnTaskIds);

    // Calculate reorder data
    const reorderData = calculateNewOrder(reordered, activeId, overId, columns);

    // Update local state
    setLocalTasksByColumn(reordered);

    // Call API
    reorderMutation.mutate(reorderData);
  }, [localTasksByColumn, columns, reorderMutation]);

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <div className="h-full overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => (
            <SortableContext
              key={column.id}
              items={localTasksByColumn[column.id]?.map((t) => t.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumnComponent
                column={column}
                tasks={localTasksByColumn[column.id] || []}
                members={members}
                onAddTask={() => onAddTask(column.id)}
                canEdit={canManageColumns}
              />
            </SortableContext>
          ))}

          {/* Add Column Button */}
          {canManageColumns && (
            <div className="w-72 flex-shrink-0">
              <Button
                variant="outline"
                className="w-full h-12 border-dashed"
                onClick={() => setIsAddColumnModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar coluna
              </Button>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              isDragging
              onClick={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddColumnModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        onAdd={(name, color) =>
          createColumnMutation.mutate({ name, color, order: columns.length })
        }
      />
    </div>
  );
}
