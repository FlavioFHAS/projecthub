"use client";

import React from "react";
import { ZoomIn, ZoomOut, Expand, Compress } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GanttViewMode } from "@/lib/gantt/gantt-utils";

interface GanttToolbarProps {
  viewMode: GanttViewMode;
  onViewModeChange: (mode: GanttViewMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const viewModeLabels: Record<GanttViewMode, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  quarter: "Trimestre",
};

export function GanttToolbar({
  viewMode,
  onViewModeChange,
  onExpandAll,
  onCollapseAll,
}: GanttToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4 p-3 bg-card border rounded-lg">
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as GanttViewMode)}
        >
          {(Object.keys(viewModeLabels) as GanttViewMode[]).map((mode) => (
            <ToggleGroupItem
              key={mode}
              value={mode}
              size="sm"
              className="text-xs"
            >
              {viewModeLabels[mode]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExpandAll}
          className="text-xs"
        >
          <Expand className="w-3 h-3 mr-1" />
          Expandir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCollapseAll}
          className="text-xs"
        >
          <Compress className="w-3 h-3 mr-1" />
          Recolher
        </Button>
      </div>
    </div>
  );
}
