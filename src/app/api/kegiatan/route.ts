import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await db.kegiatan.findMany({ orderBy: { tanggalMulai: "desc" } });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[api/kegiatan GET]", e);
    return NextResponse.json({ error: "Gagal memuat kegiatan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, deskripsi, kategori, tanggalMulai, tanggalSelesai, lokasi } = body;
    if (!judul || !tanggalMulai) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    const item = await db.kegiatan.create({
      data: {
        judul,
        deskripsi: deskripsi || "",
        kategori: kategori || "Sosial",
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
        lokasi: lokasi || null,
        status: "akan_datang",
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/kegiatan POST]", e);
    return NextResponse.json({ error: "Gagal menyimpan kegiatan" }, { status: 500 });
  }
}
