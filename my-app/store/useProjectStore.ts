import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActiveProject {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
}

interface BreadcrumbState {
  projectName: string;
  sectionName: string;
}

interface ProjectState {
  activeProject: ActiveProject | null;
  breadcrumb: BreadcrumbState;
  sidebarCollapsed: boolean;
  
  // Actions
  setActiveProject: (project: ActiveProject) => void;
  clearActiveProject: () => void;
  setBreadcrumb: (projectName: string, sectionName: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeProject: null,
      breadcrumb: { projectName: "", sectionName: "" },
      sidebarCollapsed: false,

      setActiveProject: (project) => set({ activeProject: project }),
      
      clearActiveProject: () => set({ activeProject: null, breadcrumb: { projectName: "", sectionName: "" } }),
      
      setBreadcrumb: (projectName, sectionName) =>
        set({ breadcrumb: { projectName, sectionName } }),
      
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "project-store",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
