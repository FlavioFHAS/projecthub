"use client";

import React from "react";
import { ChevronRight, ChevronDown, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GanttItemWithChildren } from "@/lib/gantt/gantt-utils";
import { Button } from "@/components/ui/button";

interface GanttActivityListProps {
  items: GanttItemWithChildren[];
  expandedIds: Set<string>;
  selectedItemId: string | null;
  onToggleExpanded: (itemId: string) => void;
  onSelectItem: (itemId: string | null) => void;
  onEditItem?: (item: GanttItemWithChildren) => void;
  rowHeight: number;
}

export function GanttActivityList({
  items,
  expandedIds,
  selectedItemId,
  onToggleExpanded,
  onSelectItem,
  onEditItem,
  rowHeight,
}: GanttActivityListProps) {
  const renderItem = (item: GanttItemWithChildren, level: number = 0) => {
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = selectedItemId === item.id;
    const paddingLeft = level * 16 + 8;

    return (
      <React.Fragment key={item.id}>
        <div
          style={{ height: rowHeight, paddingLeft }}
          className={cn(
            "flex items-center gap-1 border-b hover:bg-muted/50 cursor-pointer transition-colors",
            isSelected && "bg-primary/10 hover:bg-primary/10"
          )}
          onClick={() => onSelectItem(item.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(item.id);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <span className="flex-1 truncate text-sm">{item.title}</span>

          {onEditItem && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onEditItem(item);
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {hasChildren &&
          isExpanded &&
          item.children!.map((child) => renderItem(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div
        className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50 font-medium text-xs uppercase tracking-wider"
        style={{ height: rowHeight }}
      >
        Atividade
      </div>
      <div className="divide-y">
        {items.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhuma atividade cadastrada
          </div>
        ) : (
          items.map((item) => renderItem(item))
        )}
      </div>
    </div>
  );
}
