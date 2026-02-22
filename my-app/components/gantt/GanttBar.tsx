"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Edit2, Trash2 } from "lucide-react";
import {
  GanttDateRange,
  getItemPosition,
  getDateFromPosition,
  snapToDay,
  getProgressColor,
} from "@/lib/gantt/gantt-utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GanttBarProps {
  item: any;
  dateRange: GanttDateRange;
  pxPerDay: number;
  rowHeight: number;
  isSelected: boolean;
  onDragEnd?: (itemId: string, deltaX: number) => void;
  onResizeEnd?: (itemId: string, newWidth: number, pxPerDay: number, isStartResize: boolean) => void;
  onProgressChange?: (itemId: string, progress: number) => void;
  onEdit?: (item: any) => void;
}

export function GanttBar({
  item,
  dateRange,
  pxPerDay,
  rowHeight,
  isSelected,
  onDragEnd,
  onResizeEnd,
  onProgressChange,
  onEdit,
}: GanttBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingStart, setIsResizingStart] = useState(false);
  const [isResizingEnd, setIsResizingEnd] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, left: 0, width: 0 });
  const [currentPos, setCurrentPos] = useState({ left: 0, width: 0 });

  const position = getItemPosition(item, dateRange, pxPerDay);
  const barHeight = Math.min(rowHeight * 0.6, 24);
  const barTop = (rowHeight - barHeight) / 2;

  useEffect(() => {
    setCurrentPos(position);
  }, [position.left, position.width]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: "drag" | "resize-start" | "resize-end") => {
      e.preventDefault();
      e.stopPropagation();

      if (!onDragEnd && !onResizeEnd) return;

      const startX = e.clientX;
      const startLeft = position.left;
      const startWidth = position.width;

      setDragStart({ x: startX, left: startLeft, width: startWidth });

      if (mode === "drag") {
        setIsDragging(true);
      } else if (mode === "resize-start") {
        setIsResizingStart(true);
      } else if (mode === "resize-end") {
        setIsResizingEnd(true);
      }

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;

        if (mode === "drag") {
          setCurrentPos({
            left: startLeft + deltaX,
            width: startWidth,
          });
        } else if (mode === "resize-start") {
          const newLeft = Math.min(startLeft + deltaX, startLeft + startWidth - 20);
          const newWidth = startLeft + startWidth - newLeft;
          setCurrentPos({
            left: newLeft,
            width: newWidth,
          });
        } else if (mode === "resize-end") {
          const newWidth = Math.max(startWidth + deltaX, 20);
          setCurrentPos({
            left: startLeft,
            width: newWidth,
          });
        }
      };

      const handleMouseUp = () => {
        if (mode === "drag" && onDragEnd) {
          onDragEnd(item.id, currentPos.left - startLeft);
        } else if (mode === "resize-start" && onResizeEnd) {
          onResizeEnd(item.id, currentPos.width, pxPerDay, true);
        } else if (mode === "resize-end" && onResizeEnd) {
          onResizeEnd(item.id, currentPos.width, pxPerDay, false);
        }

        setIsDragging(false);
        setIsResizingStart(false);
        setIsResizingEnd(false);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [item.id, position, onDragEnd, onResizeEnd, pxPerDay, currentPos]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onProgressChange || !barRef.current) return;

      const rect = barRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = Math.round((clickX / rect.width) * 100);
      onProgressChange(item.id, Math.max(0, Math.min(100, newProgress)));
    },
    [item.id, onProgressChange]
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const duration = Math.ceil(
    (item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={barRef}
            className={cn(
              "absolute rounded-md cursor-pointer group transition-shadow",
              isSelected && "ring-2 ring-primary ring-offset-1"
            )}
            style={{
              left: currentPos.left,
              width: currentPos.width,
              height: barHeight,
              top: barTop,
            }}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-md overflow-hidden",
                getProgressColor(item.progress)
              )}
              onMouseDown={(e) => handleMouseDown(e, "drag")}
            >
              <div
                className="absolute inset-y-0 left-0 bg-black/20"
                style={{ width: `${item.progress}%` }}
              />

              <div
                className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white truncate px-2"
                onClick={handleProgressClick}
              >
                {item.progress > 20 && `${item.progress}%`}
              </div>
            </div>

            {onResizeEnd && (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize hover:bg-white/30"
                  onMouseDown={(e) => handleMouseDown(e, "resize-start")}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-white/30"
                  onMouseDown={(e) => handleMouseDown(e, "resize-end")}
                />
              </>
            )}

            {isSelected && onEdit && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 bg-popover border rounded-md p-1 shadow-lg z-30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              Duração: {duration} dias
            </p>
            <p className="text-xs text-muted-foreground">
              Progresso: {item.progress}%
            </p>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
