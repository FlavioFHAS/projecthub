"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CostEntry, CostType, CostStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  calculateCostMetrics,
  getCostsByCategory,
  getCostsByMonth,
  getCostsByStatus,
  exportCostsToCSV,
  downloadCSV,
} from "@/lib/costs/cost-utils";

interface UseCostsProps {
  projectId: string;
  budget?: number;
}

interface CreateCostData {
  description: string;
  type: CostType;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  date: Date;
  notes?: string;
}

interface UpdateCostData {
  id: string;
  description?: string;
  type?: CostType;
  amount?: number;
  quantity?: number;
  unitPrice?: number;
  date?: Date;
  status?: CostStatus;
  notes?: string;
}

const fetchCosts = async (projectId: string): Promise<CostEntry[]> => {
  const response = await fetch(`/api/projects/${projectId}/costs`);
  if (!response.ok) throw new Error("Erro ao carregar custos");
  return response.json();
};

const createCost = async (
  projectId: string,
  data: CreateCostData
): Promise<CostEntry> => {
  const response = await fetch(`/api/projects/${projectId}/costs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Erro ao criar custo");
  return response.json();
};

const updateCost = async (
  projectId: string,
  data: UpdateCostData
): Promise<CostEntry> => {
  const response = await fetch(`/api/projects/${projectId}/costs/${data.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Erro ao atualizar custo");
  return response.json();
};

const deleteCost = async (
  projectId: string,
  costId: string
): Promise<void> => {
  const response = await fetch(`/api/projects/${projectId}/costs/${costId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Erro ao excluir custo");
};

const exportToExcel = async (projectId: string): Promise<Blob> => {
  const response = await fetch(`/api/projects/${projectId}/costs/export`, {
    method: "GET",
  });
  if (!response.ok) throw new Error("Erro ao exportar custos");
  return response.blob();
};

export function useCosts({ projectId, budget = 0 }: UseCostsProps) {
  const queryClient = useQueryClient();
  const [selectedTypes, setSelectedTypes] = useState<CostType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<CostStatus[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["costs", projectId],
    queryFn: () => fetchCosts(projectId),
  });

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(entry.type))
        return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(entry.status))
        return false;
      if (dateRange.start && entry.date < dateRange.start) return false;
      if (dateRange.end && entry.date > dateRange.end) return false;
      if (
        searchQuery &&
        !entry.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [entries, selectedTypes, selectedStatuses, dateRange, searchQuery]);

  const metrics = useMemo(
    () => calculateCostMetrics(filteredEntries, budget),
    [filteredEntries, budget]
  );

  const costsByCategory = useMemo(
    () => getCostsByCategory(filteredEntries),
    [filteredEntries]
  );

  const costsByMonth = useMemo(
    () => getCostsByMonth(filteredEntries),
    [filteredEntries]
  );

  const costsByStatus = useMemo(
    () => getCostsByStatus(filteredEntries),
    [filteredEntries]
  );

  const createMutation = useMutation({
    mutationFn: (data: CreateCostData) => createCost(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs", projectId] });
      toast.success("Custo criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar custo"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCostData) => updateCost(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs", projectId] });
      toast.success("Custo atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar custo"),
  });

  const deleteMutation = useMutation({
    mutationFn: (costId: string) => deleteCost(projectId, costId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs", projectId] });
      toast.success("Custo excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir custo"),
  });

  const exportCSVMutation = useMutation({
    mutationFn: () => {
      const csv = exportCostsToCSV(filteredEntries);
      downloadCSV(csv, `custos-${projectId}-${new Date().toISOString().split("T")[0]}.csv`);
      return Promise.resolve();
    },
    onSuccess: () => toast.success("CSV exportado com sucesso"),
    onError: () => toast.error("Erro ao exportar CSV"),
  });

  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const blob = await exportToExcel(projectId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `custos-${projectId}-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("Excel exportado com sucesso"),
    onError: () => toast.error("Erro ao exportar Excel"),
  });

  const approveCost = useCallback(
    (costId: string) => {
      updateMutation.mutate({ id: costId, status: "APPROVED" });
    },
    [updateMutation]
  );

  const rejectCost = useCallback(
    (costId: string) => {
      updateMutation.mutate({ id: costId, status: "REJECTED" });
    },
    [updateMutation]
  );

  const markAsPaid = useCallback(
    (costId: string) => {
      updateMutation.mutate({ id: costId, status: "PAID" });
    },
    [updateMutation]
  );

  return {
    entries,
    filteredEntries,
    isLoading,
    metrics,
    costsByCategory,
    costsByMonth,
    costsByStatus,
    filters: {
      selectedTypes,
      setSelectedTypes,
      selectedStatuses,
      setSelectedStatuses,
      dateRange,
      setDateRange,
      searchQuery,
      setSearchQuery,
    },
    createCost: createMutation.mutate,
    updateCost: updateMutation.mutate,
    deleteCost: deleteMutation.mutate,
    approveCost,
    rejectCost,
    markAsPaid,
    exportCSV: exportCSVMutation.mutate,
    exportExcel: exportExcelMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExportingCSV: exportCSVMutation.isPending,
    isExportingExcel: exportExcelMutation.isPending,
  };
}
