"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Video,
  GitMerge,
  Calendar,
  Clock,
  Link2,
  CheckCircle2,
  FileText,
  MoreVertical,
  ExternalLink,
  Check,
  Trash2,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Meeting } from "@/hooks/meetings/useMeetings";
import {
  formatDuration,
  getMeetingTypeConfig,
  getMeetingStatusConfig,
  formatMeetingDate,
} from "@/lib/meetings/meeting-utils";
import { cn } from "@/lib/utils";
import { useCompleteMeeting, useDeleteMeeting } from "@/hooks/meetings/useMeetings";
import { useProjectId } from "@/contexts/ProjectContext";
import { toast } from "sonner";

interface MeetingCardProps {
  meeting: Meeting;
  onOpen: () => void;
}

export function MeetingCard({ meeting, onOpen }: MeetingCardProps) {
  const projectId = useProjectId();
  const completeMutation = useCompleteMeeting(projectId);
  const deleteMutation = useDeleteMeeting(projectId);

  const typeConfig = getMeetingTypeConfig(meeting.type);
  const statusConfig = getMeetingStatusConfig(meeting.status);
  const TypeIcon = typeConfig.icon;

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeMutation.mutate(meeting.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta reunião?")) {
      deleteMutation.mutate(meeting.id);
    }
  };

  const hasAgenda = meeting.agenda && Object.keys(meeting.agenda).length > 0;
  const hasMinutes = meeting.minutes && Object.keys(meeting.minutes).length > 0;
  const decisionsCount = meeting.decisions?.length || 0;
  const nextStepsCount = meeting.nextSteps?.length || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.002 }}
      className={cn(
        "group relative rounded-lg border bg-card p-4 cursor-pointer",
        "hover:border-primary/30 hover:shadow-md transition-all"
      )}
      onClick={onOpen}
    >
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            "bg-muted"
          )}
        >
          <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold truncate">{meeting.title}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatMeetingDate(meeting.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(meeting.duration)}
                </span>
                {meeting.meetingUrl && (
                  <span className="flex items-center gap-1 text-primary">
                    <Link2 className="h-3.5 w-3.5" />
                    Google Meet
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onOpen}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                  {meeting.status === "SCHEDULED" && (
                    <DropdownMenuItem onClick={handleComplete}>
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como realizada
                    </DropdownMenuItem>
                  )}
                  {meeting.status === "COMPLETED" && (
                    <DropdownMenuItem>
                      <FileDown className="mr-2 h-4 w-4" />
                      Exportar ata PDF
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            {/* Participants */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {meeting.participants.slice(0, 4).map((participant) => (
                  <Avatar
                    key={participant.id}
                    className="h-6 w-6 border-2 border-card"
                  >
                    <AvatarImage src={participant.user.image || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10">
                      {participant.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {meeting.participants.length > 4 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-card">
                    +{meeting.participants.length - 4}
                  </div>
                )}
              </div>
              {meeting.participants.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {meeting.participants.length} participante
                  {meeting.participants.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Indicators */}
            <div className="flex items-center gap-3">
              {hasAgenda && (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pauta
                </span>
              )}
              {hasMinutes && (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <FileText className="h-3.5 w-3.5" />
                  Ata
                </span>
              )}
              {decisionsCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {decisionsCount} decisão{decisionsCount !== 1 ? "ões" : ""}
                </span>
              )}
              {nextStepsCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {nextStepsCount} próximo{nextStepsCount !== 1 ? "s" : ""} passo
                  {nextStepsCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
