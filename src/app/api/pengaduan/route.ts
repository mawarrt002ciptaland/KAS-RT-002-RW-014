import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await db.pengaduan.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[api/pengaduan GET]", e);
    return NextResponse.json({ error: "Gagal memuat pengaduan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, deskripsi, kategori, lokasi, fotoUrl, pelapor } = body;
    if (!judul || !deskripsi || !kategori) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    const count = await db.pengaduan.count();
    const kode = `ADU-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    const item = await db.pengaduan.create({
      data: {
        kode,
        judul,
        deskripsi,
        kategori,
        lokasi: lokasi || null,
        fotoUrl: fotoUrl || null,
        status: "baru",
        pelapor: pelapor || "Warga",
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/pengaduan POST]", e);
    return NextResponse.json({ error: "Gagal menyimpan pengaduan" }, { status: 500 });
  }
}
