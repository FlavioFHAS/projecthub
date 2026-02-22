"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Clock, AlertCircle } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ActiveProjectsTableProps {
  projects: any[];
}

function getDaysRemainingColor(days: number | null): string {
  if (days === null) return "text-muted-foreground";
  if (days < 0) return "text-red-600";
  if (days < 7) return "text-amber-600";
  return "text-green-600";
}

function getDaysRemainingText(days: number | null): string {
  if (days === null) return "Sem prazo";
  if (days < 0) return `${Math.abs(days)} dias atrasado`;
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Amanhã";
  return `${days} dias restantes`;
}

export function ActiveProjectsTable({ projects }: ActiveProjectsTableProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Projetos em Andamento</CardTitle>
        <Link
          href="/projects"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Projeto</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Progresso</th>
                <th className="pb-3 font-medium">Prazo</th>
                <th className="pb-3 font-medium">Tarefas</th>
                <th className="pb-3 font-medium">Equipe</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((project) => {
                const daysRemaining = project.dueDate
                  ? differenceInDays(new Date(project.dueDate), new Date())
                  : null;

                return (
                  <tr
                    key={project.id}
                    className="group hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color || "#3b82f6" }}
                        />
                        <span className="font-medium">{project.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {project.client?.name || "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress || 0} className="w-20 h-2" />
                        <span className="text-sm">{project.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn("text-sm flex items-center gap-1", getDaysRemainingColor(daysRemaining))}>
                        <Clock className="w-3 h-3" />
                        {getDaysRemainingText(daysRemaining)}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant={project.openTasks > 5 ? "destructive" : "secondary"}>
                        {project.openTasks} abertas
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map((member: any) => (
                          <Avatar key={member.user.id} className="w-7 h-7 border-2 border-background">
                            <AvatarImage src={member.user.image} />
                            <AvatarFallback className="text-xs">
                              {member.user.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.members.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +{project.members.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum projeto ativo no momento
          </div>
        )}
      </CardContent>
    </Card>
  );
}
