"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GanttItem } from "@prisma/client";
import { toast } from "sonner";
import {
  GanttViewMode,
  GanttDateRange,
  getDateRange,
  getItemPosition,
  getDateFromPosition,
  snapToDay,
  validateGanttDates,
} from "@/lib/gantt/gantt-utils";

interface UseGanttProps {
  projectId: string;
}

interface UpdateGanttItemData {
  id: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  title?: string;
  description?: string;
}

interface CreateGanttItemData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
  dependencies?: string[];
}

const fetchGanttItems = async (projectId: string): Promise<GanttItem[]> => {
  const response = await fetch(`/api/projects/${projectId}/gantt`);
  if (!response.ok) throw new Error("Erro ao carregar itens do Gantt");
  return response.json();
};

const createGanttItem = async (
  projectId: string,
  data: CreateGanttItemData
): Promise<GanttItem> => {
  const response = await fetch(`/api/projects/${projectId}/gantt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Erro ao criar item");
  return response.json();
};

const updateGanttItem = async (
  projectId: string,
  data: UpdateGanttItemData
): Promise<GanttItem> => {
  const response = await fetch(`/api/projects/${projectId}/gantt/${data.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Erro ao atualizar item");
  return response.json();
};

const deleteGanttItem = async (
  projectId: string,
  itemId: string
): Promise<void> => {
  const response = await fetch(`/api/projects/${projectId}/gantt/${itemId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Erro ao excluir item");
};

export function useGantt({ projectId }: UseGanttProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<GanttViewMode>("week");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["gantt", projectId],
    queryFn: () => fetchGanttItems(projectId),
  });

  const dateRange = useMemo(() => getDateRange(items), [items]);

  const createMutation = useMutation({
    mutationFn: (data: CreateGanttItemData) => createGanttItem(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gantt", projectId] });
      toast.success("Item criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar item"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateGanttItemData) => updateGanttItem(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gantt", projectId] });
      toast.success("Item atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar item"),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteGanttItem(projectId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gantt", projectId] });
      toast.success("Item excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir item"),
  });

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleDragEnd = useCallback(
    (itemId: string, deltaX: number, pxPerDay: number) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const daysDelta = Math.round(deltaX / pxPerDay);
      const newStartDate = snapToDay(
        new Date(item.startDate.getTime() + daysDelta * 24 * 60 * 60 * 1000)
      );
      const duration =
        item.endDate.getTime() - item.startDate.getTime();
      const newEndDate = snapToDay(new Date(newStartDate.getTime() + duration));

      const validation = validateGanttDates(newStartDate, newEndDate);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      updateMutation.mutate({
        id: itemId,
        startDate: newStartDate,
        endDate: newEndDate,
      });
    },
    [items, updateMutation]
  );

  const handleResizeEnd = useCallback(
    (itemId: string, newWidth: number, pxPerDay: number, isStartResize: boolean) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const newDurationDays = Math.round(newWidth / pxPerDay);
      
      let newStartDate = item.startDate;
      let newEndDate = item.endDate;

      if (isStartResize) {
        newStartDate = snapToDay(
          new Date(item.endDate.getTime() - newDurationDays * 24 * 60 * 60 * 1000)
        );
      } else {
        newEndDate = snapToDay(
          new Date(item.startDate.getTime() + newDurationDays * 24 * 60 * 60 * 1000)
        );
      }

      const validation = validateGanttDates(newStartDate, newEndDate);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      updateMutation.mutate({
        id: itemId,
        startDate: newStartDate,
        endDate: newEndDate,
      });
    },
    [items, updateMutation]
  );

  const handleProgressChange = useCallback(
    (itemId: string, progress: number) => {
      updateMutation.mutate({ id: itemId, progress: Math.max(0, Math.min(100, progress)) });
    },
    [updateMutation]
  );

  return {
    items,
    isLoading,
    viewMode,
    setViewMode,
    dateRange,
    expandedIds,
    selectedItemId,
    setSelectedItemId,
    toggleExpanded,
    expandAll,
    collapseAll,
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    handleDragEnd,
    handleResizeEnd,
    handleProgressChange,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useGanttDrag(
  onDragEnd: (itemId: string, deltaX: number) => void
) {
  const [dragState, setDragState] = useState<{
    itemId: string | null;
    startX: number;
    currentX: number;
    isDragging: boolean;
  }>({ itemId: null, startX: 0, currentX: 0, isDragging: false });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string, initialLeft: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState({
        itemId,
        startX: e.clientX - initialLeft,
        currentX: initialLeft,
        isDragging: true,
      });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.itemId) return;
      setDragState((prev) => ({
        ...prev,
        currentX: e.clientX - prev.startX,
      }));
    },
    [dragState.isDragging, dragState.itemId, dragState.startX]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging || !dragState.itemId) return;
    const deltaX = dragState.currentX;
    onDragEnd(dragState.itemId, deltaX);
    setDragState({ itemId: null, startX: 0, currentX: 0, isDragging: false });
  }, [dragState, onDragEnd]);

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
