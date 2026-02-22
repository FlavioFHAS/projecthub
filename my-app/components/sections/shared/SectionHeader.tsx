"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  count?: number;
  searchValue?: string;
  onSearch?: (value: string) => void;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  description?: string;
  className?: string;
}

export function SectionHeader({
  title,
  count,
  searchValue,
  onSearch,
  actions,
  filters,
  description,
  className,
}: SectionHeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchValue || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && localSearch !== searchValue) {
        onSearch(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearch, searchValue]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {count !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          )}
          {filters}
          {actions}
        </div>
      </div>
    </div>
  );
}
