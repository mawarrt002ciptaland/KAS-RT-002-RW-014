import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monthKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");
    const jenis = searchParams.get("jenis") || undefined;

    const where: Record<string, unknown> = {};
    if (dari && sampai) {
      where.tanggal = { gte: new Date(dari), lte: new Date(sampai + "T23:59:59") };
    }
    if (jenis) where.jenis = jenis;

    const transaksi = await db.transaksi.findMany({ where, orderBy: { tanggal: "asc" } });
    const pemasukan = transaksi.filter((t) => t.jenis === "pemasukan");
    const pengeluaran = transaksi.filter((t) => t.jenis === "pengeluaran");
    const totalPemasukan = pemasukan.reduce((s, t) => s + t.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((s, t) => s + t.nominal, 0);
    const saldo = totalPemasukan - totalPengeluaran;

    // Per kategori
    const katMap = new Map<string, { pemasukan: number; pengeluaran: number; count: number }>();
    for (const t of transaksi) {
      const k = t.kategori;
      const cur = katMap.get(k) || { pemasukan: 0, pengeluaran: 0, count: 0 };
      if (t.jenis === "pemasukan") cur.pemasukan += t.nominal;
      else cur.pengeluaran += t.nominal;
      cur.count += 1;
      katMap.set(k, cur);
    }
    const perKategori = Array.from(katMap.entries()).map(([kategori, v]) => ({ kategori, ...v }));

    // Per bulan
    const bulanMap = new Map<string, { pemasukan: number; pengeluaran: number }>();
    for (const t of transaksi) {
      const k = monthKey(t.tanggal);
      const cur = bulanMap.get(k) || { pemasukan: 0, pengeluaran: 0 };
      if (t.jenis === "pemasukan") cur.pemasukan += t.nominal;
      else cur.pengeluaran += t.nominal;
      bulanMap.set(k, cur);
    }
    const perBulan = Array.from(bulanMap.entries())
      .map(([periode, v]) => ({ periode, ...v }))
      .sort((a, b) => a.periode.localeCompare(b.periode));

    // Tagihan stats
    const tagihanStats = await db.tagihan.groupBy({
      by: ["status"],
      _count: true,
      _sum: { jumlah: true },
    });

    return NextResponse.json({
      periode: { dari, sampai },
      transaksi,
      totalPemasukan,
      totalPengeluaran,
      saldo,
      jumlahTransaksi: transaksi.length,
      perKategori,
      perBulan,
      tagihanStats,
    });
  } catch (e) {
    console.error("[api/laporan GET]", e);
    return NextResponse.json({ error: "Gagal memuat laporan" }, { status: 500 });
  }
}
