"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export interface ProjectMember {
  id: string;
  role: string;
  permissions: any;
  joinedAt: string;
  isActive: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    company: string | null;
  };
}

const fetchTeamMembers = async (projectId: string): Promise<ProjectMember[]> => {
  const response = await apiClient.get(`/projects/${projectId}/members`);
  return response.data;
};

export function useTeamMembers(
  projectId: string,
  initialData?: ProjectMember[]
) {
  const { data, isLoading } = useQuery({
    queryKey: ["team", projectId],
    queryFn: () => fetchTeamMembers(projectId),
    initialData,
  });

  const activeMembers = useMemo(
    () => data?.filter((m) => m.isActive) ?? [],
    [data]
  );

  const inactiveMembers = useMemo(
    () => data?.filter((m) => !m.isActive) ?? [],
    [data]
  );

  return {
    activeMembers,
    inactiveMembers,
    allMembers: data ?? [],
    isLoading,
  };
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; role: string; permissions?: any }) =>
      apiClient.post(`/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", projectId] });
      toast.success("Membro adicionado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao adicionar membro");
    },
  });
}

export function useUpdateMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string;
      data: Partial<ProjectMember>;
    }) => apiClient.patch(`/projects/${projectId}/members/${memberId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", projectId] });
      toast.success("Membro atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar membro");
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      apiClient.delete(`/projects/${projectId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", projectId] });
      toast.success("Membro removido");
    },
    onError: () => {
      toast.error("Erro ao remover membro");
    },
  });
}

export function useToggleMemberStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, isActive }: { memberId: string; isActive: boolean }) =>
      apiClient.patch(`/projects/${projectId}/members/${memberId}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", projectId] });
      toast.success("Status atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });
}
