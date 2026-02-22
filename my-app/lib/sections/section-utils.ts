import { SectionType, SectionDefinition, SECTION_REGISTRY } from "./section-registry";
import { UserRole } from "@prisma/client";

export function canViewSection(
  sectionType: SectionType,
  userRole: UserRole,
  visibleToRoles?: UserRole[]
): boolean {
  if (visibleToRoles && visibleToRoles.length > 0) {
    return visibleToRoles.includes(userRole);
  }
  
  const definition = SECTION_REGISTRY[sectionType];
  return definition.defaultVisibleToRoles.includes(userRole);
}

export function canManageSection(userRole: UserRole): boolean {
  return userRole === "SUPER_ADMIN" || userRole === "ADMIN";
}

export function getSectionIconName(type: SectionType): string {
  return SECTION_REGISTRY[type]?.icon || "File";
}

export function getSectionColor(type: SectionType): string {
  return SECTION_REGISTRY[type]?.color || "#64748b";
}

export function getSectionDisplayName(type: SectionType, customName?: string): string {
  if (customName && type === "CUSTOM") {
    return customName;
  }
  return SECTION_REGISTRY[type]?.name || type;
}

export function getSectionDescription(type: SectionType): string {
  return SECTION_REGISTRY[type]?.description || "";
}

export function isSectionDefault(type: SectionType): boolean {
  return SECTION_REGISTRY[type]?.isDefault || false;
}

export function canHaveMultipleInstances(type: SectionType): boolean {
  return SECTION_REGISTRY[type]?.allowMultiple || false;
}

export function getDefaultSectionConfig(type: SectionType): Record<string, unknown> {
  return SECTION_REGISTRY[type]?.defaultConfig || {};
}

export function getDefaultVisibleRoles(type: SectionType): UserRole[] {
  return SECTION_REGISTRY[type]?.defaultVisibleToRoles || ["SUPER_ADMIN", "ADMIN"];
}

export function sortSectionsByOrder(sections: { order: number }[]): typeof sections {
  return [...sections].sort((a, b) => a.order - b.order);
}

export function generateSectionOrder(existingSections: { order: number }[]): number {
  const maxOrder = existingSections.reduce(
    (max, s) => Math.max(max, s.order),
    -1
  );
  return maxOrder + 1;
}

export function formatSectionSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getEmptyStateConfig(type: SectionType) {
  const configs: Record<
    SectionType,
    { icon: string; title: string; subtitle: string; actionLabel: string }
  > = {
    MEETINGS: {
      icon: "Video",
      title: "Nenhuma reunião agendada",
      subtitle: "Organize reuniões com pauta, ata e participantes",
      actionLabel: "Agendar primeira reunião",
    },
    PROPOSALS: {
      icon: "FileText",
      title: "Nenhuma proposta cadastrada",
      subtitle: "Crie e acompanhe propostas comerciais",
      actionLabel: "Criar primeira proposta",
    },
    GANTT: {
      icon: "GanttChart",
      title: "Cronograma vazio",
      subtitle: "Planeje as atividades do projeto visualmente",
      actionLabel: "Adicionar primeira atividade",
    },
    TASKS: {
      icon: "CheckSquare",
      title: "Nenhuma tarefa criada",
      subtitle: "Organize o trabalho em um quadro Kanban",
      actionLabel: "Criar primeira tarefa",
    },
    TEAM: {
      icon: "Users",
      title: "Equipe não configurada",
      subtitle: "Adicione membros e defina permissões",
      actionLabel: "Adicionar primeiro membro",
    },
    COSTS: {
      icon: "DollarSign",
      title: "Nenhum custo registrado",
      subtitle: "Acompanhe o orçamento e despesas do projeto",
      actionLabel: "Registrar primeiro custo",
    },
    NOTES: {
      icon: "StickyNote",
      title: "Nenhuma nota criada",
      subtitle: "Documente informações importantes do projeto",
      actionLabel: "Criar primeira nota",
    },
    LINKS: {
      icon: "Link",
      title: "Nenhum link cadastrado",
      subtitle: "Centralize links, credenciais e acessos do projeto",
      actionLabel: "Adicionar primeiro link",
    },
    DOCUMENTS: {
      icon: "FolderOpen",
      title: "Nenhum documento ainda",
      subtitle: "Organize os arquivos do projeto em pastas",
      actionLabel: "Adicionar documento",
    },
    RISKS: {
      icon: "ShieldAlert",
      title: "Nenhum risco identificado",
      subtitle: "Antecipe problemas registrando e monitorando riscos",
      actionLabel: "Registrar primeiro risco",
    },
    FEEDBACK: {
      icon: "MessageSquare",
      title: "Nenhum feedback ainda",
      subtitle: "Compartilhe sugestões e acompanhe o andamento",
      actionLabel: "Enviar primeiro feedback",
    },
    REPORTS: {
      icon: "BarChart2",
      title: "Nenhum relatório gerado",
      subtitle: "Gere relatórios periódicos para compartilhar o progresso",
      actionLabel: "Gerar primeiro relatório",
    },
    CUSTOM: {
      icon: "Layers",
      title: "Seção vazia",
      subtitle: "Esta é uma seção customizada. Adicione conteúdo livre.",
      actionLabel: "Adicionar conteúdo",
    },
  };

  return configs[type] || configs.CUSTOM;
}
