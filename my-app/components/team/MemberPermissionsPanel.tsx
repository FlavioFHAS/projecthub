"use client";

import { useState } from "react";
import {
  Eye,
  Edit,
  MessageSquare,
  DollarSign,
  FileText,
  Lock,
  CheckSquare,
  Video,
  BarChart3,
  Users,
  Shield,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getPermissionLabel } from "@/lib/team/team-utils";

interface PermissionGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: { key: string; description: string }[];
}

const permissionGroups: PermissionGroup[] = [
  {
    title: "Visualização",
    icon: Eye,
    permissions: [
      { key: "canViewCosts", description: "Pode ver lançamentos e relatórios de custos" },
      { key: "canViewProposals", description: "Pode ver propostas do projeto" },
      { key: "canViewInternalNotes", description: "Pode ver notas marcadas como internas" },
    ],
  },
  {
    title: "Edição",
    icon: Edit,
    permissions: [
      { key: "canCreateTasks", description: "Pode criar, editar e atribuir tarefas" },
      { key: "canCreateMeetings", description: "Pode criar e editar atas e reuniões" },
      { key: "canCreateNotes", description: "Pode criar e editar notas" },
    ],
  },
  {
    title: "Interação",
    icon: MessageSquare,
    permissions: [
      { key: "canCommentOnTasks", description: "Pode comentar em tarefas" },
      { key: "canCommentOnMeetings", description: "Pode comentar em reuniões" },
    ],
  },
  {
    title: "Aprovação",
    icon: Shield,
    permissions: [
      { key: "canApproveProposals", description: "Pode aprovar propostas" },
      { key: "canApproveCosts", description: "Pode aprovar lançamentos de custo" },
    ],
  },
];

interface MemberPermissionsPanelProps {
  userRole: string;
  permissions: Record<string, boolean>;
  onChange: (permissions: Record<string, boolean>) => void;
  readOnly?: boolean;
}

export function MemberPermissionsPanel({
  userRole,
  permissions,
  onChange,
  readOnly = false,
}: MemberPermissionsPanelProps) {
  const [localPermissions, setLocalPermissions] = useState(permissions);

  // Admins have all permissions by default
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const handleToggle = (key: string) => {
    if (readOnly || isAdmin) return;

    const newPermissions = {
      ...localPermissions,
      [key]: !localPermissions[key],
    };
    setLocalPermissions(newPermissions);
    onChange(newPermissions);
  };

  if (isAdmin) {
    return (
      <div className="p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-5 w-5" />
          <p className="text-sm">
            Administradores têm acesso completo por padrão
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {permissionGroups.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.title} className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
              <Icon className="h-4 w-4" />
              {group.title}
            </h4>
            <div className="space-y-3">
              {group.permissions.map((permission) => (
                <div
                  key={permission.key}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    localPermissions[permission.key]
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card border-border"
                  )}
                >
                  <div className="flex-1">
                    <Label
                      htmlFor={permission.key}
                      className="font-medium cursor-pointer"
                    >
                      {getPermissionLabel(permission.key)}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                  <Switch
                    id={permission.key}
                    checked={localPermissions[permission.key] || false}
                    onCheckedChange={() => handleToggle(permission.key)}
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
