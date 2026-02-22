"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  GanttViewMode,
  GanttDateRange,
  getTotalDays,
  generateTimelineHeaders,
  isWeekend,
  VIEW_MODE_CONFIG,
} from "@/lib/gantt/gantt-utils";
import { GanttBar } from "./GanttBar";

interface GanttChartProps {
  items: any[];
  dateRange: GanttDateRange;
  viewMode: GanttViewMode;
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  onDragEnd?: (itemId: string, deltaX: number) => void;
  onResizeEnd?: (itemId: string, newWidth: number, pxPerDay: number, isStartResize: boolean) => void;
  onProgressChange?: (itemId: string, progress: number) => void;
  onEditItem?: (item: any) => void;
  pxPerDay: number;
  rowHeight: number;
}

export function GanttChart({
  items,
  dateRange,
  viewMode,
  selectedItemId,
  onSelectItem,
  onDragEnd,
  onResizeEnd,
  onProgressChange,
  onEditItem,
  pxPerDay,
  rowHeight,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const totalDays = getTotalDays(dateRange);
  const totalWidth = totalDays * pxPerDay;
  const headers = generateTimelineHeaders(dateRange, viewMode);

  const today = new Date();
  const todayOffset =
    (today.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
  const todayPosition = todayOffset * pxPerDay;

  useEffect(() => {
    if (containerRef.current && todayPosition > 0) {
      containerRef.current.scrollLeft = Math.max(0, todayPosition - 200);
    }
  }, [todayPosition]);

  return (
    <div ref={containerRef} className="h-full overflow-auto">
      <div style={{ width: totalWidth, minWidth: "100%" }}>
        <div className="sticky top-0 z-10 bg-card border-b">
          <div className="flex">
            {headers.map((header, index) => (
              <div
                key={index}
                className={cn(
                  "flex-shrink-0 border-r px-2 py-2 text-xs font-medium text-center",
                  viewMode === "day" && "w-[50px]"
                )}
                style={{
                  width:
                    viewMode === "day"
                      ? pxPerDay
                      : undefined,
                  minWidth: viewMode !== "day" ? VIEW_MODE_CONFIG[viewMode].columnWidth : undefined,
                }}
              >
                {header.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex">
            {Array.from({ length: totalDays }).map((_, index) => {
              const date = new Date(
                dateRange.start.getTime() + index * 24 * 60 * 60 * 1000
              );
              const isWeekendDay = isWeekend(date);

              return (
                <div
                  key={index}
                  style={{ width: pxPerDay }}
                  className={cn(
                    "flex-shrink-0 border-r",
                    isWeekendDay && "bg-muted/30"
                  )}
                />
              );
            })}
          </div>

          {todayPosition > 0 && todayPosition < totalWidth && (
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-20"
              style={{ left: todayPosition }}
            >
              <div className="absolute -top-1 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1 rounded">
                Hoje
              </div>
            </div>
          )}

          <div className="relative">
            {items.length === 0 ? (
              <div
                className="flex items-center justify-center text-muted-foreground"
                style={{ height: rowHeight * 3 }}
              >
                Nenhuma atividade para exibir
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  style={{ height: rowHeight }}
                  className="relative border-b"
                  onClick={() => onSelectItem(item.id)}
                >
                  <GanttBar
                    item={item}
                    dateRange={dateRange}
                    pxPerDay={pxPerDay}
                    rowHeight={rowHeight}
                    isSelected={selectedItemId === item.id}
                    onDragEnd={onDragEnd}
                    onResizeEnd={onResizeEnd}
                    onProgressChange={onProgressChange}
                    onEdit={onEditItem}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
