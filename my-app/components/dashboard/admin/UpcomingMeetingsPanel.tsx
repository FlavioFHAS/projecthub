"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Calendar, ExternalLink, Clock } from "lucide-react";
import { format, differenceInMinutes, differenceInHours, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface UpcomingMeetingsPanelProps {
  meetings: any[];
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const minutes = differenceInMinutes(date, now);
  const hours = differenceInHours(date, now);

  if (minutes < 0) return "Em andamento";
  if (minutes < 60) return `Em ${minutes} min`;
  if (hours < 24) return `Em ${hours}h`;
  if (isToday(date)) return `Hoje às ${format(date, "HH:mm")}`;
  if (isTomorrow(date)) return `Amanhã às ${format(date, "HH:mm")}`;
  return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
}

function getMeetingTypeIcon(type: string) {
  switch (type) {
    case "ONLINE":
      return <Video className="w-4 h-4" />;
    default:
      return <Calendar className="w-4 h-4" />;
  }
}

export function UpcomingMeetingsPanel({ meetings }: UpcomingMeetingsPanelProps) {
  const now = new Date();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Próximas Reuniões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const meetingDate = new Date(meeting.date);
            const minutesUntil = differenceInMinutes(meetingDate, now);
            const canJoin = meeting.type === "ONLINE" && meeting.meetingUrl && minutesUntil < 15;
            const isLive = minutesUntil < 0 && minutesUntil > -meeting.duration;

            return (
              <div
                key={meeting.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  isLive && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getMeetingTypeIcon(meeting.type)}
                      <span className="font-medium text-sm truncate">{meeting.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {meeting.project?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={isLive ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          isLive && "bg-green-500 animate-pulse"
                        )}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {isLive ? "AO VIVO" : getRelativeTime(meetingDate)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {meeting.duration} min
                      </span>
                    </div>
                  </div>
                  {canJoin && meeting.meetingUrl && (
                    <a
                      href={meeting.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className={cn(
                          "h-8",
                          minutesUntil < 5 && "animate-pulse"
                        )}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Entrar
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {meetings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2" />
              <p>Nenhuma reunião agendada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
