"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ProjectFilters, ProjectStatus } from "@/types/project";

interface ActiveFiltersProps {
  filters: ProjectFilters;
  onRemoveFilter: (key: keyof ProjectFilters, value?: any) => void;
  onClearAll: () => void;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Em andamento",
  PAUSED: "Pausado",
  COMPLETED: "Concluído",
  PROPOSAL: "Em proposta",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PAUSED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  COMPLETED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PROPOSAL: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.clientId ||
    filters.assigneeId ||
    filters.tags.length > 0 ||
    filters.dateRange.from ||
    filters.dateRange.to;

  if (!hasActiveFilters) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-4 sm:px-6 lg:px-8 py-3 border-b bg-muted/30"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Filtros ativos:</span>

        <AnimatePresence mode="popLayout">
          {/* Status Filters */}
          {filters.status.map((status) => (
            <motion.div
              key={`status-${status}`}
              layout
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
            >
              <Badge
                variant="outline"
                className={`${STATUS_COLORS[status]} cursor-pointer hover:opacity-80`}
                onClick={() => onRemoveFilter("status", status)}
              >
                {STATUS_LABELS[status]}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            </motion.div>
          ))}

          {/* Client Filter */}
          {filters.clientId && (
            <motion.div
              key="client"
              layout
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
            >
              <Badge
                variant="outline"
                className="bg-violet-500/20 text-violet-400 border-violet-500/30 cursor-pointer hover:opacity-80"
                onClick={() => onRemoveFilter("clientId")}
              >
                Cliente selecionado
                <X className="ml-1 h-3 w-3" />
              </Badge>
            </motion.div>
          )}

          {/* Assignee Filter */}
          {filters.assigneeId && (
            <motion.div
              key="assignee"
              layout
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
            >
              <Badge
                variant="outline"
                className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 cursor-pointer hover:opacity-80"
                onClick={() => onRemoveFilter("assigneeId")}
              >
                Responsável selecionado
                <X className="ml-1 h-3 w-3" />
              </Badge>
            </motion.div>
          )}

          {/* Tag Filters */}
          {filters.tags.map((tag) => (
            <motion.div
              key={`tag-${tag}`}
              layout
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
            >
              <Badge
                variant="outline"
                className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 cursor-pointer hover:opacity-80"
                onClick={() => onRemoveFilter("tags", tag)}
              >
                #{tag}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            </motion.div>
          ))}

          {/* Date Range Filter */}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <motion.div
              key="dateRange"
              layout
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
            >
              <Badge
                variant="outline"
                className="bg-orange-500/20 text-orange-400 border-orange-500/30 cursor-pointer hover:opacity-80"
                onClick={() => onRemoveFilter("dateRange")}
              >
                {filters.dateRange.from && filters.dateRange.to
                  ? `${filters.dateRange.from.toLocaleDateString("pt-BR")} - ${filters.dateRange.to.toLocaleDateString("pt-BR")}`
                  : filters.dateRange.from
                  ? `A partir de ${filters.dateRange.from.toLocaleDateString("pt-BR")}`
                  : `Até ${filters.dateRange.to?.toLocaleDateString("pt-BR")}`}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onClearAll}
        >
          Limpar todos
        </Button>
      </div>
    </motion.div>
  );
}
