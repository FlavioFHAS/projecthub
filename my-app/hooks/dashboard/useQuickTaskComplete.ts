"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

async function quickCompleteTask(taskId: string) {
  const response = await fetch(`/api/tasks/${taskId}/quick-complete`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Erro ao concluir tarefa");
  }

  return response.json();
}

export function useQuickTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quickCompleteTask,
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["collaborator-dashboard"] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(["collaborator-dashboard"]);

      // Optimistically update
      queryClient.setQueryData(["collaborator-dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          myTasks: old.myTasks?.filter((t: any) => t.id !== taskId),
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Tarefa concluída! 🎉");

      // Check if first task of the day
      const today = new Date().toDateString();
      const todayCompleted = localStorage.getItem("tasksCompletedToday");

      if (todayCompleted !== today) {
        localStorage.setItem("tasksCompletedToday", today);
        // Trigger confetti effect here if desired
      }
    },
    onError: (error, taskId, context) => {
      // Revert optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          ["collaborator-dashboard"],
          context.previousData
        );
      }
      toast.error("Erro ao concluir tarefa");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["collaborator-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
