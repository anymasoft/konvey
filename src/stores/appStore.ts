/**
 * Global app state — what screen is shown, which project is currently open.
 *
 * Not for per-project mapping state (that's in projectStore).
 */
import { create } from "zustand";
import { backend } from "@/api/backend";
import type { Project } from "@/types/project";
import { useProjectStore } from "./projectStore";

export type Screen = "picker" | "wizard" | "workspace";

interface AppState {
  currentScreen: Screen;
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;

  goToPicker: () => void;
  goToWizard: () => void;
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  setError: (e: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: "picker",
  currentProjectId: null,
  isLoading: false,
  error: null,

  goToPicker: () => set({ currentScreen: "picker", currentProjectId: null }),

  goToWizard: () => set({ currentScreen: "wizard" }),

  openProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project: Project = await backend.loadProject(id);
      useProjectStore.getState().setProject(project);
      set({ currentScreen: "workspace", currentProjectId: id, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  closeProject: () => {
    useProjectStore.getState().clear();
    set({ currentScreen: "picker", currentProjectId: null });
  },

  setError: (e) => set({ error: e }),
}));
