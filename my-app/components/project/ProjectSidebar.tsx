"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Video,
  FileText,
  BarChart3,
  CheckSquare,
  Users,
  DollarSign,
  StickyNote,
  Link2,
  FolderOpen,
  AlertTriangle,
  MessageSquare,
  BarChart2,
  Layers,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/contexts/ProjectContext";
import { canReorderSections, canAddSection } from "@/lib/permissions";
import { SidebarSectionItem } from "./SidebarSectionItem";
import { AddSectionModal } from "./AddSectionModal";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface ProjectSidebarProps {
  sections: Section[];
  projectId: string;
  userRole: string;
  taskCount: number;
}

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MEETINGS: Video,
  PROPOSALS: FileText,
  GANTT: BarChart3,
  TASKS: CheckSquare,
  TEAM: Users,
  COSTS: DollarSign,
  NOTES: StickyNote,
  LINKS: Link2,
  DOCUMENTS: FolderOpen,
  RISKS: AlertTriangle,
  FEEDBACK: MessageSquare,
  REPORTS: BarChart2,
  CUSTOM: Layers,
};

const SECTION_LABELS: Record<string, string> = {
  MEETINGS: "Reuniões",
  PROPOSALS: "Propostas",
  GANTT: "Cronograma",
  TASKS: "Tarefas",
  TEAM: "Equipe",
  COSTS: "Custos",
  NOTES: "Notas",
  LINKS: "Links",
  DOCUMENTS: "Documentos",
  RISKS: "Riscos",
  FEEDBACK: "Feedback",
  REPORTS: "Relatórios",
  CUSTOM: "Personalizada",
};

export function ProjectSidebar({
  sections,
  projectId,
  userRole,
  taskCount,
}: ProjectSidebarProps) {
  const pathname = usePathname();
  const [items, setItems] = useState(sections);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const canReorder = canReorderSections(userRole);
  const canAdd = canAddSection(userRole);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Save new order to API
      setIsReordering(true);
      try {
        await apiClient.patch(`/projects/${projectId}/sections/reorder`, {
          sectionIds: newItems.map((item) => item.id),
        });
        toast.success("Ordem das seções atualizada");
      } catch {
        toast.error("Erro ao reordenar seções");
        setItems(sections); // Revert on error
      } finally {
        setIsReordering(false);
      }
    }
  };

  const getSectionHref = (section: Section): string => {
    const routeMap: Record<string, string> = {
      MEETINGS: "meetings",
      PROPOSALS: "proposals",
      GANTT: "gantt",
      TASKS: "tasks",
      TEAM: "team",
      COSTS: "costs",
      NOTES: "notes",
    };
    const route = routeMap[section.type] || section.id;
    return `/projects/${projectId}/${route}`;
  };

  const isOverviewActive = pathname === `/projects/${projectId}`;

  // Get badge for section
  const getSectionBadge = (section: Section): number | undefined => {
    if (section.type === "TASKS" && taskCount > 0) {
      return taskCount;
    }
    return undefined;
  };

  return (
    <aside className="w-56 border-r bg-card flex-shrink-0 hidden md:flex flex-col">
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Overview Link */}
        <div className="px-3 mb-4">
          <Link
            href={`/projects/${projectId}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isOverviewActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Visão Geral
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-3 mb-4 border-t" />

        {/* Sections */}
        <div className="px-3">
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Seções
          </p>

          {canReorder ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1">
                  {items.map((section) => {
                    const href = getSectionHref(section);
                    const isActive = pathname.startsWith(href);
                    const Icon = SECTION_ICONS[section.type] || Layers;
                    const badge = getSectionBadge(section);

                    return (
                      <SidebarSectionItem
                        key={section.id}
                        section={section}
                        href={href}
                        isActive={isActive}
                        icon={Icon}
                        label={section.title || SECTION_LABELS[section.type] || "Seção"}
                        badge={badge}
                        canReorder={canReorder}
                        disabled={isReordering}
                      />
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          ) : (
            <ul className="space-y-1">
              {items.map((section) => {
                const href = getSectionHref(section);
                const isActive = pathname.startsWith(href);
                const Icon = SECTION_ICONS[section.type] || Layers;
                const badge = getSectionBadge(section);

                return (
                  <li key={section.id}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 truncate">
                        {section.title || SECTION_LABELS[section.type] || "Seção"}
                      </span>
                      {badge !== undefined && badge > 0 && (
                        <Badge variant={badge > 5 ? "destructive" : "secondary"} className="text-xs">
                          {badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add Section Button */}
        {canAdd && (
          <div className="px-3 mt-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar seção
            </Button>
          </div>
        )}
      </nav>

      {/* Add Section Modal */}
      <AddSectionModal
        projectId={projectId}
        existingSections={items}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(section) => setItems([...items, section])}
      />
    </aside>
  );
}
