import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kategori = searchParams.get("kategori") || undefined;
    const q = searchParams.get("q") || undefined;
    const where: Record<string, unknown> = { status: "tersedia" };
    if (kategori && kategori !== "Semua") where.kategori = kategori;
    if (q) {
      where.OR = [{ nama: { contains: q } }, { deskripsi: { contains: q } }, { penjual: { contains: q } }];
    }
    const items = await db.marketplace.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[api/marketplace GET]", e);
    return NextResponse.json({ error: "Gagal memuat marketplace" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, kategori, harga, deskripsi, penjual, telepon, kondisi, fotoUrl } = body;
    if (!nama || !harga || !penjual || !telepon) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    const item = await db.marketplace.create({
      data: {
        nama,
        kategori: kategori || "Lainnya",
        harga: parseInt(harga, 10),
        deskripsi: deskripsi || "",
        penjual,
        telepon,
        kondisi: kondisi || "baru",
        fotoUrl: fotoUrl || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/marketplace POST]", e);
    return NextResponse.json({ error: "Gagal menambah item" }, { status: 500 });
  }
}
