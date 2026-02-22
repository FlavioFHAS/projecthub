"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { MeetingStatus } from "@/lib/meetings/meeting-utils";

export interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  type: "IN_PERSON" | "ONLINE" | "HYBRID";
  status: MeetingStatus;
  date: string;
  duration: number;
  location?: string | null;
  meetingUrl?: string | null;
  agenda?: object | null;
  minutes?: object | null;
  decisions?: string[];
  nextSteps?: { description: string; assigneeId?: string; dueDate?: string }[];
  isVisibleToClient: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  participants: {
    id: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    attended: boolean;
  }[];
}

interface GroupedMeetings {
  scheduled: Meeting[];
  completed: Meeting[];
  cancelled: Meeting[];
}

const fetchMeetings = async (projectId: string): Promise<Meeting[]> => {
  const response = await apiClient.get(`/projects/${projectId}/meetings`);
  return response.data;
};

export function useMeetings(projectId: string, initialData?: Meeting[]) {
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings", projectId],
    queryFn: () => fetchMeetings(projectId),
    initialData,
  });

  const groupedMeetings: GroupedMeetings = {
    scheduled: meetings
      .filter((m) => m.status === "SCHEDULED")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    completed: meetings
      .filter((m) => m.status === "COMPLETED")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    cancelled: meetings
      .filter((m) => m.status === "CANCELLED")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };

  return {
    meetings,
    groupedMeetings,
    isLoading,
  };
}

export function useCreateMeeting(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Meeting>) =>
      apiClient.post(`/projects/${projectId}/meetings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", projectId] });
      toast.success("Reunião criada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar reunião");
    },
  });
}

export function useUpdateMeeting(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: string; data: Partial<Meeting> }) =>
      apiClient.patch(`/projects/${projectId}/meetings/${meetingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", projectId] });
      toast.success("Reunião atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar reunião");
    },
  });
}

export function useDeleteMeeting(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) =>
      apiClient.delete(`/projects/${projectId}/meetings/${meetingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", projectId] });
      toast.success("Reunião excluída");
    },
    onError: () => {
      toast.error("Erro ao excluir reunião");
    },
  });
}

export function useCompleteMeeting(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) =>
      apiClient.patch(`/projects/${projectId}/meetings/${meetingId}`, {
        status: "COMPLETED",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", projectId] });
      toast.success("Reunião marcada como realizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar reunião");
    },
  });
}
