"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, MapPin, Video, GitMerge, Link2, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { useCreateMeeting, useUpdateMeeting, Meeting } from "@/hooks/meetings/useMeetings";
import { useProjectId, useProject } from "@/contexts/ProjectContext";
import { cn } from "@/lib/utils";

const meetingSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  type: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Hora é obrigatória"),
  duration: z.number().min(15, "Duração mínima é 15 minutos"),
  location: z.string().optional(),
  meetingUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  agenda: z.any().optional(),
  isVisibleToClient: z.boolean(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  meeting?: Meeting | null;
}

const durationOptions = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
];

export function MeetingFormModal({
  isOpen,
  onClose,
  projectId,
  meeting,
}: MeetingFormModalProps) {
  const isEditing = !!meeting;
  const createMutation = useCreateMeeting(projectId);
  const updateMutation = useUpdateMeeting(projectId);
  const { project } = useProject();

  const [agendaContent, setAgendaContent] = useState(meeting?.agenda || null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: meeting
      ? {
          title: meeting.title,
          type: meeting.type,
          status: meeting.status,
          date: meeting.date.split("T")[0],
          time: format(new Date(meeting.date), "HH:mm"),
          duration: meeting.duration,
          location: meeting.location || "",
          meetingUrl: meeting.meetingUrl || "",
          isVisibleToClient: meeting.isVisibleToClient,
        }
      : {
          type: "ONLINE",
          status: "SCHEDULED",
          duration: 60,
          isVisibleToClient: true,
        },
  });

  const meetingType = watch("type");
  const isOnline = meetingType === "ONLINE" || meetingType === "HYBRID";
  const isInPerson = meetingType === "IN_PERSON" || meetingType === "HYBRID";

  const onSubmit = async (data: MeetingFormData) => {
    const dateTime = new Date(`${data.date}T${data.time}`);

    const payload = {
      ...data,
      date: dateTime.toISOString(),
      agenda: agendaContent,
    };

    if (isEditing && meeting) {
      await updateMutation.mutateAsync({ meetingId: meeting.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Reunião" : "Nova Reunião"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Ex: Reunião de Kick-off"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  {...register("time")}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração *</Label>
              <Select
                value={watch("duration")?.toString()}
                onValueChange={(value) => setValue("duration", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={watch("type")}
                onValueChange={(value: any) => setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Online
                    </span>
                  </SelectItem>
                  <SelectItem value="IN_PERSON">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Presencial
                    </span>
                  </SelectItem>
                  <SelectItem value="HYBRID">
                    <span className="flex items-center gap-2">
                      <GitMerge className="h-4 w-4" />
                      Híbrido
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch("status")}
                onValueChange={(value: any) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Agendada</SelectItem>
                  <SelectItem value="COMPLETED">Realizada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meeting URL (if online/hybrid) */}
          {isOnline && (
            <div className="space-y-2">
              <Label htmlFor="meetingUrl">Link da reunião</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="meetingUrl"
                  {...register("meetingUrl")}
                  placeholder="https://meet.google.com/..."
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Location (if in-person/hybrid) */}
          {isInPerson && (
            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="Endereço ou sala de reunião"
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Agenda */}
          <div className="space-y-2">
            <Label>Pauta</Label>
            <RichTextEditor
              content={agendaContent}
              onChange={setAgendaContent}
              placeholder="Descreva a pauta da reunião..."
              toolbarSize="compact"
              minHeight="150px"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Visível para o cliente</p>
                <p className="text-sm text-muted-foreground">
                  O cliente poderá ver esta reunião
                </p>
              </div>
            </div>
            <Switch
              checked={watch("isVisibleToClient")}
              onCheckedChange={(checked) => setValue("isVisibleToClient", checked)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : isEditing
                ? "Salvar Alterações"
                : "Criar Reunião"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
