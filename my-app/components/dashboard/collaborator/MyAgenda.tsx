"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, CheckSquare, Clock } from "lucide-react";
import { format, isToday, isSameDay, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MyAgendaProps {
  meetings: any[];
  tasks: any[];
}

function getMeetingTypeIcon(type: string) {
  return type === "ONLINE" ? <Video className="w-4 h-4" /> : <Calendar className="w-4 h-4" />;
}

export function MyAgenda({ meetings, tasks }: MyAgendaProps) {
  const [activeTab, setActiveTab] = useState("today");
  const now = new Date();

  // Combine meetings and tasks for today
  const todayItems = [
    ...meetings.filter((m) => isToday(new Date(m.date))).map((m) => ({ ...m, type: "meeting" })),
    ...tasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate))).map((t) => ({ ...t, type: "task" })),
  ].sort((a, b) => {
    const aTime = a.type === "meeting" ? new Date(a.date) : new Date(a.dueDate);
    const bTime = b.type === "meeting" ? new Date(b.date) : new Date(b.dueDate);
    return aTime.getTime() - bTime.getTime();
  });

  // Get current hour for timeline
  const currentHour = now.getHours();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Minha Agenda</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Esta Semana</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <div className="relative space-y-3">
              {/* Current time indicator */}
              <div
                className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                style={{ top: `${(currentHour / 24) * 100}%` }}
              >
                <span className="absolute -top-3 right-0 text-xs text-red-500 bg-background px-1">
                  Agora
                </span>
              </div>

              {todayItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Nada agendado para hoje</p>
                </div>
              ) : (
                todayItems.map((item, i) => {
                  const isMeeting = item.type === "meeting";
                  const time = isMeeting
                    ? format(new Date(item.date), "HH:mm")
                    : "Prazo";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        isMeeting ? "bg-indigo-50 dark:bg-indigo-950/20" : "bg-green-50 dark:bg-green-950/20"
                      )}
                    >
                      <div className="flex flex-col items-center min-w-[50px]">
                        <span className="font-medium text-sm">{time}</span>
                        {isMeeting && (
                          <span className="text-xs text-muted-foreground">
                            {item.duration}min
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isMeeting ? getMeetingTypeIcon(item.meetingType) : <CheckSquare className="w-4 h-4" />}
                          <span className="font-medium text-sm">{item.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.project?.name}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="week" className="mt-4">
            <div className="space-y-2">
              {["Seg", "Ter", "Qua", "Qui", "Sex"].map((day, i) => {
                const dayMeetings = meetings.filter((m) => {
                  const mDate = new Date(m.date);
                  return mDate.getDay() === i + 1; // Monday = 1
                });

                return (
                  <div key={day} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                    <div className="w-10 text-sm font-medium">{day}</div>
                    <div className="flex-1 flex gap-1">
                      {dayMeetings.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className="w-2 h-2 rounded-full bg-primary"
                          title={m.title}
                        />
                      ))}
                      {dayMeetings.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{dayMeetings.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
