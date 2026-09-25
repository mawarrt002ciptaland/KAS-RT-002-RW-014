"use client";

import { useAppStore } from "@/lib/store";
import { MENU_LABEL } from "@/lib/constants";
import { Icon } from "@/components/shared/icon";
import { useTheme } from "next-themes";
import { Menu, Search, Bell, Plus, ChevronDown, User } from "lucide-react";
import { useEffect } from "react";

export function TopHeader() {
  const { activeView, setDrawerOpen, setSearchOpen, setNotifOpen, setQuickOpen } = useAppStore();
  const { theme, setTheme } = useTheme();

  // Escape closes search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        {/* Hamburger (mobile/tablet) */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="touch-target flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo compact (mobile) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-xs font-bold">RT</span>
          </div>
        </div>

        {/* Page title (desktop) */}
        <div className="hidden min-w-0 flex-1 lg:block">
          <h1 className="truncate text-lg font-bold">{MENU_LABEL[activeView]}</h1>
        </div>

        {/* Spacer for mobile */}
        <div className="flex-1 lg:hidden" />

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="touch-target flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-2 text-muted-foreground hover:bg-muted sm:px-3"
          aria-label="Cari data"
        >
          <Search className="h-4 w-4" />
          <span className="hidden text-sm sm:inline">Cari data...</span>
        </button>

        {/* Quick action (mobile) */}
        <button
          onClick={() => setQuickOpen(true)}
          className="touch-target flex items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90 lg:hidden"
          aria-label="Aksi cepat"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="touch-target hidden items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted sm:flex"
          aria-label="Ganti tema"
        >
          <Icon name={theme === "dark" ? "Sun" : "Moon"} className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => setNotifOpen(true)}
          className="touch-target relative flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>

        {/* Avatar */}
        <button className="touch-target flex items-center gap-2 rounded-full border bg-card p-0.5 pr-2 hover:bg-muted sm:pr-3" aria-label="Akun">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            <User className="h-4 w-4" />
          </span>
          <span className="hidden text-xs font-medium sm:inline">Admin RT</span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline" />
        </button>
      </div>
    </header>
  );
}
