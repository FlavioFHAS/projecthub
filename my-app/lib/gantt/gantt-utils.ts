import { GanttItem } from "@prisma/client";
import { addDays, differenceInDays, format, startOfDay, endOfDay, isSameDay, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export type GanttViewMode = "day" | "week" | "month" | "quarter";

export interface GanttItemWithChildren extends GanttItem {
  children?: GanttItemWithChildren[];
  level?: number;
  isExpanded?: boolean;
}

export interface GanttDateRange {
  start: Date;
  end: Date;
}

export const VIEW_MODE_CONFIG: Record<GanttViewMode, { pxPerDay: number; columnWidth: number; headerFormat: string }> = {
  day: { pxPerDay: 50, columnWidth: 50, headerFormat: "dd/MM" },
  week: { pxPerDay: 20, columnWidth: 140, headerFormat: "'Sem' w" },
  month: { pxPerDay: 5, columnWidth: 150, headerFormat: "MMM yyyy" },
  quarter: { pxPerDay: 2, columnWidth: 200, headerFormat: "'Q'Q yyyy" },
};

export function getDateRange(items: GanttItem[]): GanttDateRange {
  if (items.length === 0) {
    const today = new Date();
    return { start: startOfDay(today), end: endOfDay(addDays(today, 30)) };
  }

  const dates = items.flatMap((item) => [item.startDate, item.endDate]);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  return {
    start: startOfDay(addDays(minDate, -7)),
    end: endOfDay(addDays(maxDate, 14)),
  };
}

export function getTotalDays(range: GanttDateRange): number {
  return differenceInDays(range.end, range.start) + 1;
}

export function getItemPosition(
  item: GanttItem,
  range: GanttDateRange,
  pxPerDay: number
): { left: number; width: number } {
  const startOffset = differenceInDays(startOfDay(item.startDate), range.start);
  const duration = differenceInDays(endOfDay(item.endDate), startOfDay(item.startDate)) + 1;

  return {
    left: startOffset * pxPerDay,
    width: Math.max(duration * pxPerDay, 20),
  };
}

export function getDateFromPosition(
  position: number,
  range: GanttDateRange,
  pxPerDay: number
): Date {
  const daysOffset = Math.round(position / pxPerDay);
  return addDays(range.start, daysOffset);
}

export function flattenGanttItems(
  items: GanttItemWithChildren[],
  expandedIds: Set<string>,
  level = 0
): GanttItemWithChildren[] {
  const result: GanttItemWithChildren[] = [];

  for (const item of items) {
    result.push({ ...item, level });
    if (item.children && item.children.length > 0 && expandedIds.has(item.id)) {
      result.push(...flattenGanttItems(item.children, expandedIds, level + 1));
    }
  }

  return result;
}

export function buildGanttHierarchy(items: GanttItem[]): GanttItemWithChildren[] {
  const itemMap = new Map<string, GanttItemWithChildren>();
  const roots: GanttItemWithChildren[] = [];

  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [], level: 0 });
  });

  items.forEach((item) => {
    const node = itemMap.get(item.id)!;
    const parentId = item.dependencies?.[0];
    
    if (parentId && itemMap.has(parentId)) {
      const parent = itemMap.get(parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function formatGanttDate(date: Date, viewMode: GanttViewMode): string {
  const formats: Record<GanttViewMode, string> = {
    day: "dd/MM/yyyy",
    week: "'Sem' w - MMM yyyy",
    month: "MMMM yyyy",
    quarter: "'Q'Q yyyy",
  };
  return format(date, formats[viewMode], { locale: ptBR });
}

export function generateTimelineHeaders(
  range: GanttDateRange,
  viewMode: GanttViewMode
): { date: Date; label: string }[] {
  const headers: { date: Date; label: string }[] = [];
  const totalDays = getTotalDays(range);

  if (viewMode === "day") {
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(range.start, i);
      headers.push({
        date,
        label: format(date, "dd", { locale: ptBR }),
      });
    }
  } else if (viewMode === "week") {
    const weeksCount = Math.ceil(totalDays / 7);
    for (let i = 0; i < weeksCount; i++) {
      const date = addDays(range.start, i * 7);
      headers.push({
        date,
        label: format(date, "'S'w", { locale: ptBR }),
      });
    }
  } else if (viewMode === "month") {
    let currentDate = range.start;
    while (isBefore(currentDate, range.end)) {
      headers.push({
        date: currentDate,
        label: format(currentDate, "MMM", { locale: ptBR }),
      });
      currentDate = addDays(currentDate, 32);
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }
  } else if (viewMode === "quarter") {
    let currentDate = range.start;
    while (isBefore(currentDate, range.end)) {
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      headers.push({
        date: currentDate,
        label: `Q${quarter}`,
      });
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 1);
    }
  }

  return headers;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getProgressColor(progress: number): string {
  if (progress < 25) return "bg-red-500";
  if (progress < 50) return "bg-orange-500";
  if (progress < 75) return "bg-yellow-500";
  return "bg-green-500";
}

export function getDependencyPath(
  fromItem: GanttItem,
  toItem: GanttItem,
  range: GanttDateRange,
  pxPerDay: number,
  rowHeight: number,
  fromIndex: number,
  toIndex: number
): string {
  const fromPos = getItemPosition(fromItem, range, pxPerDay);
  const toPos = getItemPosition(toItem, range, pxPerDay);

  const fromX = fromPos.left + fromPos.width;
  const fromY = fromIndex * rowHeight + rowHeight / 2;
  const toX = toPos.left;
  const toY = toIndex * rowHeight + rowHeight / 2;

  const midX = (fromX + toX) / 2;

  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

export function snapToDay(date: Date): Date {
  return startOfDay(date);
}

export function validateGanttDates(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
  if (isAfter(startDate, endDate)) {
    return { valid: false, error: "A data de início não pode ser posterior à data de término" };
  }
  
  const maxDuration = 365 * 5;
  if (differenceInDays(endDate, startDate) > maxDuration) {
    return { valid: false, error: "A duração máxima é de 5 anos" };
  }

  return { valid: true };
}
