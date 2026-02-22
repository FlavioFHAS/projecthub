import type { ProjectFilters, ProjectStatus, ProjectWithClient } from "@/types/project";

/**
 * Filter projects based on active filters and search query
 */
export function filterProjects(
  projects: ProjectWithClient[],
  filters: ProjectFilters,
  searchQuery: string
): ProjectWithClient[] {
  return projects.filter((project) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        project.client?.name?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.tags?.some((tag) => tag.type.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(project.status)) {
      return false;
    }

    // Client filter
    if (filters.clientId && project.clientId !== filters.clientId) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const projectTagTypes = project.tags?.map((t) => t.type) || [];
      const hasMatchingTag = filters.tags.some((tag) =>
        projectTagTypes.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const projectStart = project.startDate
        ? new Date(project.startDate)
        : null;
      const projectEnd = project.endDate ? new Date(project.endDate) : null;

      if (filters.dateRange.from && projectStart) {
        if (projectStart < filters.dateRange.from) return false;
      }
      if (filters.dateRange.to && projectEnd) {
        if (projectEnd > filters.dateRange.to) return false;
      }
    }

    return true;
  });
}

/**
 * Calculate days remaining until end date
 */
export function getDaysRemaining(
  endDate: Date | string | null
): {
  days: number | null;
  label: string;
  variant: "normal" | "warning" | "danger" | "completed";
} {
  if (!endDate) {
    return { days: null, label: "Sem prazo", variant: "normal" };
  }

  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: diffDays,
      label: `${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? "s" : ""} atrasado`,
      variant: "danger",
    };
  }

  if (diffDays === 0) {
    return { days: 0, label: "Hoje", variant: "warning" };
  }

  if (diffDays <= 7) {
    return {
      days: diffDays,
      label: `${diffDays} dia${diffDays !== 1 ? "s" : ""}`,
      variant: "warning",
    };
  }

  return {
    days: diffDays,
    label: `${diffDays} dias`,
    variant: "normal",
  };
}

/**
 * Get CSS classes for status badge
 */
export function getStatusBadgeClass(status: ProjectStatus): string {
  const classes: Record<ProjectStatus, string> = {
    ACTIVE:
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    PAUSED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    COMPLETED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PROPOSAL: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };
  return classes[status];
}

/**
 * Get Portuguese label for status
 */
export function getStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    ACTIVE: "Em andamento",
    PAUSED: "Pausado",
    COMPLETED: "Concluído",
    PROPOSAL: "Em proposta",
  };
  return labels[status];
}

/**
 * Generate CSS gradient from project color
 */
export function getProjectGradient(color: string): string {
  // Darken the color slightly for the gradient end
  const darkenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  const endColor = darkenColor(color, 20);
  return `linear-gradient(135deg, ${color} 0%, ${endColor} 100%)`;
}

/**
 * Parse filters from URL search params
 */
export function parseFiltersFromURL(
  searchParams: URLSearchParams
): ProjectFilters {
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
}

/**
 * Build URL params from filters
 */
export function buildURLParams(filters: ProjectFilters): string {
  const params = new URLSearchParams();

  if (filters.status.length > 0) {
    params.set("status", filters.status.join(","));
  }
  if (filters.clientId) {
    params.set("clientId", filters.clientId);
  }
  if (filters.assigneeId) {
    params.set("assigneeId", filters.assigneeId);
  }
  if (filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","));
  }
  if (filters.dateRange.from) {
    params.set("from", filters.dateRange.from.toISOString().split("T")[0]);
  }
  if (filters.dateRange.to) {
    params.set("to", filters.dateRange.to.toISOString().split("T")[0]);
  }

  return params.toString();
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: ProjectFilters): number {
  let count = 0;
  if (filters.status.length > 0) count++;
  if (filters.clientId) count++;
  if (filters.assigneeId) count++;
  if (filters.tags.length > 0) count++;
  if (filters.dateRange.from || filters.dateRange.to) count++;
  return count;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PLANNING: "bg-blue-500",
    IN_PROGRESS: "bg-emerald-500",
    ON_HOLD: "bg-amber-500",
    COMPLETED: "bg-purple-500",
    CANCELLED: "bg-red-500",
    ACTIVE: "bg-emerald-500",
    PAUSED: "bg-amber-500",
    PROPOSAL: "bg-purple-500",
    TODO: "bg-slate-500",
    IN_REVIEW: "bg-blue-500",
    HIGH: "bg-red-500",
    MEDIUM: "bg-amber-500",
    LOW: "bg-emerald-500",
    CRITICAL: "bg-red-600",
    URGENT: "bg-orange-500",
  };
  return colors[status] || "bg-slate-500";
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "text-emerald-500 bg-emerald-500/10",
    MEDIUM: "text-amber-500 bg-amber-500/10",
    HIGH: "text-red-500 bg-red-500/10",
    URGENT: "text-red-600 bg-red-600/10",
    CRITICAL: "text-red-700 bg-red-700/10",
  };
  return colors[priority] || "text-slate-500 bg-slate-500/10";
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "agora";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours} h`;
  if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem`;
  
  return then.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}
