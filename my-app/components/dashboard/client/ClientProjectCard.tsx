"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ClientProjectCardProps {
  project: any;
}

function getStatusBadge(project: any): { label: string; color: string; icon: any } {
  if (project.status === "COMPLETED") {
    return { label: "Entregue", color: "bg-green-500", icon: CheckCircle };
  }

  if (!project.dueDate) {
    return { label: "Em andamento", color: "bg-blue-500", icon: Clock };
  }

  const daysRemaining = differenceInDays(new Date(project.dueDate), new Date());

  if (daysRemaining < 0) {
    return { label: "Atrasado", color: "bg-red-500", icon: AlertCircle };
  }
  if (daysRemaining < 7) {
    return { label: "Atenção", color: "bg-amber-500", icon: Clock };
  }

  return { label: "No prazo", color: "bg-green-500", icon: CheckCircle };
}

export function ClientProjectCard({ project }: ClientProjectCardProps) {
  const status = getStatusBadge(project);
  const StatusIcon = status.icon;

  const daysRemaining = project.dueDate
    ? differenceInDays(new Date(project.dueDate), new Date())
    : null;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="h-full overflow-hidden">
        {/* Project Cover */}
        <div
          className="h-24 w-full"
          style={{ backgroundColor: project.color || "#3b82f6" }}
        />

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between -mt-10 mb-3">
            <div
              className="w-16 h-16 rounded-lg border-4 border-background flex items-center justify-center"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            >
              {project.client?.logo ? (
                <img
                  src={project.client.logo}
                  alt=""
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {project.name.charAt(0)}
                </span>
              )}
            </div>
            <Badge className={status.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          {/* Content */}
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <p className="text-sm text-muted-foreground">{project.client?.name}</p>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progresso</span>
              <span className="font-medium">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-2" />
          </div>

          {/* Due Date */}
          {daysRemaining !== null && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span
                className={cn(
                  daysRemaining < 0
                    ? "text-red-600"
                    : daysRemaining < 7
                    ? "text-amber-600"
                    : "text-muted-foreground"
                )}
              >
                {daysRemaining < 0
                  ? `${Math.abs(daysRemaining)} dias de atraso`
                  : daysRemaining === 0
                  ? "Entrega hoje"
                  : `${daysRemaining} dias restantes`}
              </span>
            </div>
          )}

          {/* Action */}
          <div className="mt-4 pt-4 border-t">
            <Link href={`/projects/${project.id}`}>
              <Button variant="ghost" className="w-full justify-between">
                Acompanhar projeto
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
