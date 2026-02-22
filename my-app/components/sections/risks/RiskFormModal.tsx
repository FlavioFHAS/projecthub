"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  calculateRiskLevel,
  getRiskLevelColor,
  getRiskLevelLabel,
  RiskProbability,
  RiskImpact,
  RiskStatus,
} from "@/lib/sections/section-config";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  probability: z.enum(["LOW", "MEDIUM", "HIGH"]),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
  owner: z.string().optional(),
  reviewDate: z.string().optional(),
  mitigation: z.string().optional(),
  contingency: z.string().optional(),
  status: z.enum(["IDENTIFIED", "MITIGATED", "OCCURRED", "CLOSED"]),
});

type FormData = z.infer<typeof formSchema>;

interface RiskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: { id: string; title: string; description: string; category: string; probability: RiskProbability; impact: RiskImpact; owner?: string; reviewDate?: string; mitigation?: string; contingency?: string; status: RiskStatus } | null;
  categories: string[];
}

export function RiskFormModal({ isOpen, onClose, onSubmit, initialData, categories }: RiskFormModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      probability: "MEDIUM",
      impact: "MEDIUM",
      owner: "",
      reviewDate: "",
      mitigation: "",
      contingency: "",
      status: "IDENTIFIED",
    },
  });

  const probability = useWatch({ control: form.control, name: "probability" });
  const impact = useWatch({ control: form.control, name: "impact" });

  const calculatedLevel = calculateRiskLevel(probability, impact);

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description,
        category: initialData.category,
        probability: initialData.probability,
        impact: initialData.impact,
        owner: initialData.owner || "",
        reviewDate: initialData.reviewDate || "",
        mitigation: initialData.mitigation || "",
        contingency: initialData.contingency || "",
        status: initialData.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        category: "",
        probability: "MEDIUM",
        impact: "MEDIUM",
        owner: "",
        reviewDate: "",
        mitigation: "",
        contingency: "",
        status: "IDENTIFIED",
      });
    }
  }, [initialData, form, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Risco" : "Novo Risco"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição curta do risco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição detalhada</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o risco em detalhes..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probabilidade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Baixa (rara)</SelectItem>
                        <SelectItem value="MEDIUM">Média (possível)</SelectItem>
                        <SelectItem value="HIGH">Alta (provável)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impacto</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Baixo (menor)</SelectItem>
                        <SelectItem value="MEDIUM">Médio (moderado)</SelectItem>
                        <SelectItem value="HIGH">Alto (crítico)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-4 rounded-lg border-2" style={{ borderColor: getRiskLevelColor(calculatedLevel) }}>
              <p className="text-sm text-muted-foreground mb-1">Nível calculado</p>
              <Badge
                className="text-lg px-3 py-1"
                style={{ backgroundColor: getRiskLevelColor(calculatedLevel), color: "white" }}
              >
                {getRiskLevelLabel(calculatedLevel).toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de revisão</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mitigation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de mitigação</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Como prevenir ou reduzir este risco..." {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contingency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de contingência</FormLabel>
                  <FormControl>
                    <Textarea placeholder="O que fazer se o risco ocorrer..." {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {initialData && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IDENTIFIED">Identificado</SelectItem>
                        <SelectItem value="MITIGATED">Mitigado</SelectItem>
                        <SelectItem value="OCCURRED">Ocorrido</SelectItem>
                        <SelectItem value="CLOSED">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">{initialData ? "Salvar" : "Criar Risco"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
