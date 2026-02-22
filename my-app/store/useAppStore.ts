import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Board preferences
  boardViewMode: "grid" | "list";
  setBoardViewMode: (mode: "grid" | "list") => void;

  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Theme (for client-side hydration)
  theme: "dark" | "light" | "system";
  setTheme: (theme: "dark" | "light" | "system") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Board
      boardViewMode: "grid",
      setBoardViewMode: (mode) => set({ boardViewMode: mode }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Theme
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "projecthub-preferences",
      partialize: (state) => ({
        boardViewMode: state.boardViewMode,
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);
