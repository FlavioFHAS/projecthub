"use client";

import { useCallback } from "react";
import { X, Calendar } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import type { ProjectFilters, ProjectStatus } from "@/types/project";
import type { Client } from "@prisma/client";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  clients: Client[];
  members: { id: string; name: string; avatar: string | null }[];
  availableTags: string[];
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] =
  [
    { value: "ACTIVE", label: "Em andamento", color: "bg-emerald-500" },
    { value: "PAUSED", label: "Pausado", color: "bg-amber-500" },
    { value: "COMPLETED", label: "Concluído", color: "bg-blue-500" },
    { value: "PROPOSAL", label: "Em proposta", color: "bg-purple-500" },
  ];

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  clients,
  members,
  availableTags,
}: FilterPanelProps) {
  const handleStatusToggle = useCallback(
    (status: ProjectStatus) => {
      const newStatus = filters.status.includes(status)
        ? filters.status.filter((s) => s !== status)
        : [...filters.status, status];
      onFiltersChange({ ...filters, status: newStatus });
    },
    [filters, onFiltersChange]
  );

  const handleClientChange = useCallback(
    (clientId: string | null) => {
      onFiltersChange({ ...filters, clientId });
    },
    [filters, onFiltersChange]
  );

  const handleAssigneeChange = useCallback(
    (assigneeId: string | null) => {
      onFiltersChange({ ...filters, assigneeId });
    },
    [filters, onFiltersChange]
  );

  const handleTagToggle = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag];
      onFiltersChange({ ...filters, tags: newTags });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      status: [],
      clientId: null,
      assigneeId: null,
      tags: [],
      dateRange: { from: null, to: null },
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.clientId ||
    filters.assigneeId ||
    filters.tags.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filtros
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Status Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Status</h4>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={filters.status.includes(option.value)}
                    onCheckedChange={() => handleStatusToggle(option.value)}
                  />
                  <Label
                    htmlFor={`status-${option.value}`}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full ${option.color}`} />
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Client Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Cliente</h4>
            <Select
              value={filters.clientId || "all"}
              onValueChange={(value) =>
                handleClientChange(value === "all" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Assignee Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Responsável</h4>
            <Select
              value={filters.assigneeId || "all"}
              onValueChange={(value) =>
                handleAssigneeChange(value === "all" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Date Range Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Período</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">De</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-transparent text-sm"
                    value={
                      filters.dateRange.from
                        ? filters.dateRange.from.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          from: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Até</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-transparent text-sm"
                    value={
                      filters.dateRange.to
                        ? filters.dateRange.to.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          to: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            Limpar
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Aplicar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
