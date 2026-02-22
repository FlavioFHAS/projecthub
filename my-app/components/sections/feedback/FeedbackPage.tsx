"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Send,
  CheckCircle,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FeedbackConfig,
  FeedbackItem,
  FeedbackType,
  FeedbackPriority,
  FeedbackStatus,
  getFeedbackTypeLabel,
  getFeedbackTypeColor,
  getFeedbackStatusLabel,
  generateConfigItemId,
} from "@/lib/sections/section-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackPageProps {
  projectId: string;
  section: {
    id: string;
    config: FeedbackConfig;
  };
  userRole: string;
  canEdit: boolean;
}

const TYPE_LABELS: Record<FeedbackType, string> = {
  SUGGESTION: "Sugestão",
  BUG: "Bug",
  PRAISE: "Elogio",
  OTHER: "Outro",
};

const PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  OPEN: "Aberto",
  IN_REVIEW: "Em Análise",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

export function FeedbackPage({ projectId, section, userRole, canEdit }: FeedbackPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const isClient = userRole === "CLIENT";
  const currentUserId = "current-user"; // Would come from auth context

  const { config, isLoading, addItem, updateItem } = useSectionConfig<FeedbackConfig>({
    projectId,
    sectionId: section.id,
    initialConfig: section.config,
  });

  const feedbacks = config?.feedbacks || [];

  const visibleFeedbacks = isClient
    ? feedbacks.filter((f) => f.submittedBy === currentUserId)
    : feedbacks;

  const handleSubmitFeedback = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newFeedback: FeedbackItem = {
      id: generateConfigItemId(),
      type: formData.get("type") as FeedbackType,
      priority: formData.get("priority") as FeedbackPriority,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      status: "OPEN",
      submittedBy: currentUserId,
      submittedAt: new Date().toISOString(),
    };

    addItem("feedbacks", newFeedback);
    setShowForm(false);
    toast.success("Feedback enviado com sucesso!");
  };

  const handleRespond = (feedbackId: string) => {
    if (!responseText.trim()) return;

    updateItem("feedbacks", feedbackId, {
      response: responseText,
      respondedBy: currentUserId,
      respondedAt: new Date().toISOString(),
      status: "RESOLVED",
    });

    setRespondingTo(null);
    setResponseText("");
    toast.success("Resposta enviada!");
  };

  const handleStatusChange = (feedbackId: string, status: FeedbackStatus) => {
    updateItem("feedbacks", feedbackId, { status });
  };

  if (isLoading) {
    return <SectionSkeleton type="list" count={4} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Feedback"
        count={visibleFeedbacks.length}
        description={isClient ? "Compartilhe suas sugestões e acompanhe o andamento" : "Gerencie feedbacks dos clientes"}
      />

      {/* Submission Form - Visible to all, but clients see it prominently */}
      {(isClient || showForm) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-6 bg-card"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {isClient ? "Compartilhe seu feedback" : "Novo Feedback"}
          </h3>
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo</label>
                <Select name="type" defaultValue="SUGGESTION">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUGGESTION">Sugestão</SelectItem>
                    <SelectItem value="BUG">Bug</SelectItem>
                    <SelectItem value="PRAISE">Elogio</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Prioridade</label>
                <Select name="priority" defaultValue="NORMAL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Assunto</label>
              <Input name="subject" placeholder="Resumo do feedback" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea
                name="description"
                placeholder="Descreva em detalhes..."
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              {!isClient && (
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              )}
              <Button type="submit">
                <Send className="w-4 h-4 mr-2" />
                Enviar Feedback
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {!isClient && !showForm && (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Feedback
        </Button>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {isClient ? "Seus Feedbacks" : "Todos os Feedbacks"} ({visibleFeedbacks.length})
        </h3>

        {visibleFeedbacks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum feedback ainda. {isClient && "Seja o primeiro a enviar!"}
          </div>
        ) : (
          visibleFeedbacks.map((feedback) => (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4 bg-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge style={{ backgroundColor: getFeedbackTypeColor(feedback.type), color: "white" }}>
                      {TYPE_LABELS[feedback.type]}
                    </Badge>
                    <Badge variant={feedback.status === "OPEN" ? "default" : "secondary"}>
                      {STATUS_LABELS[feedback.status]}
                    </Badge>
                    <Badge variant="outline">{PRIORITY_LABELS[feedback.priority]}</Badge>
                  </div>
                  <h4 className="font-medium">{feedback.subject}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{feedback.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {feedback.submittedByName || "Anônimo"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(feedback.submittedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {/* Response Section */}
                  {feedback.response && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Resposta de {feedback.respondedByName || "Admin"}:
                      </p>
                      <p className="text-sm">{feedback.response}</p>
                    </div>
                  )}

                  {/* Admin Response Form */}
                  {!isClient && feedback.status !== "CLOSED" && respondingTo !== feedback.id && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRespondingTo(feedback.id)}
                      >
                        Responder
                      </Button>
                    </div>
                  )}

                  {respondingTo === feedback.id && (
                    <div className="mt-4 space-y-2">
                      <Textarea
                        placeholder="Digite sua resposta..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRespond(feedback.id)}>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Resposta
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Actions */}
                {!isClient && (
                  <Select
                    value={feedback.status}
                    onValueChange={(v) => handleStatusChange(feedback.id, v as FeedbackStatus)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Aberto</SelectItem>
                      <SelectItem value="IN_REVIEW">Em Análise</SelectItem>
                      <SelectItem value="RESOLVED">Resolvido</SelectItem>
                      <SelectItem value="CLOSED">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
