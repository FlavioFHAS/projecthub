"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { ProjectCard } from "./ProjectCard";
import { ProjectCardOverlay } from "./ProjectCardOverlay";

import type { ProjectWithClient } from "@/types/project";

interface ProjectsGridProps {
  projects: ProjectWithClient[];
  onReorder: (projects: { id: string; order: number }[]) => void;
  isReordering: boolean;
}

export function ProjectsGrid({
  projects,
  onReorder,
  isReordering,
}: ProjectsGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState(projects);

  // Update items when projects prop changes
  useState(() => {
    setItems(projects);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          const newItems = arrayMove(items, oldIndex, newIndex);

          // Call API with new order
          const newOrder = newItems.map((item, index) => ({
            id: item.id,
            order: index,
          }));
          onReorder(newOrder);

          return newItems;
        });
      }

      setActiveId(null);
    },
    [onReorder]
  );

  const activeProject = activeId
    ? items.find((p) => p.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              isDragging={project.id === activeId}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeProject ? (
          <ProjectCardOverlay project={activeProject} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
