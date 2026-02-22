"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, LayoutGrid, List, CheckSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTasks, Task, KanbanColumn, TaskFilters } from "@/hooks/tasks/useTasks";
import { useProjectId, useProjectRole } from "@/contexts/ProjectContext";
import { KanbanBoard } from "./KanbanBoard";
import { TasksList } from "./TasksList";
import { TaskFormModal } from "./TaskFormModal";
import { cn } from "@/lib/utils";

interface TasksClientProps {
  initialTasks: Task[];
  initialColumns: KanbanColumn[];
  members: { id: string; name: string | null; image: string | null; email: string }[];
  projectId: string;
}

export function TasksClient({
  initialTasks,
  initialColumns,
  members,
  projectId,
}: TasksClientProps) {
  const { tasks, columns, tasksByColumn, isLoading } = useTasks(projectId, {
    tasks: initialTasks,
    columns: initialColumns,
  });

  const userRole = useProjectRole();
  const canCreateTask = userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "COLLABORATOR";

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  const [filters, setFilters] = useState<TaskFilters>({
    status: [],
    priority: [],
    assigneeId: null,
    tags: [],
    overdue: false,
    columnId: null,
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeId) {
        const hasAssignee = task.assignees.some(
          (a) => a.user.id === filters.assigneeId
        );
        if (!hasAssignee) return false;
      }

      // Column filter
      if (filters.columnId && task.columnId !== filters.columnId) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filters]);

  const filteredTasksByColumn = useMemo(() => {
    const filteredIds = new Set(filteredTasks.map((t) => t.id));
    const result: Record<string, Task[]> = {};
    for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
      result[columnId] = columnTasks.filter((t) => filteredIds.has(t.id));
    }
    return result;
  }, [tasksByColumn, filteredTasks]);

  const openCount = tasks.filter((t) => t.status !== "DONE").length;
  const totalCount = tasks.length;
  const activeFiltersCount =
    filters.status.length +
    filters.priority.length +
    (filters.assigneeId ? 1 : 0) +
    (filters.columnId ? 1 : 0);

  const handleAddTask = (columnId?: string) => {
    setSelectedColumnId(columnId || null);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6" />
            Tarefas
            <Badge variant="secondary" className="ml-2">
              {openCount} / {totalCount}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Gerencie as tarefas do projeto
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-1">
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {canCreateTask && (
            <Button onClick={() => handleAddTask()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Content */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-h-0"
      >
        {view === "kanban" ? (
          <KanbanBoard
            columns={columns}
            tasksByColumn={filteredTasksByColumn}
            members={members}
            onAddTask={handleAddTask}
          />
        ) : (
          <TasksList
            tasks={filteredTasks}
            columns={columns}
            members={members}
          />
        )}
      </motion.div>

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
        columns={columns}
        members={members}
        defaultColumnId={selectedColumnId || undefined}
      />
    </div>
  );
}
