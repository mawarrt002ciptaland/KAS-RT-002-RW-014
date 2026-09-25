import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const items = await db.kwitansi.findMany({
      include: { transaksi: true, tagihan: { include: { warga: true } }, warga: true },
      orderBy: { tanggal: "desc" },
      ...(limit ? { take: limit } : {}),
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[api/kwitansi GET]", e);
    return NextResponse.json({ error: "Gagal memuat kwitansi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transaksiId, nominal, penerima, pembayar, keterangan } = body;
    if (!nominal) return NextResponse.json({ error: "Nominal wajib" }, { status: 400 });
    const count = await db.kwitansi.count();
    const seq = String(count + 1).padStart(4, "0");
    const kode = `KWI-${new Date().getFullYear()}-${seq}`;
    const item = await db.kwitansi.create({
      data: {
        kode,
        transaksiId: transaksiId || null,
        tanggal: new Date(),
        nominal: parseInt(nominal, 10),
        penerima: penerima || "Bendahara RT 002",
        pembayar: pembayar || "Warga",
        keterangan: keterangan || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/kwitansi POST]", e);
    return NextResponse.json({ error: "Gagal membuat kwitansi" }, { status: 500 });
  }
}
