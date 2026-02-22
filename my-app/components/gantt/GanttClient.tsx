"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGantt } from "@/hooks/gantt/useGantt";
import { useProject } from "@/contexts/ProjectContext";
import { canManageProject } from "@/lib/permissions";
import { GanttToolbar } from "./GanttToolbar";
import { GanttActivityList } from "./GanttActivityList";
import { GanttChart } from "./GanttChart";
import { GanttItemFormModal } from "./GanttItemFormModal";
import { VIEW_MODE_CONFIG } from "@/lib/gantt/gantt-utils";

interface GanttClientProps {
  initialItems: any[];
}

export function GanttClient({ initialItems }: GanttClientProps) {
  const { project, currentMember } = useProject();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [listWidth, setListWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const {
    items,
    isLoading,
    viewMode,
    setViewMode,
    dateRange,
    expandedIds,
    selectedItemId,
    setSelectedItemId,
    toggleExpanded,
    expandAll,
    collapseAll,
    createItem,
    updateItem,
    deleteItem,
    handleDragEnd,
    handleResizeEnd,
    handleProgressChange,
  } = useGantt({ projectId: project.id });

  const canEdit = canManageProject(currentMember?.role);
  const config = VIEW_MODE_CONFIG[viewMode];

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = listWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(400, startWidth + e.clientX - startX));
      setListWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      <GanttToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />

      <div className="flex-1 flex overflow-hidden border rounded-lg bg-card">
        <div
          style={{ width: listWidth }}
          className="flex-shrink-0 border-r overflow-hidden"
        >
          <GanttActivityList
            items={items}
            expandedIds={expandedIds}
            selectedItemId={selectedItemId}
            onToggleExpanded={toggleExpanded}
            onSelectItem={setSelectedItemId}
            onEditItem={canEdit ? handleEditItem : undefined}
            rowHeight={40}
          />
        </div>

        <div
          className="w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
          onMouseDown={handleResizeStart}
        />

        <div className="flex-1 overflow-hidden">
          <GanttChart
            items={items}
            dateRange={dateRange}
            viewMode={viewMode}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            onDragEnd={canEdit ? handleDragEnd : undefined}
            onResizeEnd={canEdit ? handleResizeEnd : undefined}
            onProgressChange={canEdit ? handleProgressChange : undefined}
            onEditItem={canEdit ? handleEditItem : undefined}
            pxPerDay={config.pxPerDay}
            rowHeight={40}
          />
        </div>
      </div>

      {canEdit && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Atividade
          </Button>
        </div>
      )}

      <GanttItemFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingItem ? updateItem : createItem}
        initialData={editingItem}
        projectId={project.id}
      />
    </motion.div>
  );
}
