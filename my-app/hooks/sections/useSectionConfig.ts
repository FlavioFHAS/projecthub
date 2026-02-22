"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseSectionConfigProps<T extends object> {
  projectId: string;
  sectionId: string;
  initialConfig?: T;
}

async function fetchSectionConfig<T>(
  projectId: string,
  sectionId: string
): Promise<T> {
  const response = await fetch(
    `/api/projects/${projectId}/sections/${sectionId}`
  );
  if (!response.ok) throw new Error("Erro ao carregar configuração");
  const data = await response.json();
  return data.config as T;
}

async function updateSectionConfig<T>(
  projectId: string,
  sectionId: string,
  config: T
): Promise<T> {
  const response = await fetch(
    `/api/projects/${projectId}/sections/${sectionId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    }
  );
  if (!response.ok) throw new Error("Erro ao salvar configuração");
  return (await response.json()).config as T;
}

export function useSectionConfig<T extends object>({
  projectId,
  sectionId,
  initialConfig,
}: UseSectionConfigProps<T>) {
  const queryClient = useQueryClient();
  const queryKey = ["section-config", projectId, sectionId];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchSectionConfig<T>(projectId, sectionId),
    initialData: initialConfig,
  });

  const updateMutation = useMutation({
    mutationFn: async (updater: (prev: T) => T) => {
      const currentConfig = queryClient.getQueryData<T>(queryKey) || ({} as T);
      const newConfig = updater(currentConfig);
      return updateSectionConfig(projectId, sectionId, newConfig);
    },
    onMutate: async (updater) => {
      await queryClient.cancelQueries({ queryKey });
      const previousConfig = queryClient.getQueryData<T>(queryKey);
      if (previousConfig) {
        queryClient.setQueryData<T>(queryKey, updater(previousConfig));
      }
      return { previousConfig };
    },
    onError: (err, variables, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(queryKey, context.previousConfig);
      }
      toast.error("Erro ao salvar alterações");
    },
    onSuccess: () => {
      toast.success("Alterações salvas");
    },
  });

  const updateConfig = (updater: (prev: T) => T) => {
    updateMutation.mutate(updater);
  };

  const addItem = <K extends keyof T>(
    key: K,
    item: T[K] extends Array<infer U> ? U : never
  ) => {
    updateMutation.mutate((prev) => {
      const arr = (prev[key] as unknown as any[]) || [];
      return { ...prev, [key]: [...arr, item] };
    });
  };

  const updateItem = <K extends keyof T>(
    key: K,
    itemId: string,
    updates: Partial<T[K] extends Array<infer U> ? U : never>
  ) => {
    updateMutation.mutate((prev) => {
      const arr = (prev[key] as unknown as any[]) || [];
      return {
        ...prev,
        [key]: arr.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      };
    });
  };

  const removeItem = <K extends keyof T>(key: K, itemId: string) => {
    updateMutation.mutate((prev) => {
      const arr = (prev[key] as unknown as any[]) || [];
      return {
        ...prev,
        [key]: arr.filter((item) => item.id !== itemId),
      };
    });
  };

  return {
    config: data,
    isLoading,
    error,
    updateConfig,
    addItem,
    updateItem,
    removeItem,
    isUpdating: updateMutation.isPending,
  };
}
