"use client";

import { motion } from "framer-motion";
import { Mail, Calendar, CheckSquare, MoreVertical, Shield, User, Briefcase } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectMember } from "@/hooks/team/useTeamMembers";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MemberCardProps {
  member: ProjectMember;
  canManage: boolean;
  isCurrentUser: boolean;
}

const roleConfigs: Record<string, { label: string; className: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  COLLABORATOR: {
    label: "Colaborador",
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
  CLIENT: {
    label: "Cliente",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
};

export function MemberCard({ member, canManage, isCurrentUser }: MemberCardProps) {
  const roleConfig = roleConfigs[member.user.role] || roleConfigs.COLLABORATOR;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded-lg border bg-card p-5",
        !member.isActive && "opacity-75"
      )}
    >
      {/* You Badge */}
      {isCurrentUser && (
        <Badge variant="secondary" className="absolute top-3 right-3">
          Você
        </Badge>
      )}

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center mb-4">
        <Avatar className="h-16 w-16 mb-3">
          <AvatarImage src={member.user.image || undefined} />
          <AvatarFallback className="text-lg bg-primary/10">
            {member.user.name?.charAt(0).toUpperCase() ||
              member.user.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg">{member.user.name || "Usuário"}</h3>
        <p className="text-sm text-muted-foreground">{member.role}</p>
      </div>

      {/* Role Badge */}
      <div className="flex justify-center mb-4">
        <Badge variant="outline" className={roleConfig.className}>
          {roleConfig.label}
        </Badge>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span className="truncate">{member.user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            Desde{" "}
            {format(new Date(member.joinedAt), "MMM yyyy", { locale: ptBR })}
          </span>
        </div>
        {member.user.company && (
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>{member.user.company}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {canManage && !isCurrentUser && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Editar papel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Permissões
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <CheckSquare className="mr-2 h-4 w-4" />
                Ver tarefas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Remover do projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </motion.div>
  );
}
