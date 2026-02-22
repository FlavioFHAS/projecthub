"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectSidebar } from "./ProjectSidebar";
import {
  ProjectProvider,
  ProjectFull,
  Section,
  ProjectMember,
} from "@/contexts/ProjectContext";
import { useProjectStore } from "@/store/useProjectStore";

interface ProjectLayoutClientProps {
  project: ProjectFull;
  visibleSections: Section[];
  currentMember: ProjectMember | null;
  userRole: string;
  userId: string;
  children: React.ReactNode;
}

export function ProjectLayoutClient({
  project,
  visibleSections,
  currentMember,
  userRole,
  userId,
  children,
}: ProjectLayoutClientProps) {
  const pathname = usePathname();
  const { setActiveProject, clearActiveProject, setBreadcrumb } = useProjectStore();

  // Popular o Zustand store com o projeto ativo
  useEffect(() => {
    setActiveProject({
      id: project.id,
      name: project.name,
      permissions: currentMember?.permissions || {},
    });

    // Atualizar breadcrumb
    const sectionMatch = pathname.match(/\/projects\/[^/]+\/([^/]+)/);
    const sectionName = sectionMatch ? sectionMatch[1] : "overview";
    setBreadcrumb(project.name, sectionName);

    return () => {
      clearActiveProject();
    };
  }, [project.id, project.name, currentMember?.permissions, pathname, setActiveProject, clearActiveProject, setBreadcrumb]);

  return (
    <ProjectProvider
      value={{ project, visibleSections, currentMember, userRole, userId }}
    >
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <ProjectHeader project={project} userRole={userRole} />
        <div className="flex flex-1 overflow-hidden">
          <ProjectSidebar
            sections={visibleSections}
            projectId={project.id}
            userRole={userRole}
            taskCount={project._count.tasks}
          />
          <main className="flex-1 overflow-y-auto bg-background/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="h-full p-4 sm:p-6 lg:p-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}
