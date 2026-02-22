"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardGreetingProps {
  user: any;
  summary?: string;
}

function getGreeting(hour: number): { text: string; emoji: string } {
  if (hour < 12) return { text: "Bom dia", emoji: "☀️" };
  if (hour < 18) return { text: "Boa tarde", emoji: "🌤️" };
  return { text: "Boa noite", emoji: "🌙" };
}

export function DashboardGreeting({ user, summary }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState({ text: "Olá", emoji: "👋" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setGreeting(getGreeting(hour));
  }, []);

  const displayName = user.role === "CLIENT" 
    ? user.name 
    : user.name?.split(" ")[0] || "Usuário";

  const currentDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  // Capitalize first letter
  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold">
        {mounted ? (
          <span suppressHydrationWarning>
            {greeting.text}, {displayName}! {greeting.emoji}
          </span>
        ) : (
          `Olá, ${displayName}! 👋`
        )}
      </h1>
      {summary && (
        <p className="text-muted-foreground">{summary}</p>
      )}
      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
        {formattedDate}
      </p>
    </div>
  );
}
