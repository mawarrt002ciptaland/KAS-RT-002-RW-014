"use client";

import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import type { MenuKey } from "@/lib/constants";
import { CardSkeleton } from "@/components/shared";

const loading = () => (
  <div className="space-y-4">
    <CardSkeleton className="h-16" />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-28" />)}
    </div>
    <CardSkeleton className="h-80" />
  </div>
);

const views: Record<MenuKey, React.ComponentType> = {
  dashboard: dynamic(() => import("../views/dashboard-view").then((m) => m.DashboardView), { ssr: false, loading }),
  pemasukan: dynamic(() => import("../views/transaksi-view").then((m) => ({ default: (m as any).PemasukanView })), { ssr: false, loading }),
  pengeluaran: dynamic(() => import("../views/transaksi-view").then((m) => ({ default: (m as any).PengeluaranView })), { ssr: false, loading }),
  tagihan: dynamic(() => import("../views/tagihan-view").then((m) => m.TagihanView), { ssr: false, loading }),
  warga: dynamic(() => import("../views/warga-view").then((m) => m.WargaView), { ssr: false, loading }),
  kegiatan: dynamic(() => import("../views/kegiatan-view").then((m) => m.KegiatanView), { ssr: false, loading }),
  kwitansi: dynamic(() => import("../views/kwitansi-view").then((m) => m.KwitansiView), { ssr: false, loading }),
  laporan: dynamic(() => import("../views/laporan-view").then((m) => m.LaporanView), { ssr: false, loading }),
  trafik: dynamic(() => import("../views/trafik-view").then((m) => m.TrafikView), { ssr: false, loading }),
  marketplace: dynamic(() => import("../views/marketplace-view").then((m) => m.MarketplaceView), { ssr: false, loading }),
  pengaduan: dynamic(() => import("../views/pengaduan-view").then((m) => m.PengaduanView), { ssr: false, loading }),
  pengumuman: dynamic(() => import("../views/pengumuman-view").then((m) => m.PengumumanView), { ssr: false, loading }),
  struktur: dynamic(() => import("../views/struktur-view").then((m) => m.StrukturView), { ssr: false, loading }),
  whatsapp: dynamic(() => import("../views/whatsapp-view").then((m) => m.WhatsappView), { ssr: false, loading }),
  tautan: dynamic(() => import("../views/tautan-view").then((m) => m.TautanView), { ssr: false, loading }),
  pengaturan: dynamic(() => import("../views/pengaturan-view").then((m) => m.PengaturanView), { ssr: false, loading }),
};

export function ViewRouter() {
  const { activeView } = useAppStore();
  const View = views[activeView] || views.dashboard;
  return <View />;
}
