"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, User, Tag, Clock, ChevronDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { useCreateTask, KanbanColumn, TaskPriority } from "@/hooks/tasks/useTasks";
import { cn } from "@/lib/utils";

const taskFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(300),
  columnId: z.string().min(1, "Selecione uma coluna"),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  dueDate: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  columns: KanbanColumn[];
  members: { id: string; name: string | null; image: string | null; email: string }[];
  defaultColumnId?: string;
}

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: "CRITICAL", label: "Crítica", color: "text-red-500" },
  { value: "HIGH", label: "Alta", color: "text-orange-500" },
  { value: "MEDIUM", label: "Média", color: "text-blue-500" },
  { value: "LOW", label: "Baixa", color: "text-slate-500" },
];

export function TaskFormModal({
  isOpen,
  onClose,
  projectId,
  columns,
  members,
  defaultColumnId,
}: TaskFormModalProps) {
  const createMutation = useCreateTask(projectId);
  const [description, setDescription] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      columnId: defaultColumnId || columns[0]?.id || "",
      priority: "MEDIUM",
      assigneeIds: [],
    },
  });

  const selectedAssignees = watch("assigneeIds") || [];

  const onSubmit = async (data: TaskFormData) => {
    const payload = {
      ...data,
      description,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };

    await createMutation.mutateAsync(payload);
    reset();
    setDescription(null);
    setShowDetails(false);
    onClose();
  };

  const toggleAssignee = (userId: string) => {
    const current = selectedAssignees;
    if (current.includes(userId)) {
      setValue(
        "assigneeIds",
        current.filter((id) => id !== userId)
      );
    } else {
      setValue("assigneeIds", [...current, userId]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Nome da tarefa"
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Quick Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="column">Coluna *</Label>
              <Select
                value={watch("columnId")}
                onValueChange={(value) => setValue("columnId", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value: TaskPriority) => setValue("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={cn("flex items-center gap-2", option.color)}>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expand Details */}
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>Adicionar detalhes</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showDetails && "rotate-180")}
            />
          </Button>

          {showDetails && (
            <div className="space-y-6 animate-in slide-in-from-top-2">
              {/* Description */}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Descreva a tarefa..."
                  toolbarSize="minimal"
                  minHeight="150px"
                />
              </div>

              {/* Due Date & Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Prazo</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dueDate"
                      type="date"
                      {...register("dueDate")}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimativa (horas)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="estimatedHours"
                      type="number"
                      min={0}
                      step={0.5}
                      {...register("estimatedHours", { valueAsNumber: true })}
                      className="pl-10"
                      placeholder="4"
                    />
                  </div>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <Label>Responsáveis</Label>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors",
                        selectedAssignees.includes(member.id)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted border-transparent hover:bg-muted/80"
                      )}
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                        {member.name?.charAt(0).toUpperCase() ||
                          member.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px]">
                        {member.name || member.email}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setDescription(null);
                setShowDetails(false);
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
