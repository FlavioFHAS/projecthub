import { UserRole } from "@prisma/client";
import { nanoid } from "nanoid";

// Links Section Config
export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  username?: string;
  password?: string;
  addedBy: string;
  addedByName?: string;
  addedAt: string;
}

export interface LinksConfig {
  links: LinkItem[];
  allowCategories?: boolean;
  allowPasswords?: boolean;
}

// Documents Section Config
export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  type: FileType;
  size?: string;
  folderId: string | null;
  addedBy: string;
  addedByName?: string;
  addedAt: string;
  description?: string;
  tags?: string[];
}

export type FileType = "PDF" | "DOCX" | "XLSX" | "PPTX" | "IMAGE" | "OTHER";

export interface DocumentsConfig {
  folders: FolderItem[];
  documents: DocumentItem[];
}

// Risks Section Config
export type RiskProbability = "LOW" | "MEDIUM" | "HIGH";
export type RiskImpact = "LOW" | "MEDIUM" | "HIGH";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskStatus = "IDENTIFIED" | "MITIGATED" | "OCCURRED" | "CLOSED";

export interface RiskItem {
  id: string;
  code: string;
  title: string;
  description: string;
  probability: RiskProbability;
  impact: RiskImpact;
  level: RiskLevel;
  category: string;
  owner: string;
  ownerName?: string;
  ownerAvatar?: string;
  mitigation: string;
  contingency: string;
  status: RiskStatus;
  identifiedAt: string;
  reviewDate?: string;
}

export interface RisksConfig {
  risks: RiskItem[];
  customCategories?: string[];
}

// Feedback Section Config
export type FeedbackType = "SUGGESTION" | "BUG" | "PRAISE" | "OTHER";
export type FeedbackPriority = "LOW" | "NORMAL" | "HIGH";
export type FeedbackStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  priority: FeedbackPriority;
  subject: string;
  description: string;
  status: FeedbackStatus;
  submittedBy: string;
  submittedByName?: string;
  submittedByAvatar?: string;
  submittedAt: string;
  response?: string;
  respondedBy?: string;
  respondedByName?: string;
  respondedAt?: string;
}

export interface FeedbackConfig {
  feedbacks: FeedbackItem[];
  allowAnonymous?: boolean;
}

// Reports Section Config
export type ReportTemplate = "WEEKLY" | "MONTHLY" | "CUSTOM";
export type ReportStatus = "DRAFT" | "PUBLISHED";

export interface ReportItem {
  id: string;
  template: ReportTemplate;
  title: string;
  period: { from: string; to: string };
  generatedBy: string;
  generatedByName?: string;
  generatedAt: string;
  content: object;
  status: ReportStatus;
}

export interface ReportsConfig {
  reports: ReportItem[];
}

// Custom Section Config
export interface CustomConfig {
  content: object | null;
  lastEditedBy?: string;
  lastEditedByName?: string;
  lastEditedAt?: string;
}

// Type guards
export function isLinksConfig(config: unknown): config is LinksConfig {
  return typeof config === "object" && config !== null && "links" in config;
}

export function isDocumentsConfig(config: unknown): config is DocumentsConfig {
  return (
    typeof config === "object" &&
    config !== null &&
    "folders" in config &&
    "documents" in config
  );
}

export function isRisksConfig(config: unknown): config is RisksConfig {
  return typeof config === "object" && config !== null && "risks" in config;
}

export function isFeedbackConfig(config: unknown): config is FeedbackConfig {
  return (
    typeof config === "object" && config !== null && "feedbacks" in config
  );
}

export function isReportsConfig(config: unknown): config is ReportsConfig {
  return typeof config === "object" && config !== null && "reports" in config;
}

export function isCustomConfig(config: unknown): config is CustomConfig {
  return typeof config === "object" && config !== null && "content" in config;
}

// Helper functions
export function generateConfigItemId(): string {
  return nanoid(8);
}

export function generateRiskCode(existingCodes: string[]): string {
  const numbers = existingCodes
    .map((code) => parseInt(code.replace("RK-", ""), 10))
    .filter((n) => !isNaN(n));
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `RK-${String(max + 1).padStart(3, "0")}`;
}

export function calculateRiskLevel(
  probability: RiskProbability,
  impact: RiskImpact
): RiskLevel {
  const matrix: Record<RiskProbability, Record<RiskImpact, RiskLevel>> = {
    LOW: { LOW: "LOW", MEDIUM: "LOW", HIGH: "MEDIUM" },
    MEDIUM: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH" },
    HIGH: { LOW: "MEDIUM", MEDIUM: "HIGH", HIGH: "CRITICAL" },
  };
  return matrix[probability][impact];
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function getFaviconUrl(url: string, size = 32): string {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

export function detectFileType(url: string): FileType {
  const extension = url.split(".").pop()?.toLowerCase() || "";
  const typeMap: Record<string, FileType> = {
    pdf: "PDF",
    doc: "DOCX",
    docx: "DOCX",
    xls: "XLSX",
    xlsx: "XLSX",
    ppt: "PPTX",
    pptx: "PPTX",
    png: "IMAGE",
    jpg: "IMAGE",
    jpeg: "IMAGE",
    gif: "IMAGE",
    svg: "IMAGE",
    webp: "IMAGE",
  };
  return typeMap[extension] || "OTHER";
}

export function getFileTypeConfig(type: FileType) {
  const configs: Record<
    FileType,
    { icon: string; color: string; label: string }
  > = {
    PDF: { icon: "FileText", color: "#ef4444", label: "PDF" },
    DOCX: { icon: "FileText", color: "#3b82f6", label: "Documento" },
    XLSX: { icon: "FileSpreadsheet", color: "#22c55e", label: "Planilha" },
    PPTX: { icon: "Presentation", color: "#f97316", label: "Apresentação" },
    IMAGE: { icon: "Image", color: "#a855f7", label: "Imagem" },
    OTHER: { icon: "File", color: "#6b7280", label: "Arquivo" },
  };
  return configs[type];
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    LOW: "#22c55e",
    MEDIUM: "#eab308",
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
  };
  return colors[level];
}

export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    LOW: "Baixo",
    MEDIUM: "Médio",
    HIGH: "Alto",
    CRITICAL: "Crítico",
  };
  return labels[level];
}

export function getFeedbackTypeLabel(type: FeedbackType): string {
  const labels: Record<FeedbackType, string> = {
    SUGGESTION: "Sugestão",
    BUG: "Bug",
    PRAISE: "Elogio",
    OTHER: "Outro",
  };
  return labels[type];
}

export function getFeedbackTypeColor(type: FeedbackType): string {
  const colors: Record<FeedbackType, string> = {
    SUGGESTION: "#3b82f6",
    BUG: "#ef4444",
    PRAISE: "#22c55e",
    OTHER: "#6b7280",
  };
  return colors[type];
}

export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  const labels: Record<FeedbackStatus, string> = {
    OPEN: "Aberto",
    IN_REVIEW: "Em Análise",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado",
  };
  return labels[status];
}
