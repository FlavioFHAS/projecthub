"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Task {
  id: string;
  title: string;
  description: object | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  columnId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  assignees: {
    id: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  _count: {
    comments: number;
  };
}

export interface KanbanColumn {
  id: string;
  name: string;
  color: string | null;
  order: number;
  taskLimit: number | null;
  statusMapping: TaskStatus | null;
}

export interface TaskFilters {
  status: TaskStatus[];
  priority: TaskPriority[];
  assigneeId: string | null;
  tags: string[];
  overdue: boolean;
  columnId: string | null;
}

interface TasksData {
  tasks: Task[];
  columns: KanbanColumn[];
}

const fetchTasks = async (projectId: string): Promise<TasksData> => {
  const response = await apiClient.get(`/projects/${projectId}/tasks`);
  return response.data;
};

export function useTasks(projectId: string, initialData?: TasksData) {
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId),
    initialData,
  });

  const tasksByColumn = (data?.columns || []).reduce((acc, column) => {
    acc[column.id] = (data?.tasks || [])
      .filter((task) => task.columnId === column.id)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {} as Record<string, Task[]>);

  return {
    tasks: data?.tasks || [],
    columns: data?.columns || [],
    tasksByColumn,
    isLoading,
  };
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Task>) =>
      apiClient.post(`/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Tarefa criada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar tarefa");
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: () => {
      toast.error("Erro ao atualizar tarefa");
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      apiClient.delete(`/projects/${projectId}/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Tarefa excluída");
    },
    onError: () => {
      toast.error("Erro ao excluir tarefa");
    },
  });
}

export function useReorderTasks(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tasks: { id: string; columnId: string; order: number }[]) =>
      apiClient.patch(`/projects/${projectId}/tasks/reorder`, { tasks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: () => {
      toast.error("Erro ao reordenar tarefas");
    },
  });
}

export function useCreateColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<KanbanColumn>) =>
      apiClient.post(`/projects/${projectId}/kanban-columns`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Coluna criada");
    },
    onError: () => {
      toast.error("Erro ao criar coluna");
    },
  });
}

export function useUpdateColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: string; data: Partial<KanbanColumn> }) =>
      apiClient.patch(`/projects/${projectId}/kanban-columns/${columnId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: () => {
      toast.error("Erro ao atualizar coluna");
    },
  });
}

export function useDeleteColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) =>
      apiClient.delete(`/projects/${projectId}/kanban-columns/${columnId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Coluna excluída");
    },
    onError: () => {
      toast.error("Erro ao excluir coluna");
    },
  });
}
