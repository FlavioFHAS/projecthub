"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/sections/shared/SectionHeader";
import { SectionEmptyState } from "@/components/sections/shared/SectionEmptyState";
import { SectionSkeleton } from "@/components/sections/shared/SectionSkeleton";
import { useSectionConfig } from "@/hooks/sections/useSectionConfig";
import {
  RisksConfig,
  RiskItem,
  RiskLevel,
  RiskStatus,
  calculateRiskLevel,
  getRiskLevelColor,
  getRiskLevelLabel,
  generateRiskCode,
  generateConfigItemId,
} from "@/lib/sections/section-config";
import { RiskFormModal } from "./RiskFormModal";
import { cn } from "@/lib/utils";

interface RisksPageProps {
  projectId: string;
  section: {
    id: string;
    config: RisksConfig;
  };
  userRole: string;
  canEdit: boolean;
}

const STATUS_LABELS: Record<RiskStatus, string> = {
  IDENTIFIED: "Identificado",
  MITIGATED: "Mitigado",
  OCCURRED: "Ocorrido",
  CLOSED: "Fechado",
};

const STATUS_COLORS: Record<RiskStatus, string> = {
  IDENTIFIED: "bg-yellow-500",
  MITIGATED: "bg-blue-500",
  OCCURRED: "bg-red-500",
  CLOSED: "bg-green-500",
};

