"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/contexts/ProjectContext";

interface SidebarSectionItemProps {
  section: Section;
  href: string;
  isActive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  canReorder: boolean;
  disabled?: boolean;
}

export function SidebarSectionItem({
  section,
  href,
  isActive,
  icon: Icon,
  label,
  badge,
  canReorder,
  disabled,
}: SidebarSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: disabled || !canReorder });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50"
      )}
    >
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          isDragging && "opacity-50 shadow-lg scale-[1.02]"
        )}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
        )}

        {/* Drag handle */}
        {canReorder && (
          <button
            {...attributes}
            {...listeners}
            className={cn(
              "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing",
              isDragging && "opacity-100"
            )}
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
        )}

        {/* Icon */}
        <Icon className="h-4 w-4 flex-shrink-0" />

        {/* Label */}
        <span className="flex-1 truncate">{label}</span>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <Badge
            variant={badge > 5 ? "destructive" : "secondary"}
            className="text-xs"
          >
            {badge}
          </Badge>
        )}
      </Link>
    </li>
  );
}
