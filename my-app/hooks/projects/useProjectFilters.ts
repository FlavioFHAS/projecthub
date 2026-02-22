"use client";

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProjectFilters, ProjectStatus } from "@/types/project";

export function useProjectFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const filters = useMemo<ProjectFilters>(() => {
    const statusParam = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const assigneeId = searchParams.get("assigneeId");
    const tagsParam = searchParams.get("tags");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    return {
      status: statusParam
        ? (statusParam.split(",") as ProjectStatus[])
        : [],
      clientId: clientId || null,
      assigneeId: assigneeId || null,
      tags: tagsParam ? tagsParam.split(",") : [],
      dateRange: {
        from: from ? new Date(from) : null,
        to: to ? new Date(to) : null,
      },
    };
  }, [searchParams]);

  // Update URL with new filters
  const setFilters = useCallback(
    (newFilters: ProjectFilters) => {
      const params = new URLSearchParams();

      if (newFilters.status.length > 0) {
        params.set("status", newFilters.status.join(","));
      }
      if (newFilters.clientId) {
        params.set("clientId", newFilters.clientId);
      }
      if (newFilters.assigneeId) {
        params.set("assigneeId", newFilters.assigneeId);
      }
      if (newFilters.tags.length > 0) {
        params.set("tags", newFilters.tags.join(","));
      }
      if (newFilters.dateRange.from) {
        params.set("from", newFilters.dateRange.from.toISOString().split("T")[0]);
      }
      if (newFilters.dateRange.to) {
        params.set("to", newFilters.dateRange.to.toISOString().split("T")[0]);
      }

      const queryString = params.toString();
      router.replace(
        queryString ? `/projects?${queryString}` : "/projects",
        { scroll: false }
      );
    },
    [router]
  );

  // Remove a specific filter
  const removeFilter = useCallback(
    (key: keyof ProjectFilters, value?: any) => {
      const newFilters = { ...filters };

      if (key === "status" && value) {
        newFilters.status = newFilters.status.filter((s) => s !== value);
      } else if (key === "tags" && value) {
        newFilters.tags = newFilters.tags.filter((t) => t !== value);
      } else if (key === "dateRange") {
        newFilters.dateRange = { from: null, to: null };
      } else {
        (newFilters as any)[key] =
          key === "status" || key === "tags" ? [] : null;
      }

      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.replace("/projects", { scroll: false });
  }, [router]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.clientId) count++;
    if (filters.assigneeId) count++;
    if (filters.tags.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    removeFilter,
    clearFilters,
    activeFiltersCount,
    hasActiveFilters: activeFiltersCount > 0,
  };
}
