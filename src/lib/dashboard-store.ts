"use client";

import { create } from "zustand";

export type DashboardSection = "home" | "projects" | "templates" | "analytics" | "settings";
export type HomePanel = "overview" | "transcript" | "script" | "edit-plan" | "quality" | "exports";

type DashboardState = {
  activeSection: DashboardSection;
  activeHomePanel: HomePanel;
  createProjectOpen: boolean;
  setActiveHomePanel: (panel: HomePanel) => void;
  setActiveSection: (section: DashboardSection) => void;
  setCreateProjectOpen: (open: boolean) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  activeSection: "home",
  activeHomePanel: "overview",
  createProjectOpen: false,
  setActiveHomePanel: (activeHomePanel) => set({ activeHomePanel }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setCreateProjectOpen: (createProjectOpen) => set({ createProjectOpen }),
}));
