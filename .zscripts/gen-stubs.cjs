/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const dir = path.resolve("src/components/views");
const stubs = {
  "tagihan-view": { name: "TagihanView", title: "Tagihan Warga", desc: "Kelola tagihan iuran warga", icon: "ReceiptText" },
  "warga-view": { name: "WargaView", title: "Data Warga", desc: "Database kependudukan RT 002", icon: "Users" },
  "kegiatan-view": { name: "KegiatanView", title: "Kegiatan Warga", desc: "Agenda & kegiatan RT", icon: "CalendarDays" },
  "kwitansi-view": { name: "KwitansiView", title: "Kwitansi", desc: "Cetak & kelola kwitansi", icon: "FileText" },
  "laporan-view": { name: "LaporanView", title: "Laporan", desc: "Laporan keuangan & statistik", icon: "BarChart3" },
  "trafik-view": { name: "TrafikView", title: "Trafik Website", desc: "Statistik pengunjung website", icon: "Globe" },
  "marketplace-view": { name: "MarketplaceView", title: "Marketplace", desc: "Dagangan warga RT", icon: "ShoppingBag" },
  "pengaduan-view": { name: "PengaduanView", title: "Pengaduan Warga", desc: "Aduan & keluhan warga", icon: "MessageSquareWarning" },
  "pengumuman-view": { name: "PengumumanView", title: "Pengumuman", desc: "Pengumuman & info RT", icon: "Megaphone" },
  "struktur-view": { name: "StrukturView", title: "Struktur Pengurus RT 002", desc: "Struktur pengurus & koordinator", icon: "Network" },
  "whatsapp-view": { name: "WhatsappView", title: "WhatsApp Broadcast", desc: "Kirim broadcast WhatsApp warga", icon: "Send" },
  "tautan-view": { name: "TautanView", title: "Tautan & Kontak", desc: "Tautan & kontak penting", icon: "Link2" },
  "pengaturan-view": { name: "PengaturanView", title: "Pengaturan", desc: "Pengaturan sistem", icon: "Settings" },
};
for (const [file, s] of Object.entries(stubs)) {
  const content = `"use client";
import { PageHeader } from "@/components/shared";
import { ${s.icon} } from "lucide-react";
export function ${s.name}() {
  return <div className="space-y-4"><PageHeader title="${s.title}" description="${s.desc}" icon={<${s.icon} className="h-5 w-5" />} /><div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">Memuat modul ${s.title.toLowerCase()}...</div></div>;
}
`;
  fs.writeFileSync(path.join(dir, file + ".tsx"), content);
  console.log("created", file);
}
