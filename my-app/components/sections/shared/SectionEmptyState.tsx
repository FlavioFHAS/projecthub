"use client";

import React from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionType } from "@/lib/sections/section-registry";
import { getEmptyStateConfig } from "@/lib/sections/section-utils";

interface SectionEmptyStateProps {
  sectionType: SectionType;
  hasFilters?: boolean;
  canCreate?: boolean;
  onAction?: () => void;
  customMessage?: string;
}

export function SectionEmptyState({
  sectionType,
  hasFilters = false,
  canCreate = true,
  onAction,
  customMessage,
}: SectionEmptyStateProps) {
  const config = getEmptyStateConfig(sectionType);
  
  // Get icon component dynamically
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[config.icon] || LucideIcons.File;

  if (hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <LucideIcons.Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
        <p className="text-muted-foreground mt-1">
          Tente ajustar os filtros ou termos de busca
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${config.color}20` }}
      >
        <IconComponent className="w-10 h-10" style={{ color: config.color }} />
      </div>
      <h3 className="text-xl font-semibold">{config.title}</h3>
      <p className="text-muted-foreground mt-2 max-w-md">
        {customMessage || config.subtitle}
      </p>
      {canCreate && onAction && (
        <Button onClick={onAction} className="mt-6">
          <LucideIcons.Plus className="w-4 h-4 mr-2" />
          {config.actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
