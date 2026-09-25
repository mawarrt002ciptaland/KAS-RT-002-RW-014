"use client";

import { create } from "zustand";
import type { MenuKey } from "@/lib/constants";

export type UserRole = "admin" | "pengurus" | "warga";

interface AppState {
  // Role-based shell
  role: UserRole;
  setRole: (r: UserRole) => void;

  // Navigation (admin/pengurus)
  activeView: MenuKey;
  setActiveView: (v: MenuKey) => void;

  // Mobile drawer
  drawerOpen: boolean;
  setDrawerOpen: (b: boolean) => void;

  // Warga bottom nav
  wargaTab: "home" | "tagihan" | "pengumuman" | "aduan" | "profil";
  setWargaTab: (t: AppState["wargaTab"]) => void;

  // Search overlay
  searchOpen: boolean;
  setSearchOpen: (b: boolean) => void;

  // Notification sheet
  notifOpen: boolean;
  setNotifOpen: (b: boolean) => void;

  // Quick action sheet (mobile)
  quickOpen: boolean;
  setQuickOpen: (b: boolean) => void;

  // Sidebar collapsed (desktop)
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: "admin",
  setRole: (role) => set({ role }),

  activeView: "dashboard",
  setActiveView: (activeView) => set({ activeView, drawerOpen: false }),

  drawerOpen: false,
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),

  wargaTab: "home",
  setWargaTab: (wargaTab) => set({ wargaTab }),

  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),

  notifOpen: false,
  setNotifOpen: (notifOpen) => set({ notifOpen }),

  quickOpen: false,
  setQuickOpen: (quickOpen) => set({ quickOpen }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
