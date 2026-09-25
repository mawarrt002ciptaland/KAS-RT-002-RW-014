"use client";

import { useAppStore } from "@/lib/store";
import { MENU_ITEMS, RT_INFO } from "@/lib/constants";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Home, Sparkles } from "lucide-react";

export function Sidebar() {
  const { activeView, setActiveView, role, setRole } = useAppStore();
  const utama = MENU_ITEMS.filter((m) => m.group === "utama");
  const org = MENU_ITEMS.filter((m) => m.group === "organisasi");

  return (
    <aside className="hidden h-dvh w-[260px] shrink-0 flex-col border-r bg-sidebar lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Home className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">Sistem Informasi RT 002</p>
          <p className="truncate text-xs text-muted-foreground">Blok Mawar • Ciptaland</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-3">
          <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu Utama</p>
          {utama.map((m) => (
            <NavBtn key={m.key} item={m} active={activeView === m.key} onClick={() => setActiveView(m.key)} />
          ))}
          <p className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organisasi & Sistem</p>
          {org.map((m) => (
            <NavBtn key={m.key} item={m} active={activeView === m.key} onClick={() => setActiveView(m.key)} />
          ))}
        </nav>
      </ScrollArea>

      {/* Role switcher */}
      <div className="border-t p-3">
        <button
          onClick={() => setRole(role === "admin" ? "warga" : "admin")}
          className="flex w-full items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/15"
        >
          <Sparkles className="h-4 w-4" />
          <span className="flex-1">Mode {role === "admin" ? "Warga" : "Admin"}</span>
        </button>
        <p className="mt-2 px-2 text-[11px] text-muted-foreground">{RT_INFO.namaLengkap}</p>
      </div>
    </aside>
  );
}

function NavBtn({
  item,
  active,
  onClick,
}: {
  item: (typeof MENU_ITEMS)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      <Icon name={item.icon} className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="flex-1 truncate font-medium">{item.label}</span>
      {active && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
    </button>
  );
}

/** Mobile drawer - reuses the same menu */
export function MobileDrawer() {
  const { drawerOpen, setDrawerOpen, activeView, setActiveView, role, setRole } = useAppStore();
  const utama = MENU_ITEMS.filter((m) => m.group === "utama");
  const org = MENU_ITEMS.filter((m) => m.group === "organisasi");

  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", drawerOpen ? "pointer-events-auto" : "pointer-events-none")}>
      {/* Overlay */}
      <div
        className={cn("absolute inset-0 bg-black/50 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      {/* Drawer - slide from left */}
      <div
        className={cn(
          "absolute left-0 top-0 h-dvh w-[280px] max-w-[85vw] flex flex-col bg-sidebar shadow-xl transition-transform duration-300 ease-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-4 pt-safe">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">RT 002 Mawar</p>
              <p className="truncate text-xs text-muted-foreground">Ciptaland Batam</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-3">
            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu Utama</p>
            {utama.map((m) => (
              <NavBtn key={m.key} item={m} active={activeView === m.key} onClick={() => setActiveView(m.key)} />
            ))}
            <p className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organisasi & Sistem</p>
            {org.map((m) => (
              <NavBtn key={m.key} item={m} active={activeView === m.key} onClick={() => setActiveView(m.key)} />
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t p-3 pb-safe">
          <button
            onClick={() => {
              setRole(role === "admin" ? "warga" : "admin");
              setDrawerOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary"
          >
            <Sparkles className="h-4 w-4" />
            <span className="flex-1">Mode {role === "admin" ? "Warga" : "Admin"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
