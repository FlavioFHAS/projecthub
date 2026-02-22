"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { BoardHeader } from "./BoardHeader";
import { FilterPanel } from "./FilterPanel";
import { ActiveFilters } from "./ActiveFilters";
import { ProjectsGrid } from "./ProjectsGrid";
import { ProjectsList } from "./ProjectsList";
import { ProjectsBoardEmpty } from "./ProjectsBoardEmpty";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";
import { ProjectFormModal } from "./ProjectFormModal";

import { useProjectFilters } from "@/hooks/projects/useProjectFilters";
import { useAppStore } from "@/store/useAppStore";
import { apiClient } from "@/lib/api-client";
import { filterProjects } from "@/lib/projects/board-utils";

import type { ProjectWithClient, ProjectFilters } from "@/types/project";
import type { Client } from "@prisma/client";

interface ProjectsBoardProps {
  initialProjects: ProjectWithClient[];
  clients: Client[];
  availableTags: string[];
  members: { id: string; name: string; avatar: string | null }[];
  userRole: string;
}

export function ProjectsBoard({
  initialProjects,
  clients,
  availableTags,
  members,
  userRole,
}: ProjectsBoardProps) {
  const queryClient = useQueryClient();
  const { boardViewMode, setBoardViewMode } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { filters, setFilters, removeFilter, clearFilters, activeFiltersCount } =
    useProjectFilters();

  // Fetch projects with TanStack Query
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status.length) params.set("status", filters.status.join(","));
      if (filters.clientId) params.set("clientId", filters.clientId);
      if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
      if (filters.tags.length) params.set("tags", filters.tags.join(","));

      const response = await apiClient.get(`/projects?${params.toString()}`);
      return response.data;
    },
    initialData: initialProjects,
    staleTime: 30 * 1000,
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (newOrder: { id: string; order: number }[]) => {
      await apiClient.patch("/projects/reorder", { projectIds: newOrder.map((o) => o.id) });
    },
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<ProjectWithClient[]>(["projects"]);

      if (previousProjects) {
        const reorderedProjects = [...previousProjects].sort((a, b) => {
          const orderA = newOrder.find((o) => o.id === a.id)?.order ?? 0;
          const orderB = newOrder.find((o) => o.id === b.id)?.order ?? 0;
          return orderA - orderB;
        });
        queryClient.setQueryData(["projects"], reorderedProjects);
      }

      return { previousProjects };
    },
    onError: (err, newOrder, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
      toast.error("Erro ao salvar nova ordem");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  // Filter projects locally based on search query
  const filteredProjects = filterProjects(projects || [], filters, searchQuery);

  const handleReorder = useCallback(
    (newOrder: { id: string; order: number }[]) => {
      reorderMutation.mutate(newOrder);
    },
    [reorderMutation]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const canCreateProject = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      {/* Board Header */}
      <BoardHeader
        totalProjects={filteredProjects.length}
        viewMode={boardViewMode}
        onViewModeChange={setBoardViewMode}
        onSearch={handleSearch}
        onFilterOpen={() => setIsFilterPanelOpen(true)}
        onCreateClick={() => setIsCreateModalOpen(true)}
        activeFiltersCount={activeFiltersCount}
        searchQuery={searchQuery}
        canCreate={canCreateProject}
      />

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <ActiveFilters
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearAll={clearFilters}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          // Empty State
          <ProjectsBoardEmpty
            hasFilters={activeFiltersCount > 0 || searchQuery.length > 0}
            canCreate={canCreateProject}
            onClearFilters={clearFilters}
            onCreateClick={() => setIsCreateModalOpen(true)}
          />
        ) : (
          // Projects View
          <AnimatePresence mode="wait">
            <motion.div
              key={boardViewMode}
              initial={{ opacity: 0, x: boardViewMode === "grid" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: boardViewMode === "grid" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              {boardViewMode === "grid" ? (
                <ProjectsGrid
                  projects={filteredProjects}
                  onReorder={handleReorder}
                  isReordering={reorderMutation.isPending}
                />
              ) : (
                <ProjectsList projects={filteredProjects} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        clients={clients}
        members={members}
        availableTags={availableTags}
      />

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        clients={clients}
        mode="create"
      />
    </div>
  );
}
