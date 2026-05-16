/**
 * State for the currently opened project (Sprint 0: read-only display).
 * Sprint 1+ will add mappings, handlers, selection state.
 */
import { create } from "zustand";
import type { Project } from "@/types/project";

interface ProjectState {
  project: Project | null;
  selectedObjectFullName: string | null;
  setProject: (p: Project) => void;
  setSelectedObject: (fullName: string | null) => void;
  clear: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  selectedObjectFullName: null,
  setProject: (p) => set({ project: p, selectedObjectFullName: null }),
  setSelectedObject: (fullName) => set({ selectedObjectFullName: fullName }),
  clear: () => set({ project: null, selectedObjectFullName: null }),
}));
