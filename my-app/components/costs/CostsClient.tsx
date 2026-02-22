"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, List, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCosts } from "@/hooks/costs/useCosts";
import { useProject } from "@/contexts/ProjectContext";
import { canManageProject } from "@/lib/permissions";
import { CostOverview } from "./CostOverview";
import { CostEntries } from "./CostEntries";
import { CostComparison } from "./CostComparison";
import { CostEntryFormModal } from "./CostEntryFormModal";

interface CostsClientProps {
  initialEntries: any[];
  budget: number;
}

export function CostsClient({ initialEntries, budget }: CostsClientProps) {
  const { project, currentMember } = useProject();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const {
    entries,
    filteredEntries,
    isLoading,
    metrics,
    costsByCategory,
    costsByMonth,
    costsByStatus,
    filters,
    createCost,
    updateCost,
    deleteCost,
    approveCost,
    rejectCost,
    markAsPaid,
    exportCSV,
    exportExcel,
    isCreating,
    isUpdating,
    isDeleting,
    isExportingCSV,
    isExportingExcel,
  } = useCosts({ projectId: project.id, budget });

  const canEdit = canManageProject(currentMember?.role);

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="entries" className="gap-2">
              <List className="w-4 h-4" />
              Lançamentos
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Planejado vs Real
            </TabsTrigger>
          </TabsList>

          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Custo
            </Button>
          )}
        </div>

        <TabsContent value="overview" className="mt-6">
          <CostOverview
            metrics={metrics}
            costsByCategory={costsByCategory}
            costsByMonth={costsByMonth}
            costsByStatus={costsByStatus}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="entries" className="mt-6">
          <CostEntries
            entries={filteredEntries}
            filters={filters}
            onEdit={canEdit ? handleEditEntry : undefined}
            onDelete={canEdit ? deleteCost : undefined}
            onApprove={canEdit ? approveCost : undefined}
            onReject={canEdit ? rejectCost : undefined}
            onMarkAsPaid={canEdit ? markAsPaid : undefined}
            onExportCSV={exportCSV}
            onExportExcel={exportExcel}
            isExportingCSV={isExportingCSV}
            isExportingExcel={isExportingExcel}
            isDeleting={isDeleting}
          />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <CostComparison
            entries={entries}
            budget={budget}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      <CostEntryFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingEntry ? updateCost : createCost}
        initialData={editingEntry}
        projectId={project.id}
      />
    </motion.div>
  );
}
