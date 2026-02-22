"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, DollarSign, ArrowRight } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface OverdueItemsPanelProps {
  overdueTasks: any[];
  pendingCosts: any[];
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500 animate-pulse",
};

export function OverdueItemsPanel({ overdueTasks, pendingCosts }: OverdueItemsPanelProps) {
  const totalItems = overdueTasks.length + pendingCosts.length;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Itens Atrasados
          {totalItems > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {totalItems}
            </Badge>
          )}
        </CardTitle>
        <AlertTriangle className="w-5 h-5 text-red-500" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Tarefas Atrasadas ({overdueTasks.length})
            </h4>
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map((task) => {
                const daysOverdue = differenceInDays(new Date(), new Date(task.dueDate));

                return (
                  <div
                    key={task.id}
                    className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              PRIORITY_COLORS[task.priority] || "bg-gray-500"
                            )}
                          />
                          <span className="font-medium text-sm truncate">{task.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.project?.name} • {daysOverdue} dias atrasada
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {task.assignees.map((assignee: any) => (
                            <Avatar key={assignee.user.id} className="w-5 h-5">
                              <AvatarImage src={assignee.user.image} />
                              <AvatarFallback className="text-[10px]">
                                {assignee.user.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                      <Link href={`/projects/${task.projectId}/tasks`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Costs */}
        {pendingCosts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Aprovações Pendentes ({pendingCosts.length})
            </h4>
            <div className="space-y-2">
              {pendingCosts.slice(0, 2).map((cost) => (
                <div
                  key={cost.id}
                  className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(cost.amount * cost.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cost.project?.name}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalItems === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
            <p>Tudo em dia!</p>
            <p className="text-sm">Nenhum item atrasado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
