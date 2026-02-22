"use client";

import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Shield,
  LogIn,
  FileDown,
  CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/projects/board-utils";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: any;
  newData: any;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
}

const actionIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  CREATE: { icon: Plus, color: "text-emerald-500 bg-emerald-500/10", label: "criou" },
  UPDATE: { icon: Pencil, color: "text-blue-500 bg-blue-500/10", label: "atualizou" },
  DELETE: { icon: Trash2, color: "text-red-500 bg-red-500/10", label: "excluiu" },
  STATUS_CHANGE: { icon: RefreshCw, color: "text-amber-500 bg-amber-500/10", label: "mudou o status de" },
  PERMISSION_CHANGE: { icon: Shield, color: "text-purple-500 bg-purple-500/10", label: "alterou permissões de" },
  LOGIN: { icon: LogIn, color: "text-slate-500 bg-slate-500/10", label: "entrou em" },
  EXPORT: { icon: FileDown, color: "text-cyan-500 bg-cyan-500/10", label: "exportou" },
  COMPLETE: { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10", label: "concluiu" },
};

const entityLabels: Record<string, string> = {
  Project: "o projeto",
  Task: "a tarefa",
  Meeting: "a reunião",
  Proposal: "a proposta",
  Cost: "o custo",
  Note: "a nota",
  Member: "o membro",
  Section: "a seção",
};

function getActivityDescription(activity: Activity): string {
  const action = actionIcons[activity.action] || actionIcons.UPDATE;
  const entityLabel = entityLabels[activity.entity] || activity.entity.toLowerCase();
  
  let itemName = "";
  if (activity.newData?.title) {
    itemName = `"${activity.newData.title}"`;
  } else if (activity.newData?.name) {
    itemName = `"${activity.newData.name}"`;
  } else if (activity.oldData?.title) {
    itemName = `"${activity.oldData.title}"`;
  }

  return `${action.label} ${entityLabel} ${itemName}`.trim();
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma atividade registrada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const action = actionIcons[activity.action] || actionIcons.UPDATE;
        const Icon = action.icon;

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user?.image || undefined} />
              <AvatarFallback className="text-xs bg-primary/10">
                {activity.user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">
                  {activity.user?.name || "Usuário"}
                </span>{" "}
                <span className="text-muted-foreground">
                  {getActivityDescription(activity)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(activity.createdAt)}
              </p>
            </div>

            {/* Action Icon */}
            <div
              className={cn(
                "p-1.5 rounded-full flex-shrink-0",
                action.color
              )}
            >
              <Icon className="h-3 w-3" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
