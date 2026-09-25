import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Warga-facing dashboard: tagihan saya, pengumuman terbaru, aduan saya, saldo ringkas, kegiatan
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wargaId = searchParams.get("wargaId") || undefined;

    const [pengumuman, kegiatan, pengaduan, tagihanSaya, totalWarga, saldoInfo] = await Promise.all([
      db.pengumuman.findMany({ where: { status: "aktif" }, orderBy: { tanggal: "desc" }, take: 5 }),
      db.kegiatan.findMany({ where: { status: "akan_datang" }, orderBy: { tanggalMulai: "asc" }, take: 5 }),
      wargaId ? db.pengaduan.findMany({ where: { wargaId }, orderBy: { createdAt: "desc" }, take: 10 }) : db.pengaduan.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      wargaId ? db.tagihan.findMany({ where: { wargaId }, include: { warga: true }, orderBy: { tanggalJatuhTempo: "asc" } }) : [],
      db.warga.count(),
      (async () => {
        const [p, g] = await Promise.all([
          db.transaksi.aggregate({ where: { jenis: "pemasukan" }, _sum: { nominal: true } }),
          db.transaksi.aggregate({ where: { jenis: "pengeluaran" }, _sum: { nominal: true } }),
        ]);
        return { saldo: (p._sum.nominal ?? 0) - (g._sum.nominal ?? 0) };
      })(),
    ]);

    const totalTunggakan = tagihanSaya
      .filter((t) => t.status !== "lunas")
      .reduce((s, t) => s + t.jumlah + (t.denda || 0), 0);
    const totalLunas = tagihanSaya.filter((t) => t.status === "lunas").length;
    const totalBelum = tagihanSaya.length - totalLunas;

    return NextResponse.json({
      pengumuman,
      kegiatan,
      pengaduan,
      tagihanSaya,
      totalTunggakan,
      totalLunas,
      totalBelum,
      totalWarga,
      saldoRT: saldoInfo.saldo,
    });
  } catch (e) {
    console.error("[api/warga-dashboard GET]", e);
    return NextResponse.json({ error: "Gagal memuat dashboard warga" }, { status: 500 });
  }
}