export function RisksPage({ projectId, section, userRole, canEdit }: RisksPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [filterLevel, setFilterLevel] = useState<RiskLevel | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<RiskStatus | "ALL">("ALL");
  const [matrixFilter, setMatrixFilter] = useState<{ prob: string; impact: string } | null>(null);

  const { config, isLoading, addItem, updateItem, removeItem } =
    useSectionConfig<RisksConfig>({
      projectId,
      sectionId: section.id,
      initialConfig: section.config,
    });

  const risks = config?.risks || [];
  const customCategories = config?.customCategories || ["Técnico", "Financeiro", "Prazo", "Qualidade", "Fornecedor"];

  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      const matchesLevel = filterLevel === "ALL" || risk.level === filterLevel;
      const matchesStatus = filterStatus === "ALL" || risk.status === filterStatus;
      const matchesMatrix =
        !matrixFilter ||
        (risk.probability === matrixFilter.prob && risk.impact === matrixFilter.impact);
      return matchesLevel && matchesStatus && matchesMatrix;
    });
  }, [risks, filterLevel, filterStatus, matrixFilter]);

  const risksByMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, RiskItem[]>> = {
      HIGH: { HIGH: [], MEDIUM: [], LOW: [] },
      MEDIUM: { HIGH: [], MEDIUM: [], LOW: [] },
      LOW: { HIGH: [], MEDIUM: [], LOW: [] },
    };
    risks.forEach((risk) => {
      if (risk.status !== "CLOSED") {
        matrix[risk.probability][risk.impact].push(risk);
      }
    });
    return matrix;
  }, [risks]);

  const stats = useMemo(() => {
    return {
      total: risks.length,
      critical: risks.filter((r) => r.level === "CRITICAL" && r.status !== "CLOSED").length,
      high: risks.filter((r) => r.level === "HIGH" && r.status !== "CLOSED").length,
      mitigated: risks.filter((r) => r.status === "MITIGATED").length,
    };
  }, [risks]);

  const handleMatrixCellClick = (prob: string, impact: string) => {
    if (matrixFilter?.prob === prob && matrixFilter?.impact === impact) {
      setMatrixFilter(null);
    } else {
      setMatrixFilter({ prob, impact });
    }
  };

  const getMatrixCellColor = (prob: string, impact: string, count: number) => {
    const level = calculateRiskLevel(prob as any, impact as any);
    const baseColor = getRiskLevelColor(level);
    const isSelected = matrixFilter?.prob === prob && matrixFilter?.impact === impact;
    return {
      backgroundColor: count > 0 ? `${baseColor}30` : "#f8fafc",
      borderColor: isSelected ? baseColor : count > 0 ? `${baseColor}50` : "#e2e8f0",
      color: baseColor,
    };
  };

  if (isLoading) {
    return <SectionSkeleton type="list" count={6} />;
  }

  if (risks.length === 0) {
    return (
      <SectionEmptyState
        sectionType="RISKS"
        canCreate={canEdit}
        onAction={() => setIsFormOpen(true)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestão de Riscos"
        count={risks.length}
        actions={
          canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Risco
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Críticos</p>
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Altos</p>
          <p className="text-2xl font-bold text-orange-500">{stats.high}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Mitigados</p>
          <p className="text-2xl font-bold text-blue-500">{stats.mitigated}</p>
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="border rounded-lg p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4">Matriz de Risco</h3>
        <div className="relative">
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground">
            IMPACTO
          </div>
          <div className="space-y-2">
            {["HIGH", "MEDIUM", "LOW"].map((impact) => (
              <div key={impact} className="flex items-center gap-2">
                <span className="w-12 text-xs text-muted-foreground text-right">
                  {impact === "HIGH" ? "Alto" : impact === "MEDIUM" ? "Médio" : "Baixo"}
                </span>
                <div className="flex gap-2">
                  {["LOW", "MEDIUM", "HIGH"].map((prob) => {
                    const cellRisks = risksByMatrix[prob][impact];
                    const count = cellRisks.length;
                    const style = getMatrixCellColor(prob, impact, count);
                    const isSelected = matrixFilter?.prob === prob && matrixFilter?.impact === impact;

                    return (
                      <button
                        key={`${prob}-${impact}`}
                        onClick={() => handleMatrixCellClick(prob, impact)}
                        className={cn(
                          "w-24 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all",
                          isSelected && "ring-2 ring-offset-2"
                        )}
                        style={{
                          backgroundColor: style.backgroundColor,
                          borderColor: style.borderColor,
                        }}
                      >
                        {count > 0 && (
                          <>
                            <span className="text-lg font-bold" style={{ color: style.color }}>
                              {count}
                            </span>
                            <div className="flex gap-0.5 mt-1">
                              {cellRisks.slice(0, 3).map((r) => (
                                <div
                                  key={r.id}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: style.color }}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 ml-14">
              <span className="w-24 text-xs text-muted-foreground text-center">Baixa</span>
              <span className="w-24 text-xs text-muted-foreground text-center">Média</span>
              <span className="w-24 text-xs text-muted-foreground text-center">Alta</span>
            </div>
            <div className="text-center text-sm font-medium text-muted-foreground mt-2">
              PROBABILIDADE
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterLevel} onValueChange={(v) => setFilterLevel(v as RiskLevel | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os níveis</SelectItem>
            <SelectItem value="CRITICAL">Crítico</SelectItem>
            <SelectItem value="HIGH">Alto</SelectItem>
            <SelectItem value="MEDIUM">Médio</SelectItem>
            <SelectItem value="LOW">Baixo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as RiskStatus | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="IDENTIFIED">Identificado</SelectItem>
            <SelectItem value="MITIGATED">Mitigado</SelectItem>
            <SelectItem value="OCCURRED">Ocorrido</SelectItem>
            <SelectItem value="CLOSED">Fechado</SelectItem>
          </SelectContent>
        </Select>
        {matrixFilter && (
          <Button variant="outline" onClick={() => setMatrixFilter(null)}>
            Limpar filtro da matriz
          </Button>
        )}
      </div>

      {/* Risk List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          Lista de Riscos ({filteredRisks.length})
        </h3>
        {filteredRisks.map((risk) => (
          <motion.div
            key={risk.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-muted-foreground">{risk.code}</span>
                  <Badge
                    style={{
                      backgroundColor: getRiskLevelColor(risk.level),
                      color: "white",
                    }}
                  >
                    {getRiskLevelLabel(risk.level).toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{STATUS_LABELS[risk.status]}</Badge>
                  <Badge variant="secondary">{risk.category}</Badge>
                </div>
                <h4 className="font-medium">{risk.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {risk.description}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {risk.ownerName || "Sem responsável"}
                  </div>
                  {risk.reviewDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Revisão: {new Date(risk.reviewDate).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingRisk(risk)}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <RiskFormModal
        isOpen={isFormOpen || !!editingRisk}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRisk(null);
        }}
        onSubmit={(risk) => {
          if (editingRisk) {
            updateItem("risks", editingRisk.id, { ...risk, level: calculateRiskLevel(risk.probability, risk.impact) });
          } else {
            const code = generateRiskCode(risks.map((r) => r.code));
            addItem("risks", {
              ...risk,
              id: generateConfigItemId(),
              code,
              level: calculateRiskLevel(risk.probability, risk.impact),
              identifiedAt: new Date().toISOString(),
            });
          }
          setIsFormOpen(false);
          setEditingRisk(null);
        }}
        initialData={editingRisk}
        categories={customCategories}
      />
    </div>
  );
}
