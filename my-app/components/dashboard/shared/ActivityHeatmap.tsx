"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
}

function getIntensityColor(count: number): string {
  if (count === 0) return "bg-muted/30";
  if (count <= 2) return "bg-primary/20";
  if (count <= 5) return "bg-primary/50";
  return "bg-primary";
}

function getIntensityLabel(count: number): string {
  if (count === 0) return "Nenhuma atividade";
  if (count <= 2) return "Pouca atividade";
  if (count <= 5) return "Atividade moderada";
  return "Muita atividade";
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Generate last 14 days
  const days: { date: string; count: number }[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayData = data.find((d) => d.date === dateStr);
    days.push({ date: dateStr, count: dayData?.count || 0 });
  }

  // Group by week for display
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Atividade (14 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day) => (
                <TooltipProvider key={day.date}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-sm cursor-pointer transition-colors hover:ring-2 hover:ring-primary",
                          getIntensityColor(day.count)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        {format(parseISO(day.date), "dd MMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {day.count} {day.count === 1 ? "ação" : "ações"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/50" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}
