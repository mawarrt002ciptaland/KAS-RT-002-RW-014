import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await db.tautan.findMany({ orderBy: { urutan: "asc" } });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[api/tautan GET]", e);
    return NextResponse.json({ error: "Gagal memuat tautan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, url, kategori, deskripsi } = body;
    if (!judul || !url) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    const item = await db.tautan.create({
      data: { judul, url, kategori: kategori || "Umum", deskripsi: deskripsi || null },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/tautan POST]", e);
    return NextResponse.json({ error: "Gagal menambah tautan" }, { status: 500 });
  }
}
