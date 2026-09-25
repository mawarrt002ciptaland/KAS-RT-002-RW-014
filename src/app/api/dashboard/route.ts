import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monthKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [pemasukan, pengeluaran, tagihanBelum, tagihanTelat, recent, pengeluaranKategori] = await Promise.all([
      db.transaksi.aggregate({ where: { jenis: "pemasukan" }, _sum: { nominal: true } }),
      db.transaksi.aggregate({ where: { jenis: "pengeluaran" }, _sum: { nominal: true } }),
      db.tagihan.count({ where: { status: "belum_bayar" } }),
      db.tagihan.count({ where: { status: "telat" } }),
      db.transaksi.findMany({ take: 6, orderBy: { tanggal: "desc" } }),
      db.transaksi.findMany({ where: { jenis: "pengeluaran" }, select: { kategori: true, nominal: true } }),
    ]);

    const totalPemasukan = pemasukan._sum.nominal ?? 0;
    const totalPengeluaran = pengeluaran._sum.nominal ?? 0;
    const saldo = totalPemasukan - totalPengeluaran;

    const now = new Date();
    const months: { key: string; label: string; pemasukan: number; pengeluaran: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const label = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][d.getMonth()];
      months.push({ key, label, pemasukan: 0, pengeluaran: 0 });
    }
    const allTransaksi = await db.transaksi.findMany({ select: { jenis: true, nominal: true, tanggal: true } });
    for (const t of allTransaksi) {
      const k = monthKey(t.tanggal);
      const m = months.find((x) => x.key === k);
      if (m) {
        if (t.jenis === "pemasukan") m.pemasukan += t.nominal;
        else m.pengeluaran += t.nominal;
      }
    }

    const kategoriMap = new Map<string, number>();
    for (const t of pengeluaranKategori) {
      kategoriMap.set(t.kategori, (kategoriMap.get(t.kategori) ?? 0) + t.nominal);
    }
    const expenseByCategory = Array.from(kategoriMap.entries())
      .map(([kategori, nominal]) => ({ kategori, nominal, percent: totalPengeluaran ? Math.round((nominal / totalPengeluaran) * 100) : 0 }))
      .sort((a, b) => b.nominal - a.nominal);

    return NextResponse.json({
      saldo,
      totalPemasukan,
      totalPengeluaran,
      tagihanBelumLunas: tagihanBelum + tagihanTelat,
      tagihanTelat,
      recentTransaksi: recent,
      cashFlow: months.map((m) => ({ label: m.label, pemasukan: m.pemasukan, pengeluaran: m.pengeluaran })),
      expenseByCategory,
    });
  } catch (e) {
    console.error("[api/dashboard] error", e);
    return NextResponse.json({ error: "Gagal memuat dashboard" }, { status: 500 });
  }
}
