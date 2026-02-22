"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown, ChevronUp, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMeetings, Meeting } from "@/hooks/meetings/useMeetings";
import { useProjectId } from "@/contexts/ProjectContext";
import { MeetingCard } from "./MeetingCard";
import { MeetingFormModal } from "./MeetingFormModal";
import { MeetingDetailModal } from "./MeetingDetailModal";

interface MeetingsClientProps {
  initialMeetings?: Meeting[];
}

export function MeetingsClient({ initialMeetings }: MeetingsClientProps) {
  const projectId = useProjectId();
  const { meetings, groupedMeetings, isLoading } = useMeetings(projectId, initialMeetings);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const totalCount = meetings.length;
  const scheduledCount = groupedMeetings.scheduled.length;
  const completedCount = groupedMeetings.completed.length;
  const cancelledCount = groupedMeetings.cancelled.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6" />
            Reuniões
            <Badge variant="secondary" className="ml-2">
              {totalCount}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Gerencie as reuniões do projeto
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Reunião
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-8">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma reunião agendada</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            As reuniões do projeto aparecerão aqui. Agende sua primeira reunião para começar.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Reunião
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Scheduled Meetings */}
          {scheduledCount > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Agendadas ({scheduledCount})
              </h2>
              <div className="space-y-3">
                {groupedMeetings.scheduled.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onOpen={() => setSelectedMeeting(meeting)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed Meetings */}
          {completedCount > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Realizadas ({completedCount})
              </h2>
              <div className="space-y-3">
                {groupedMeetings.completed.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onOpen={() => setSelectedMeeting(meeting)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Cancelled Meetings */}
          {cancelledCount > 0 && (
            <section>
              <button
                onClick={() => setShowCancelled(!showCancelled)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors"
              >
                Canceladas ({cancelledCount})
                {showCancelled ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              <AnimatePresence>
                {showCancelled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {groupedMeetings.cancelled.map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        onOpen={() => setSelectedMeeting(meeting)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      )}

      {/* Modals */}
      <MeetingFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
      />

      <MeetingDetailModal
        meeting={selectedMeeting}
        isOpen={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        projectId={projectId}
      />
    </div>
  );
}
