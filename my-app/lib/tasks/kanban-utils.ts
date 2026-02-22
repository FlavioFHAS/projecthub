import { Task, TaskPriority, TaskStatus, KanbanColumn } from "@/hooks/tasks/useTasks";

export interface ReorderTask {
  id: string;
  columnId: string;
  order: number;
}

export function findTaskById(
  tasksByColumn: Record<string, Task[]>,
  taskId: string
): Task | null {
  for (const columnId in tasksByColumn) {
    const task = tasksByColumn[columnId].find((t) => t.id === taskId);
    if (task) return task;
  }
  return null;
}

export function findTaskColumn(
  tasksByColumn: Record<string, Task[]>,
  taskId: string
): string | null {
  for (const columnId in tasksByColumn) {
    if (tasksByColumn[columnId].some((t) => t.id === taskId)) {
      return columnId;
    }
  }
  return null;
}

export function getTargetColumnId(
  tasksByColumn: Record<string, Task[]>,
  columns: KanbanColumn[],
  overId: string
): string | null {
  // Check if overId is a column
  if (columns.some((c) => c.id === overId)) {
    return overId;
  }
  // Otherwise, find which column contains the task
  return findTaskColumn(tasksByColumn, overId);
}

export function moveTaskBetweenColumns(
  tasksByColumn: Record<string, Task[]>,
  taskId: string,
  fromColumnId: string,
  toColumnId: string
): Record<string, Task[]> {
  const newTasksByColumn = { ...tasksByColumn };
  const task = newTasksByColumn[fromColumnId]?.find((t) => t.id === taskId);

  if (!task) return tasksByColumn;

  // Remove from source column
  newTasksByColumn[fromColumnId] = newTasksByColumn[fromColumnId].filter(
    (t) => t.id !== taskId
  );

  // Add to destination column with updated columnId
  const updatedTask = { ...task, columnId: toColumnId };
  newTasksByColumn[toColumnId] = [
    ...(newTasksByColumn[toColumnId] || []),
    updatedTask,
  ];

  return newTasksByColumn;
}

export function reorderTasksInColumn(
  tasksByColumn: Record<string, Task[]>,
  columnId: string,
  taskIds: string[]
): Record<string, Task[]> {
  const newTasksByColumn = { ...tasksByColumn };
  const columnTasks = newTasksByColumn[columnId] || [];

  newTasksByColumn[columnId] = taskIds
    .map((id) => columnTasks.find((t) => t.id === id))
    .filter(Boolean) as Task[];

  return newTasksByColumn;
}

export function calculateNewOrder(
  tasksByColumn: Record<string, Task[]>,
  activeId: string,
  overId: string,
  columns: KanbanColumn[]
): ReorderTask[] {
  const reorderData: ReorderTask[] = [];

  for (const column of columns) {
    const columnTasks = tasksByColumn[column.id] || [];
    columnTasks.forEach((task, index) => {
      reorderData.push({
        id: task.id,
        columnId: column.id,
        order: index,
      });
    });
  }

  return reorderData;
}

export function getPriorityConfig(priority: TaskPriority) {
  const configs: Record<TaskPriority, { label: string; className: string; color: string }> = {
    CRITICAL: {
      label: "Crítica",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
      color: "#ef4444",
    },
    HIGH: {
      label: "Alta",
      className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      color: "#f97316",
    },
    MEDIUM: {
      label: "Média",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      color: "#3b82f6",
    },
    LOW: {
      label: "Baixa",
      className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      color: "#64748b",
    },
  };
  return configs[priority] || configs.MEDIUM;
}

export function getTaskStatusConfig(status: TaskStatus) {
  const configs: Record<TaskStatus, { label: string; className: string }> = {
    TODO: {
      label: "A fazer",
      className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
    IN_PROGRESS: {
      label: "Em andamento",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    IN_REVIEW: {
      label: "Em revisão",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    DONE: {
      label: "Concluído",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  };
  return configs[status] || configs.TODO;
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "DONE") return false;
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  return dueDate.getTime() < now.getTime();
}

export function isDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  return (
    dueDate.getDate() === today.getDate() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getFullYear() === today.getFullYear()
  );
}

export function getColumnColor(column: KanbanColumn): string {
  if (column.color) return column.color;

  // Default colors based on status mapping
  const statusColors: Record<TaskStatus, string> = {
    TODO: "#64748b",
    IN_PROGRESS: "#3b82f6",
    IN_REVIEW: "#f59e0b",
    DONE: "#10b981",
  };

  return column.statusMapping ? statusColors[column.statusMapping] : "#64748b";
}
