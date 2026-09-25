import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jenis = searchParams.get("jenis") || undefined;
    const kategori = searchParams.get("kategori") || undefined;
    const q = searchParams.get("q") || undefined;
    const limit = parseInt(searchParams.get("limit") || "0", 10);

    const where: Record<string, unknown> = {};
    if (jenis) where.jenis = jenis;
    if (kategori) where.kategori = kategori;
    if (q) {
      where.OR = [
        { keterangan: { contains: q } },
        { kode: { contains: q } },
        { penerima: { contains: q } },
        { sumber: { contains: q } },
      ];
    }

    const items = await db.transaksi.findMany({
      where,
      orderBy: { tanggal: "desc" },
      ...(limit ? { take: limit } : {}),
    });

    const total = await db.transaksi.aggregate({
      where: { ...where, jenis: jenis ?? undefined },
      _sum: { nominal: true },
    });

    return NextResponse.json({
      items,
      total: total._sum.nominal ?? 0,
      count: items.length,
    });
  } catch (e) {
    console.error("[api/transaksi GET]", e);
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jenis, kategori, keterangan, nominal, tanggal, penerima, sumber, metode, buktiUrl } = body;
    if (!jenis || !kategori || !keterangan || !nominal || !tanggal) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    const count = await db.transaksi.count();
    const seq = String(count + 1).padStart(3, "0");
    const tgl = new Date(tanggal);
    const kode = `TRX-${jenis === "pemasukan" ? "PEM" : "PENG"}-${tgl.getFullYear()}${String(tgl.getMonth() + 1).padStart(2, "0")}-${seq}`;

    const trx = await db.transaksi.create({
      data: {
        kode,
        jenis,
        kategori,
        keterangan,
        nominal: parseInt(nominal, 10),
        tanggal: tgl,
        penerima: penerima || null,
        sumber: sumber || null,
        metode: metode || "Tunai",
        buktiUrl: buktiUrl || null,
        status: "selesai",
      },
    });

    // auto-create kwitansi
    await db.kwitansi.create({
      data: {
        kode: `KWI-${tgl.getFullYear()}-${seq}`,
        transaksiId: trx.id,
        tanggal: trx.tanggal,
        nominal: trx.nominal,
        penerima: trx.penerima || trx.sumber || "Bendahara RT 002",
        pembayar: "Warga RT 002",
        keterangan: trx.keterangan,
      },
    });

    return NextResponse.json(trx, { status: 201 });
  } catch (e) {
    console.error("[api/transaksi POST]", e);
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
