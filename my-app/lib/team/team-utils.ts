import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "COLLABORATOR" | "CLIENT";

export function getRoleConfig(role: UserRole) {
  const configs: Record<UserRole, { label: string; className: string; icon: string }> = {
    SUPER_ADMIN: {
      label: "Super Admin",
      className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      icon: "Shield",
    },
    ADMIN: {
      label: "Admin",
      className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      icon: "UserCog",
    },
    COLLABORATOR: {
      label: "Colaborador",
      className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
      icon: "User",
    },
    CLIENT: {
      label: "Cliente",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      icon: "Briefcase",
    },
  };
  return configs[role] || configs.COLLABORATOR;
}

export function formatJoinDate(date: Date | string): string {
  return format(new Date(date), "'Membro desde' MMM yyyy", { locale: ptBR });
}

export function summarizePermissions(
  permissions: Record<string, boolean> | null
): string {
  if (!permissions || Object.keys(permissions).length === 0) {
    return "Permissões padrão";
  }

  const enabledCount = Object.values(permissions).filter(Boolean).length;
  const totalCount = Object.keys(permissions).length;

  if (enabledCount === 0) {
    return "Permissões padrão";
  }

  if (enabledCount === totalCount) {
    return "Acesso completo";
  }

  return `${enabledCount} de ${totalCount} permissões extras habilitadas`;
}

export function isLastProjectAdmin(
  members: { userId: string; user: { role: string } }[],
  userId: string
): boolean {
  const admins = members.filter(
    (m) => m.user.role === "SUPER_ADMIN" || m.user.role === "ADMIN"
  );
  return admins.length === 1 && admins[0].userId === userId;
}

export function getProjectRoleSuggestions(userRole: UserRole): string[] {
  const suggestions: Record<UserRole, string[]> = {
    SUPER_ADMIN: ["Gerente de Projeto", "Consultor Sênior", "Diretor Técnico"],
    ADMIN: ["Gerente de Projeto", "Tech Lead", "Product Owner"],
    COLLABORATOR: [
      "Desenvolvedor",
      "Designer",
      "Analista",
      "QA",
      "DevOps",
      "Scrum Master",
    ],
    CLIENT: ["Patrocinador", "Usuário Chave", "Aprovador", "Stakeholder"],
  };
  return suggestions[userRole] || suggestions.COLLABORATOR;
}

export function getPermissionLabel(permissionKey: string): string {
  const labels: Record<string, string> = {
    canViewCosts: "Ver controle de custos",
    canViewProposals: "Ver propostas",
    canViewInternalNotes: "Ver notas internas",
    canCreateTasks: "Criar e editar tarefas",
    canCreateMeetings: "Criar e editar reuniões",
    canCommentOnTasks: "Comentar em tarefas",
    canApproveProposals: "Aprovar propostas",
    canManageMembers: "Gerenciar membros",
    canExportReports: "Exportar relatórios",
  };
  return labels[permissionKey] || permissionKey;
}
