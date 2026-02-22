"use client";

import { createContext, useContext } from "react";

export interface ProjectMember {
  id: string;
  role: string;
  permissions: any;
  joinedAt: Date;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    image: string | null;
  };
}

export interface Section {
  id: string;
  type: string;
  title: string | null;
  isVisible: boolean;
  order: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  visibleToRoles?: string[];
}

export interface ProjectFull {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  color: string | null;
  coverUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | null;
  tags: string[];
  isPublic: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  clientId: string | null;
  client: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
  ownerId: string;
  members: ProjectMember[];
  sections: Section[];
  _count: {
    tasks: number;
    meetings: number;
    notes: number;
  };
  progress?: number;
}

interface ProjectContextValue {
  project: ProjectFull;
  visibleSections: Section[];
  currentMember: ProjectMember | null;
  userRole: string;
  userId: string;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  value,
  children,
}: {
  value: ProjectContextValue;
  children: React.ReactNode;
}) {
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// Hook de acesso ao context
export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject deve ser usado dentro de ProjectProvider");
  return ctx;
}

// Hooks derivados para conveniência
export function useProjectId(): string {
  return useProject().project.id;
}

export function useProjectSections(): Section[] {
  return useProject().visibleSections;
}

export function useCurrentMember(): ProjectMember | null {
  return useProject().currentMember;
}

export function useProjectRole(): string {
  return useProject().userRole;
}
