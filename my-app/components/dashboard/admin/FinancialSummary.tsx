"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSummaryProps {
  totalActual: number;
  totalPending: number;
  totalApproved: number;
  pendingCount: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FinancialSummary({
  totalActual,
  totalPending,
  totalApproved,
  pendingCount,
}: FinancialSummaryProps) {
  const [period, setPeriod] = useState("month");

  const utilizationRate = totalApproved > 0 ? (totalActual / totalApproved) * 100 : 0;

  // Mock data for top projects by cost
  const topProjects = [
    { name: "Projeto Alpha", cost: 55000, budget: 60000 },
    { name: "Projeto Beta", cost: 38000, budget: 57000 },
    { name: "Projeto Gamma", cost: 22000, budget: 46000 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Resumo Financeiro
        </CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Este trimestre</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget Overview */}
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Orçamento Aprovado</p>
              <p className="text-2xl font-bold">{formatCurrency(totalApproved)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os projetos ativos
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Realizado</p>
              <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={utilizationRate > 90 ? "destructive" : "secondary"}
                >
                  {utilizationRate.toFixed(0)}% utilizado
                </Badge>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">A Aprovar</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingCount} itens pendentes
              </p>
            </div>
          </div>

          {/* Utilization Bar */}
          <div className="space-y-4">
            <h4 className="font-medium">Utilização do Orçamento</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className={cn(
                  utilizationRate > 90 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {utilizationRate.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={utilizationRate}
                className={cn(
                  "h-3",
                  utilizationRate > 90 && "[&>div]:bg-red-500"
                )}
              />
              {utilizationRate > 90 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Orçamento crítico
                </p>
              )}
            </div>

            <div className="pt-4 space-y-3">
              <h4 className="font-medium text-sm">Top Projetos por Custo</h4>
              {topProjects.map((project, i) => (
                <div key={project.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{i + 1}. {project.name}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(project.cost)}
                    </span>
                  </div>
                  <Progress
                    value={(project.cost / project.budget) * 100}
                    className="h-1.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    {((project.cost / project.budget) * 100).toFixed(0)}% do orçamento
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend (Mock) */}
          <div className="space-y-4">
            <h4 className="font-medium">Evolução Mensal</h4>
            <div className="space-y-2">
              {["Jan", "Fev", "Mar", "Abr"].map((month, i) => {
                const values = [45000, 52000, 48000, totalActual];
                const prevValue = i > 0 ? values[i - 1] : values[0];
                const isUp = values[i] >= prevValue;

                return (
                  <div key={month} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{month}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCurrency(values[i])}
                      </span>
                      {i > 0 && (
                        isUp ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
