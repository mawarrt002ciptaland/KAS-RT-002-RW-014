"use client";

import { Sidebar, MobileDrawer } from "@/components/shell/sidebar";
import { TopHeader } from "@/components/shell/top-header";
import { SearchOverlay } from "@/components/shell/search-overlay";
import { NotificationSheet } from "@/components/shell/notification-sheet";
import { QuickActionsSheet } from "@/components/shell/quick-actions-sheet";
import { ViewRouter } from "@/components/shell/view-router";
import { useAppStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";

export function AppShell() {
  const { role } = useAppStore();
  return role === "warga" ? <WargaShell /> : <AdminShell />;
}

function AdminShell() {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <MobileDrawer />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader />
        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-6">
          <div className="mx-auto w-full max-w-7xl">
            <ViewRouter />
          </div>
        </main>
        <Footer />
      </div>
      <SearchOverlay />
      <NotificationSheet />
      <QuickActionsSheet />
    </div>
  );
}

function Footer() {
  const mounted = useMounted();
  const year = mounted ? new Date().getFullYear() : 2026;
  return (
    <footer className="mt-auto border-t bg-muted/30 px-4 py-4 pb-safe text-center text-xs text-muted-foreground">
      <p className="font-medium">Sistem Informasi RT 002 — Blok Mawar • Ciptaland Batam</p>
      <p className="mt-1">© {year} Pengurus RT 002 RW 014. Digital Operating System Warga.</p>
    </footer>
  );
}

// Warga shell - uses bottom navigation
function WargaShell() {
  return <WargaApp />;
}

import { WargaApp } from "@/components/shell/warga-app";
