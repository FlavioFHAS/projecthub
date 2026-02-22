import { UserRole } from "@prisma/client";
import { ComponentType } from "react";

export type SectionType =
  | "MEETINGS"
  | "PROPOSALS"
  | "GANTT"
  | "TASKS"
  | "TEAM"
  | "COSTS"
  | "NOTES"
  | "LINKS"
  | "DOCUMENTS"
  | "RISKS"
  | "FEEDBACK"
  | "REPORTS"
  | "CUSTOM";

export interface Section {
  id: string;
  type: SectionType;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  isVisible: boolean;
  visibleToRoles: UserRole[];
  config: Record<string, unknown>;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionPageProps {
  projectId: string;
  section: Section;
  userRole: UserRole;
  canEdit: boolean;
}

export interface SectionDefinition {
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultConfig: Record<string, unknown>;
  defaultVisibleToRoles: UserRole[];
  allowMultiple: boolean;
  isDefault: boolean;
}

export const SECTION_REGISTRY: Record<SectionType, SectionDefinition> = {
  MEETINGS: {
    type: "MEETINGS",
    name: "Reuniões",
    description: "Registro de reuniões com pauta, ata e próximos passos",
    icon: "Video",
    color: "#3b82f6",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR", "CLIENT"],
    allowMultiple: false,
    isDefault: true,
  },
  PROPOSALS: {
    type: "PROPOSALS",
    name: "Propostas",
    description: "Propostas comerciais e contratos do projeto",
    icon: "FileText",
    color: "#10b981",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR", "CLIENT"],
    allowMultiple: false,
    isDefault: true,
  },
  GANTT: {
    type: "GANTT",
    name: "Cronograma",
    description: "Diagrama de Gantt interativo do projeto",
    icon: "GanttChart",
    color: "#f59e0b",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR", "CLIENT"],
    allowMultiple: false,
    isDefault: true,
  },
  TASKS: {
    type: "TASKS",
    name: "Tarefas",
    description: "Kanban e lista de tarefas do projeto",
    icon: "CheckSquare",
    color: "#8b5cf6",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR", "CLIENT"],
    allowMultiple: false,
    isDefault: true,
  },
  TEAM: {
    type: "TEAM",
    name: "Equipe",
    description: "Membros e permissões da equipe",
    icon: "Users",
    color: "#ec4899",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR"],
    allowMultiple: false,
    isDefault: true,
  },
  COSTS: {
    type: "COSTS",
    name: "Custos",
    description: "Controle financeiro e orçamento do projeto",
    icon: "DollarSign",
    color: "#ef4444",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN"],
    allowMultiple: false,
    isDefault: true,
  },
  NOTES: {
    type: "NOTES",
    name: "Notas",
    description: "Notas e documentação do projeto",
    icon: "StickyNote",
    color: "#14b8a6",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR"],
    allowMultiple: false,
    isDefault: true,
  },
  LINKS: {
    type: "LINKS",
    name: "Links & Recursos",
    description: "Repositório centralizado de links, credenciais e acessos",
    icon: "Link",
    color: "#8b5cf6",
    defaultConfig: { allowCategories: true, allowPasswords: false },
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR"],
    allowMultiple: false,
    isDefault: false,
  },
  DOCUMENTS: {
    type: "DOCUMENTS",
    name: "Documentos",
    description: "Biblioteca de documentos organizada em pastas",
    icon: "FolderOpen",
    color: "#f97316",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR", "CLIENT"],
    allowMultiple: false,
    isDefault: false,
  },
  RISKS: {
    type: "RISKS",
    name: "Riscos",
    description: "Matriz de riscos e planos de mitigação",
    icon: "ShieldAlert",
    color: "#dc2626",
    defaultConfig: { customCategories: ["Técnico", "Financeiro", "Prazo", "Qualidade", "Fornecedor"] },
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR"],
    allowMultiple: false,
    isDefault: false,
  },
  FEEDBACK: {
    type: "FEEDBACK",
    name: "Feedback",
    description: "Portal de feedback e sugestões do cliente",
    icon: "MessageSquare",
    color: "#06b6d4",
    defaultConfig: { allowAnonymous: false },
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR", "CLIENT"],
    allowMultiple: false,
    isDefault: false,
  },
  REPORTS: {
    type: "REPORTS",
    name: "Relatórios",
    description: "Templates de relatórios periódicos",
    icon: "BarChart2",
    color: "#6366f1",
    defaultConfig: {},
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR"],
    allowMultiple: false,
    isDefault: false,
  },
  CUSTOM: {
    type: "CUSTOM",
    name: "Página Customizada",
    description: "Seção em branco com editor de conteúdo livre",
    icon: "Layers",
    color: "#64748b",
    defaultConfig: { title: "Nova Seção", content: null },
    defaultVisibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR"],
    allowMultiple: true,
    isDefault: false,
  },
};

export const URL_TO_SECTION_TYPE: Record<string, SectionType> = {
  meetings: "MEETINGS",
  proposals: "PROPOSALS",
  gantt: "GANTT",
  tasks: "TASKS",
  team: "TEAM",
  costs: "COSTS",
  notes: "NOTES",
  links: "LINKS",
  documents: "DOCUMENTS",
  risks: "RISKS",
  feedback: "FEEDBACK",
  reports: "REPORTS",
  custom: "CUSTOM",
};

export function getSectionDefinition(type: SectionType): SectionDefinition {
  return SECTION_REGISTRY[type];
}

export function getAvailableSectionTypes(existingSections: Section[]): SectionDefinition[] {
  return Object.values(SECTION_REGISTRY).filter((def) => {
    if (def.isDefault) return false;
    if (!def.allowMultiple && existingSections.some((s) => s.type === def.type)) {
      return false;
    }
    return true;
  });
}

export function getSectionTypeFromUrl(url: string): SectionType | null {
  return URL_TO_SECTION_TYPE[url] || null;
}

export function getSectionUrlFromType(type: SectionType): string {
  const entry = Object.entries(URL_TO_SECTION_TYPE).find(([, t]) => t === type);
  return entry ? entry[0] : "custom";
}
