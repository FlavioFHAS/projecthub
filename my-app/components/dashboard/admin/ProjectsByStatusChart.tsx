"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ProjectsByStatusChartProps {
  data: Record<string, number>;
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10b981",    // emerald
  PAUSED: "#f59e0b",    // amber
  COMPLETED: "#3b82f6", // blue
  PROPOSAL: "#8b5cf6",  // violet
  CANCELLED: "#6b7280", // gray
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Em andamento",
  PAUSED: "Pausado",
  COMPLETED: "Concluído",
  PROPOSAL: "Proposta",
  CANCELLED: "Cancelado",
};

export function ProjectsByStatusChart({ data, total }: ProjectsByStatusChartProps) {
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || "#6b7280",
  }));

  const hasData = total > 0;

  return (
    <Card className="h-[350px]">
      <CardHeader>
        <CardTitle className="text-lg">Projetos por Status</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} projetos (${((value / total) * 100).toFixed(0)}%)`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
              <span className="text-2xl font-bold">0</span>
            </div>
            <p className="mt-4">Nenhum projeto</p>
          </div>
        )}
        
        {/* Center text */}
        {hasData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">projetos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
