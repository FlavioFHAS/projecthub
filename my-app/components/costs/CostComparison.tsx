"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { CostEntry, CostType } from "@prisma/client";
import { formatCurrency, COST_TYPE_CONFIG } from "@/lib/costs/cost-utils";
import { getChartColor } from "@/lib/charts/chart-config";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CostComparisonProps {
  entries: CostEntry[];
  budget: number;
  isLoading: boolean;
}

interface ComparisonData {
  category: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export function CostComparison({
  entries,
  budget,
  isLoading,
}: CostComparisonProps) {
  const comparisonData = useMemo((): ComparisonData[] => {
    const actualByCategory = entries.reduce((acc, entry) => {
      const amount = entry.amount * entry.quantity;
      acc[entry.type] = (acc[entry.type] || 0) + amount;
      return acc;
    }, {} as Record<CostType, number>);

    const totalActual = Object.values(actualByCategory).reduce(
      (sum, val) => sum + val,
      0
    );

    const categoryBudgets: Record<CostType, number> = {
      LABOR: budget * 0.4,
      MATERIAL: budget * 0.2,
      SERVICE: budget * 0.15,
      SOFTWARE: budget * 0.1,
      HARDWARE: budget * 0.08,
      TRAVEL: budget * 0.05,
      OTHER: budget * 0.02,
    };

    return Object.entries(COST_TYPE_CONFIG).map(([type, config]) => {
      const planned = categoryBudgets[type as CostType] || 0;
      const actual = actualByCategory[type as CostType] || 0;
      const variance = planned - actual;
      const variancePercent = planned > 0 ? (variance / planned) * 100 : 0;

      return {
        category: config.label,
        planned,
        actual,
        variance,
        variancePercent,
      };
    });
  }, [entries, budget]);

  const totals = useMemo(() => {
    return comparisonData.reduce(
      (acc, item) => ({
        planned: acc.planned + item.planned,
        actual: acc.actual + item.actual,
        variance: acc.variance + item.variance,
      }),
      { planned: 0, actual: 0, variance: 0 }
    );
  }, [comparisonData]);

  const totalVariancePercent =
    totals.planned > 0 ? (totals.variance / totals.planned) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
        <Card className="h-96 animate-pulse bg-muted" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orçamento Planejado</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(totals.planned)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gasto Real</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(totals.actual)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Variação</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    totals.variance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totals.variance >= 0 ? "+" : ""}
                  {formatCurrency(totals.variance)}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    totalVariancePercent >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totalVariancePercent >= 0 ? "+" : ""}
                  {totalVariancePercent.toFixed(1)}% vs planejado
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${
                  totals.variance >= 0 ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {totals.variance >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-white" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="planned"
                  name="Planejado"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actual"
                  name="Real"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisonData.map((item, index) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.category}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Planejado: {formatCurrency(item.planned)}
                    </span>
                    <span className="font-medium">
                      Real: {formatCurrency(item.actual)}
                    </span>
                    <span
                      className={`font-medium ${
                        item.variance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.variance >= 0 ? "+" : ""}
                      {formatCurrency(item.variance)}
                    </span>
                  </div>
                </div>
                <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary/30 rounded-full"
                    style={{
                      width: `${Math.min(
                        (item.planned / Math.max(...comparisonData.map((d) => d.planned))) * 100,
                        100
                      )}%`,
                    }}
                  />
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full ${
                      item.actual > item.planned ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (item.actual / Math.max(...comparisonData.map((d) => d.planned))) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {((item.actual / Math.max(item.planned, 1)) * 100).toFixed(1)}%
                    do planejado
                  </span>
                  <span
                    className={
                      item.variancePercent >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {item.variancePercent >= 0 ? "+" : ""}
                    {item.variancePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
