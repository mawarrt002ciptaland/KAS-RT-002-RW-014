"use client";

import { formatTanggalID, relativeTime } from "@/lib/format";
import { EmptyState, CardSkeleton, StatusBadge } from "@/components/shared";
import { Megaphone } from "lucide-react";

interface Pengumuman { id: string; judul: string; konten: string; kategori: string; prioritas: string; tanggal: string }

export function WargaPengumuman({ data, loading }: { data?: Pengumuman[]; loading: boolean }) {
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-28" />)}</div>;
  if (!data || data.length === 0)
    return <EmptyState icon={<Megaphone className="h-6 w-6" />} title="Belum ada pengumuman" description="Pengumuman dari pengurus RT akan muncul di sini." />;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Pengumuman RT 002</h2>
      <div className="space-y-2">
        {data.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug">{p.judul}</p>
              <StatusBadge status={p.prioritas === "mendesak" ? "telat" : p.prioritas === "penting" ? "proses" : "aktif"} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.konten}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{formatTanggalID(p.tanggal)}</span>
              <span>{relativeTime(p.tanggal)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
