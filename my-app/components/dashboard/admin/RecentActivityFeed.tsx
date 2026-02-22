"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckSquare,
  FileText,
  Video,
  UserPlus,
  DollarSign,
  MessageSquare,
  Edit,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RecentActivityFeedProps {
  activities: any[];
}

const ACTION_ICONS: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Edit,
  TASK_ASSIGNED: CheckSquare,
  TASK_COMPLETED: CheckSquare,
  MEETING_SCHEDULED: Video,
  PROPOSAL_CREATED: FileText,
  PROPOSAL_APPROVED: FileText,
  MEMBER_ADDED: UserPlus,
  COST_ADDED: DollarSign,
  COMMENT_ADDED: MessageSquare,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-500",
  UPDATE: "bg-blue-500",
  DELETE: "bg-red-500",
  TASK_ASSIGNED: "bg-purple-500",
  TASK_COMPLETED: "bg-green-500",
  MEETING_SCHEDULED: "bg-indigo-500",
  PROPOSAL_CREATED: "bg-amber-500",
  PROPOSAL_APPROVED: "bg-green-500",
  MEMBER_ADDED: "bg-cyan-500",
  COST_ADDED: "bg-orange-500",
  COMMENT_ADDED: "bg-pink-500",
};

function getActionDescription(action: string, entity: string): string {
  const descriptions: Record<string, string> = {
    CREATE: `criou ${entity.toLowerCase()}`,
    UPDATE: `atualizou ${entity.toLowerCase()}`,
    DELETE: `excluiu ${entity.toLowerCase()}`,
    TASK_ASSIGNED: `atribuiu tarefa`,
    TASK_COMPLETED: `concluiu tarefa`,
    MEETING_SCHEDULED: `agendou reunião`,
    PROPOSAL_CREATED: `criou proposta`,
    PROPOSAL_APPROVED: `aprovou proposta`,
    MEMBER_ADDED: `adicionou membro`,
    COST_ADDED: `registrou custo`,
    COMMENT_ADDED: `comentou`,
  };
  return descriptions[action] || `${action.toLowerCase()} ${entity.toLowerCase()}`;
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px]">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = ACTION_ICONS[activity.action] || Edit;
              const color = ACTION_COLORS[activity.action] || "bg-gray-500";

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user?.name || "Usuário"}</span>{" "}
                      {getActionDescription(activity.action, activity.entity)}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.project?.name} •{" "}
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
