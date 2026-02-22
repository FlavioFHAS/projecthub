import { MapPin, Video, GitMerge, LucideIcon } from "lucide-react";

export type MeetingType = "IN_PERSON" | "ONLINE" | "HYBRID";
export type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

export function getMeetingTypeConfig(type: MeetingType): {
  icon: LucideIcon;
  color: string;
  label: string;
} {
  const configs: Record<MeetingType, { icon: LucideIcon; color: string; label: string }> = {
    IN_PERSON: { icon: MapPin, color: "text-emerald-500", label: "Presencial" },
    ONLINE: { icon: Video, color: "text-blue-500", label: "Online" },
    HYBRID: { icon: GitMerge, color: "text-purple-500", label: "Híbrido" },
  };
  return configs[type] || configs.ONLINE;
}

export function getMeetingStatusConfig(status: MeetingStatus): {
  label: string;
  className: string;
} {
  const configs: Record<MeetingStatus, { label: string; className: string }> = {
    SCHEDULED: {
      label: "Agendada",
      className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    COMPLETED: {
      label: "Realizada",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    CANCELLED: {
      label: "Cancelada",
      className: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };
  return configs[status] || configs.SCHEDULED;
}

export function isMeetingToday(date: Date | string): boolean {
  const meetingDate = new Date(date);
  const today = new Date();
  return (
    meetingDate.getDate() === today.getDate() &&
    meetingDate.getMonth() === today.getMonth() &&
    meetingDate.getFullYear() === today.getFullYear()
  );
}

export function isMeetingPast(date: Date | string): boolean {
  const meetingDate = new Date(date);
  const now = new Date();
  return meetingDate.getTime() < now.getTime();
}

export function formatMeetingDate(date: Date | string): string {
  const meetingDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = meetingDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isMeetingToday(date)) {
    return `Hoje às ${timeStr}`;
  }

  if (
    meetingDate.getDate() === tomorrow.getDate() &&
    meetingDate.getMonth() === tomorrow.getMonth() &&
    meetingDate.getFullYear() === tomorrow.getFullYear()
  ) {
    return `Amanhã às ${timeStr}`;
  }

  const dateStr = meetingDate.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return `${dateStr} às ${timeStr}`;
}
