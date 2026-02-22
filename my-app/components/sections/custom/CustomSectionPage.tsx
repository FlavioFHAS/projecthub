"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MoreVertical,
  FileDown,
  Copy,
  Archive,
  Trash2,
  Save,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { useSectionConfig } from "@/hooks/sections/useSectionConfig";
import {
  CustomConfig,
  generateConfigItemId,
} from "@/lib/sections/section-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CustomSectionPageProps {
  projectId: string;
  section: {
    id: string;
    name: string;
    config: CustomConfig;
  };
  userRole: string;
  canEdit: boolean;
}

export function CustomSectionPage({ projectId, section, userRole, canEdit }: CustomSectionPageProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { config, isLoading, updateConfig } = useSectionConfig<CustomConfig>({
    projectId,
    sectionId: section.id,
    initialConfig: section.config,
  });

  const content = config?.content || null;
  const lastEditedBy = config?.lastEditedByName;
  const lastEditedAt = config?.lastEditedAt;

  const handleContentChange = useCallback(
    (newContent: object) => {
      setIsSaving(true);
      updateConfig((prev) => ({
        ...prev,
        content: newContent,
        lastEditedBy: "current-user",
        lastEditedAt: new Date().toISOString(),
      }));
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 500);
    },
    [updateConfig]
  );

  const handleTitleChange = async (newTitle: string) => {
    // Would need API to update section name
    toast.success("Título atualizado");
  };

  const handleExportPDF = () => {
    toast.info("Exportação para PDF em desenvolvimento");
  };

  const handleDuplicate = () => {
    toast.info("Duplicação em desenvolvimento");
  };

  const handleArchive = () => {
    toast.info("Arquivamento em desenvolvimento");
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir esta seção?")) {
      toast.info("Exclusão em desenvolvimento");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {canEdit ? (
            <InlineEdit
              value={section.name}
              onSave={handleTitleChange}
              as="h2"
              className="text-2xl font-bold"
            />
          ) : (
            <h2 className="text-2xl font-bold">{section.name}</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Save className="w-4 h-4 animate-pulse" />
              Salvando...
            </span>
          ) : lastSaved ? (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              Salvo
            </span>
          ) : null}

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar seção
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar seção
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir seção
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="border rounded-lg overflow-hidden">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          editable={canEdit}
          toolbarSize="full"
          placeholder="Comece a escrever..."
        />
      </div>

      {/* Footer */}
      {lastEditedAt && (
        <div className="text-xs text-muted-foreground text-right">
          Última edição: {new Date(lastEditedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {lastEditedBy && ` por ${lastEditedBy}`}
        </div>
      )}
    </motion.div>
  );
}
