import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await db.pengumuman.findMany({ orderBy: { tanggal: "desc" } });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[api/pengumuman GET]", e);
    return NextResponse.json({ error: "Gagal memuat pengumuman" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, konten, kategori, prioritas } = body;
    if (!judul || !konten) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    const item = await db.pengumuman.create({
      data: {
        judul,
        konten,
        kategori: kategori || "Umum",
        prioritas: prioritas || "normal",
        status: "aktif",
        penulis: "Admin RT 002",
        tanggal: new Date(),
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/pengumuman POST]", e);
    return NextResponse.json({ error: "Gagal menyimpan pengumuman" }, { status: 500 });
  }
}
