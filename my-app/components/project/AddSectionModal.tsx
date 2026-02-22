"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  FileText,
  BarChart3,
  CheckSquare,
  Users,
  DollarSign,
  StickyNote,
  Link2,
  FolderOpen,
  AlertTriangle,
  MessageSquare,
  BarChart2,
  Layers,
  LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/contexts/ProjectContext";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AddSectionModalProps {
  projectId: string;
  existingSections: Section[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (section: Section) => void;
}

interface SectionTypeOption {
  type: string;
  icon: LucideIcon;
  name: string;
  description: string;
}

const SECTION_TYPES: SectionTypeOption[] = [
  {
    type: "LINKS",
    icon: Link2,
    name: "Links & Recursos",
    description: "Repositório de links, credenciais e acessos",
  },
  {
    type: "DOCUMENTS",
    icon: FolderOpen,
    name: "Documentos",
    description: "Biblioteca de arquivos por pasta",
  },
  {
    type: "RISKS",
    icon: AlertTriangle,
    name: "Riscos",
    description: "Matriz de riscos com plano de mitigação",
  },
  {
    type: "FEEDBACK",
    icon: MessageSquare,
    name: "Feedback Cliente",
    description: "Formulário e histórico de feedbacks",
  },
  {
    type: "REPORTS",
    icon: BarChart2,
    name: "Relatórios",
    description: "Templates de relatórios periódicos",
  },
  {
    type: "CUSTOM",
    icon: Layers,
    name: "Personalizada",
    description: "Seção em branco com editor livre",
  },
];

export function AddSectionModal({
  projectId,
  existingSections,
  isOpen,
  onClose,
  onAdd,
}: AddSectionModalProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter out already existing section types (except CUSTOM)
  const availableTypes = SECTION_TYPES.filter((type) => {
    if (type.type === "CUSTOM") return true;
    return !existingSections.some((s) => s.type === type.type);
  });

  const handleAdd = async () => {
    if (!selectedType) return;

    if (selectedType === "CUSTOM" && !customName.trim()) {
      toast.error("Digite um nome para a seção personalizada");
      return;
    }

    setIsLoading(true);
    try {
      const sectionName =
        selectedType === "CUSTOM"
          ? customName.trim()
          : SECTION_TYPES.find((t) => t.type === selectedType)?.name || "Nova Seção";

      const response = await apiClient.post(`/projects/${projectId}/sections`, {
        type: selectedType,
        title: sectionName,
      });

      toast.success("Seção adicionada com sucesso");
      onAdd(response.data);
      onClose();

      // Navigate to new section
      const routeMap: Record<string, string> = {
        MEETINGS: "meetings",
        PROPOSALS: "proposals",
        GANTT: "gantt",
        TASKS: "tasks",
        TEAM: "team",
        COSTS: "costs",
        NOTES: "notes",
      };
      const route = routeMap[selectedType] || response.data.id;
      router.push(`/projects/${projectId}/${route}`);
      router.refresh();
    } catch {
      toast.error("Erro ao adicionar seção");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setCustomName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Seção</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Escolha o tipo de seção que deseja adicionar ao projeto:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.type;
              const isDisabled = existingSections.some(
                (s) => s.type === type.type && type.type !== "CUSTOM"
              );

              return (
                <button
                  key={type.type}
                  onClick={() => !isDisabled && setSelectedType(type.type)}
                  disabled={isDisabled}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-lg border-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                    isDisabled &&
                      "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-8 w-8",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div className="text-center">
                    <p
                      className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {type.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {type.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom name input */}
          {selectedType === "CUSTOM" && (
            <div className="space-y-2">
              <Label htmlFor="custom-name">Nome da seção</Label>
              <Input
                id="custom-name"
                placeholder="Digite o nome da seção"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedType || isLoading}
            >
              {isLoading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
