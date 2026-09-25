"use client";

import { useAppStore } from "@/lib/store";
import { MENU_ITEMS } from "@/lib/constants";
import { Icon } from "@/components/shared/icon";
import { Search, X, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: string;
  title: string;
  subtitle?: string;
  view: string;
  icon: string;
}

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, setActiveView } = useAppStore();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  if (!searchOpen) return null;

  // Quick suggestions - menu items + quick data categories
  const suggestions: SearchResult[] = MENU_ITEMS.map((m) => ({
    type: "Menu",
    title: m.label,
    subtitle: m.description,
    view: m.key,
    icon: m.icon,
  }));

  const filtered = q
    ? suggestions.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()) || (s.subtitle ?? "").toLowerCase().includes(q.toLowerCase()))
    : suggestions;

  const quickData = q
    ? []
    : [
        { type: "Data", title: "Cari Warga", subtitle: "Berdasarkan nama / rumah", view: "warga", icon: "Users" },
        { type: "Data", title: "Cari Transaksi", subtitle: "Pemasukan & pengeluaran", view: "pemasukan", icon: "Coins" },
        { type: "Data", title: "Cari Tagihan", subtitle: "Status pembayaran warga", view: "tagihan", icon: "ReceiptText" },
        { type: "Data", title: "Cari Pengumuman", subtitle: "Info & pengumuman RT", view: "pengumuman", icon: "Megaphone" },
        { type: "Data", title: "Cari Aduan", subtitle: "Aduan warga", view: "pengaduan", icon: "MessageSquareWarning" },
        { type: "Data", title: "Cari Kegiatan", subtitle: "Agenda RT", view: "kegiatan", icon: "CalendarDays" },
      ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50" role="dialog" aria-modal="true" aria-label="Pencarian global">
      <div className="mx-auto mt-0 w-full max-w-2xl bg-background shadow-2xl">
        <div className="flex items-center gap-2 border-b px-3 py-3 pt-safe">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari menu, warga, transaksi, tagihan..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Tutup pencarian"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-64px)] overflow-y-auto scrollbar-thin p-3">
          {!q && quickData.length > 0 && (
            <>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pencarian Cepat</p>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {quickData.map((s) => (
                  <ResultCard key={s.title} item={s} onClick={() => { setActiveView(s.view as never); setSearchOpen(false); }} />
                ))}
              </div>
            </>
          )}
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
          <div className="flex flex-col gap-1">
            {filtered.map((s) => (
              <button
                key={s.title}
                onClick={() => { setActiveView(s.view as never); setSearchOpen(false); }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon name={s.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.title}</span>
                  {s.subtitle && <span className="block truncate text-xs text-muted-foreground">{s.subtitle}</span>}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">Tidak ada hasil untuk "{q}"</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ item, onClick }: { item: SearchResult; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card-hover flex flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left hover:border-primary/40">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon name={item.icon} className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium leading-tight">{item.title}</span>
      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
    </button>
  );
}

export { cn };
