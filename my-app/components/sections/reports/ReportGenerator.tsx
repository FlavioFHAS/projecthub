"use client";

import React, { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportTemplate } from "@/lib/sections/section-config";
import { toast } from "sonner";

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (report: { title: string; period: { from: string; to: string }; content: object }) => void;
  template: ReportTemplate | null;
  projectId: string;
}

export function ReportGenerator({ isOpen, onClose, onGenerate, template, projectId }: ReportGeneratorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sections, setSections] = useState({
    summary: true,
    tasks: true,
    meetings: false,
    risks: false,
    costs: false,
    gantt: false,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    onGenerate({
      title: title || getDefaultTitle(),
      period: { from: dateFrom, to: dateTo },
      content: {
        sections,
        generatedAt: new Date().toISOString(),
      },
    });
    
    setIsGenerating(false);
    setStep(1);
    resetForm();
  };

  const getDefaultTitle = () => {
    const date = new Date().toLocaleDateString("pt-BR");
    switch (template) {
      case "WEEKLY":
        return `Relatório Semanal — ${date}`;
      case "MONTHLY":
        return `Relatório Mensal — ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
      default:
        return `Relatório — ${date}`;
    }
  };

  const resetForm = () => {
    setTitle("");
    setDateFrom("");
    setDateTo("");
    setSections({
      summary: true,
      tasks: true,
      meetings: false,
      risks: false,
      costs: false,
      gantt: false,
    });
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {template === "WEEKLY" && "Gerar Relatório Semanal"}
            {template === "MONTHLY" && "Gerar Relatório Mensal"}
            {template === "CUSTOM" && "Criar Relatório Customizado"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Título do relatório</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={getDefaultTitle()}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data início</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label>Data fim</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={() => setStep(2)} disabled={!dateFrom || !dateTo}>Próximo</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Selecione as seções a incluir</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={sections.summary} onCheckedChange={(v) => setSections((s) => ({ ...s, summary: !!v }))} />
                <Label className="font-normal">Resumo Executivo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={sections.tasks} onCheckedChange={(v) => setSections((s) => ({ ...s, tasks: !!v }))} />
                <Label className="font-normal">Tarefas (concluídas e pendentes)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={sections.meetings} onCheckedChange={(v) => setSections((s) => ({ ...s, meetings: !!v }))} />
                <Label className="font-normal">Reuniões do período</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={sections.risks} onCheckedChange={(v) => setSections((s) => ({ ...s, risks: !!v }))} />
                <Label className="font-normal">Riscos ativos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={sections.costs} onCheckedChange={(v) => setSections((s) => ({ ...s, costs: !!v }))} />
                <Label className="font-normal">Detalhamento financeiro</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={sections.gantt} onCheckedChange={(v) => setSections((s) => ({ ...s, gantt: !!v }))} />
                <Label className="font-normal">Snapshot do cronograma</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={() => setStep(3)}>Próximo</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Gerando relatório...</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium">Resumo da geração</p>
                  <p className="text-sm text-muted-foreground">Título: {title || getDefaultTitle()}</p>
                  <p className="text-sm text-muted-foreground">
                    Período: {new Date(dateFrom).toLocaleDateString("pt-BR")} a{" "}
                    {new Date(dateTo).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seções: {Object.entries(sections).filter(([, v]) => v).map(([k]) => k).join(", ")}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                  <Button onClick={handleGenerate}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
