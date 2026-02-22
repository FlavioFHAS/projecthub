"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MapPin,
  Video,
  GitMerge,
  Calendar,
  Clock,
  Link2,
  Users,
  CheckCircle2,
  FileText,
  Edit,
  FileDown,
  Check,
  ExternalLink,
  Plus,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextViewer } from "@/components/shared/RichTextViewer";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { Meeting } from "@/hooks/meetings/useMeetings";
import {
  formatDuration,
  getMeetingTypeConfig,
  getMeetingStatusConfig,
} from "@/lib/meetings/meeting-utils";
import { cn } from "@/lib/utils";
import { useProjectId } from "@/contexts/ProjectContext";
import { useCompleteMeeting, useUpdateMeeting } from "@/hooks/meetings/useMeetings";
import { toast } from "sonner";

interface MeetingDetailModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function MeetingDetailModal({
  meeting,
  isOpen,
  onClose,
  projectId,
}: MeetingDetailModalProps) {
  const completeMutation = useCompleteMeeting(projectId);
  const updateMutation = useUpdateMeeting(projectId);

  const [isEditingMinutes, setIsEditingMinutes] = useState(false);
  const [minutesContent, setMinutesContent] = useState<any>(null);
  const [newDecision, setNewDecision] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);

  if (!meeting) return null;

  const typeConfig = getMeetingTypeConfig(meeting.type);
  const statusConfig = getMeetingStatusConfig(meeting.status);
  const TypeIcon = typeConfig.icon;

  const handleComplete = () => {
    completeMutation.mutate(meeting.id);
  };

  const handleSaveMinutes = async () => {
    await updateMutation.mutateAsync({
      meetingId: meeting.id,
      data: { minutes: minutesContent },
    });
    setIsEditingMinutes(false);
  };

  const handleAddDecision = () => {
    if (newDecision.trim()) {
      setDecisions([...decisions, newDecision.trim()]);
      setNewDecision("");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          {/* Type + Title */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl">{meeting.title}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {typeConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(meeting.date), "EEEE, d 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(meeting.date), "HH:mm")} (
              {formatDuration(meeting.duration)})
            </span>
          </div>

          {/* Meeting Link */}
          {meeting.meetingUrl && (
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Entrar na reunião
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Location */}
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {meeting.location}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {meeting.status === "SCHEDULED" && (
              <Button onClick={handleComplete} size="sm">
                <Check className="mr-2 h-4 w-4" />
                Marcar como realizada
              </Button>
            )}
            {meeting.status === "COMPLETED" && (
              <Button variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="agenda" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="agenda" className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Pauta
            </TabsTrigger>
            <TabsTrigger value="minutes" className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Ata
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Decisões
            </TabsTrigger>
            <TabsTrigger value="nextSteps" className="flex-1">
              <ExternalLink className="mr-2 h-4 w-4" />
              Próximos Passos
            </TabsTrigger>
          </TabsList>

          {/* Agenda Tab */}
          <TabsContent value="agenda" className="mt-4">
            {meeting.agenda ? (
              <RichTextViewer content={meeting.agenda} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Pauta não preenchida</p>
              </div>
            )}
          </TabsContent>

          {/* Minutes Tab */}
          <TabsContent value="minutes" className="mt-4">
            {isEditingMinutes ? (
              <div className="space-y-4">
                <RichTextEditor
                  content={minutesContent || meeting.minutes}
                  onChange={setMinutesContent}
                  placeholder="Escreva a ata da reunião..."
                  toolbarSize="compact"
                  minHeight="200px"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingMinutes(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveMinutes}>Salvar Ata</Button>
                </div>
              </div>
            ) : meeting.minutes ? (
              <div className="space-y-4">
                <RichTextViewer content={meeting.minutes} />
                <Button
                  variant="outline"
                  onClick={() => setIsEditingMinutes(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Ata
                </Button>
              </div>
            ) : meeting.status === "COMPLETED" ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Ata não preenchida
                </p>
                <Button onClick={() => setIsEditingMinutes(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Preencher Ata
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>A ata estará disponível após a reunião ser realizada</p>
              </div>
            )}
          </TabsContent>

          {/* Decisions Tab */}
          <TabsContent value="decisions" className="mt-4">
            <div className="space-y-4">
              {/* Add Decision */}
              <div className="flex gap-2">
                <Input
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  placeholder="Adicionar nova decisão..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddDecision()}
                />
                <Button onClick={handleAddDecision}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Decisions List */}
              {decisions.length > 0 || meeting.decisions?.length ? (
                <ul className="space-y-2">
                  {meeting.decisions?.map((decision, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium text-muted-foreground min-w-[1.5rem]">
                        {index + 1}.
                      </span>
                      <span>{decision}</span>
                    </li>
                  ))}
                  {decisions.map((decision, index) => (
                    <li
                      key={`new-${index}`}
                      className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <span className="font-medium text-primary min-w-[1.5rem]">
                        {(meeting.decisions?.length || 0) + index + 1}.
                      </span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma decisão registrada</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Next Steps Tab */}
          <TabsContent value="nextSteps" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum próximo passo definido</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Participants */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <Users className="h-4 w-4" />
            Participantes ({meeting.participants.length})
          </h3>
          <div className="space-y-2">
            {meeting.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant.user.image || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {participant.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {participant.user.name || "Usuário"}
                  </span>
                </div>
                <Checkbox
                  checked={participant.attended}
                  onCheckedChange={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
