"use client";

import { useAppStore } from "@/lib/store";
import { Icon } from "@/components/shared/icon";
import { X, Bell, Check } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const NOTIFS = [
  { id: 1, icon: "ReceiptText", title: "3 Tagihan jatuh tempo hari ini", desc: "Tagihan iuran keamanan Agustus warga Mawar 06, 12, 18", time: "10 menit lalu", unread: true },
  { id: 2, icon: "MessageSquareWarning", title: "Aduan baru: Lampu jalan mati", desc: "Bapak Bayu J Putra melaporkan lampu jalan depan Mawar 08", time: "1 jam lalu", unread: true },
  { id: 3, icon: "Megaphone", title: "Pengumuman kerja bakti", desc: "Kerja bakti 24 Agustus 2026 pukul 07.00 WIB", time: "3 jam lalu", unread: true },
  { id: 4, icon: "Wallet", title: "Pemasukan Rp 500.000", desc: "Iuran bulanan warga telah diterima", time: "1 hari lalu", unread: false },
  { id: 5, icon: "CalendarDays", title: "Kegiatan mendatang", desc: "Pertemuan rutin warga 28 Agustus 2026", time: "2 hari lalu", unread: false },
];

export function NotificationSheet() {
  const { notifOpen, setNotifOpen } = useAppStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setNotifOpen]);

  return (
    <div className={cn("fixed inset-0 z-50", notifOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-black/50 transition-opacity", notifOpen ? "opacity-100" : "opacity-0")}
        onClick={() => setNotifOpen(false)}
      />
      <div
        className={cn(
          "absolute left-1/2 top-auto bottom-0 h-[85dvh] w-full max-w-md -translate-x-1/2 flex flex-col rounded-t-2xl bg-card shadow-2xl transition-transform duration-300 ease-out sm:left-auto sm:right-3 sm:top-3 sm:bottom-3 sm:translate-x-0 sm:rounded-2xl",
          notifOpen ? "translate-y-0 sm:translate-y-0" : "translate-y-full sm:translate-y-0 sm:opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Notifikasi"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 pt-safe">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Notifikasi</h3>
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">3</span>
          </div>
          <button
            onClick={() => setNotifOpen(false)}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-muted" />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          <button className="mb-2 flex w-full items-center justify-end gap-1 text-xs font-medium text-primary">
            <Check className="h-3.5 w-3.5" /> Tandai semua dibaca
          </button>
          <div className="flex flex-col gap-2">
            {NOTIFS.map((n) => (
              <div key={n.id} className={cn("flex items-start gap-3 rounded-xl border p-3", n.unread ? "bg-primary/5 border-primary/20" : "bg-card")}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", n.unread ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                  <Icon name={n.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{n.desc}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                </div>
                {n.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
