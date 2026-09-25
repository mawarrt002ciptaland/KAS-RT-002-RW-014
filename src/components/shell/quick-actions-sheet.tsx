"use client";

import { useAppStore } from "@/lib/store";
import { Icon } from "@/components/shared/icon";
import { X, Plus, Megaphone, MessageSquareWarning } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { icon: "TrendingUp", label: "Catat Pemasukan", view: "pemasukan" as const, tone: "success" },
  { icon: "TrendingDown", label: "Catat Pengeluaran", view: "pengeluaran" as const, tone: "danger" },
  { icon: "Users", label: "Tambah Warga", view: "warga" as const, tone: "primary" },
  { icon: "ReceiptText", label: "Buat Tagihan", view: "tagihan" as const, tone: "info" },
  { icon: "Megaphone", label: "Pengumuman", view: "pengumuman" as const, tone: "primary" },
  { icon: "MessageSquareWarning", label: "Aduan Warga", view: "pengaduan" as const, tone: "danger" },
];

const toneClass: Record<string, string> = {
  success: "bg-success/15 text-success",
  danger: "bg-destructive/10 text-destructive",
  primary: "bg-primary/10 text-primary",
  info: "bg-info/15 text-info",
};

export function QuickActionsSheet() {
  const { quickOpen, setQuickOpen, setActiveView } = useAppStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setQuickOpen]);

  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", quickOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-black/50 transition-opacity", quickOpen ? "opacity-100" : "opacity-0")}
        onClick={() => setQuickOpen(false)}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 rounded-t-2xl bg-card shadow-2xl pb-safe transition-transform duration-300 ease-out",
          quickOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Aksi cepat"
      >
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-muted" />
        </div>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Plus className="h-5 w-5 text-primary" /> Aksi Cepat
          </h3>
          <button
            onClick={() => setQuickOpen(false)}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => { setActiveView(a.view); setQuickOpen(false); }}
              className="card-hover flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center hover:border-primary/40"
            >
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", toneClass[a.tone])}>
                <Icon name={a.icon} className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
