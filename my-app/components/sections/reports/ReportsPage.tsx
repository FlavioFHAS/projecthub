"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Calendar,
  Download,
  Eye,
  CheckCircle,
  Clock,
  FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/sections/shared/SectionHeader";
import { SectionEmptyState } from "@/components/sections/shared/SectionEmptyState";
import { SectionSkeleton } from "@/components/sections/shared/SectionSkeleton";
import { useSectionConfig } from "@/hooks/sections/useSectionConfig";
import {
  ReportsConfig,
  ReportItem,
  ReportTemplate,
  ReportStatus,
  generateConfigItemId,
} from "@/lib/sections/section-config";
import { ReportGenerator } from "./ReportGenerator";
import { toast } from "sonner";

interface ReportsPageProps {
  projectId: string;
  section: {
    id: string;
    config: ReportsConfig;
  };
  userRole: string;
  canEdit: boolean;
}

const TEMPLATE_LABELS: Record<ReportTemplate, string> = {
  WEEKLY: "Relatório Semanal",
  MONTHLY: "Relatório Mensal",
  CUSTOM: "Relatório Customizado",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
};

export function ReportsPage({ projectId, section, userRole, canEdit }: ReportsPageProps) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  const { config, isLoading, addItem, updateItem } = useSectionConfig<ReportsConfig>({
    projectId,
    sectionId: section.id,
    initialConfig: section.config,
  });

  const reports = config?.reports || [];

  const handleGenerate = (report: Partial<ReportItem>) => {
    const newReport: ReportItem = {
      id: generateConfigItemId(),
      template: selectedTemplate || "CUSTOM",
      title: report.title || "Novo Relatório",
      period: report.period || { from: new Date().toISOString(), to: new Date().toISOString() },
      generatedBy: "current-user",
      generatedAt: new Date().toISOString(),
      content: report.content || {},
      status: "DRAFT",
    };

    addItem("reports", newReport);
    setIsGeneratorOpen(false);
    setSelectedTemplate(null);
    toast.success("Relatório gerado com sucesso!");
  };

  const handlePublish = (reportId: string) => {
    updateItem("reports", reportId, { status: "PUBLISHED" });
    toast.success("Relatório publicado!");
  };

  if (isLoading) {
    return <SectionSkeleton type="cards" count={4} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Relatórios"
        count={reports.length}
        description="Gere relatórios periódicos para acompanhar o progresso do projeto"
      />

      {/* Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedTemplate("WEEKLY"); setIsGeneratorOpen(true); }}>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
              <FileBarChart className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-base">Relatório Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Resumo de atividades, tarefas concluídas e próximos passos
            </p>
            <Button className="w-full mt-4" variant="outline">Gerar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedTemplate("MONTHLY"); setIsGeneratorOpen(true); }}>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
              <FileBarChart className="w-5 h-5 text-purple-600" />
            </div>
            <CardTitle className="text-base">Relatório Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visão geral do mês com KPIs, custos e progresso do cronograma
            </p>
            <Button className="w-full mt-4" variant="outline">Gerar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedTemplate("CUSTOM"); setIsGeneratorOpen(true); }}>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <CardTitle className="text-base">Relatório Customizado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Crie um relatório com conteúdo personalizado
            </p>
            <Button className="w-full mt-4" variant="outline">Criar</Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Reports */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Relatórios Gerados</h3>

        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            Nenhum relatório gerado ainda
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{report.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{TEMPLATE_LABELS[report.template]}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.period.from).toLocaleDateString("pt-BR")}
                      </span>
                      <Badge variant={report.status === "PUBLISHED" ? "default" : "secondary"}>
                        {STATUS_LABELS[report.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  {canEdit && report.status === "DRAFT" && (
                    <Button size="sm" onClick={() => handlePublish(report.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Publicar
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ReportGenerator
        isOpen={isGeneratorOpen}
        onClose={() => { setIsGeneratorOpen(false); setSelectedTemplate(null); }}
        onGenerate={handleGenerate}
        template={selectedTemplate}
        projectId={projectId}
      />
    </div>
  );
}
