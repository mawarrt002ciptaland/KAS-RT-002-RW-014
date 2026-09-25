"use client";

import { useAppStore } from "@/lib/store";
import { formatRupiah, formatTanggalID } from "@/lib/format";
import { StatusBadge, EmptyState, CardSkeleton } from "@/components/shared";
import { ReceiptText, Wallet } from "lucide-react";

interface Tagihan { id: string; kode: string; jenis: string; periode: string; jumlah: number; denda: number; status: string; tanggalJatuhTempo: string }

export function WargaTagihan({ data, loading }: { data?: Tagihan[]; loading: boolean }) {
  const { setWargaTab } = useAppStore();
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}</div>;
  if (!data || data.length === 0)
    return <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="Belum ada tagihan" description="Tagihan iuran Anda akan muncul di sini." />;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Tagihan Saya</h2>
      <div className="space-y-2">
        {data.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize">{t.jenis.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">Periode {t.periode}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">Jumlah</p>
                <p className="text-sm font-bold tabular-nums">{formatRupiah(t.jumlah + (t.denda || 0))}</p>
                {t.denda ? <p className="text-[11px] text-destructive">termasuk denda {formatRupiah(t.denda)}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">Jatuh tempo</p>
                <p className="text-xs font-medium">{formatTanggalID(t.tanggalJatuhTempo)}</p>
              </div>
            </div>
            {t.status !== "lunas" && (
              <button className="mt-3 w-full touch-target rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground">
                Bayar Sekarang
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
