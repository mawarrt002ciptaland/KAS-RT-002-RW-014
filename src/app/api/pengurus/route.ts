import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await db.pengurus.findMany({ orderBy: { urutan: "asc" } });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[api/pengurus GET]", e);
    return NextResponse.json({ error: "Gagal memuat pengurus" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, jabatan, telepon, email, bidang, urutan } = body;
    if (!nama || !jabatan) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    const item = await db.pengurus.create({
      data: { nama, jabatan, telepon: telepon || null, email: email || null, bidang: bidang || null, urutan: urutan || 0 },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/pengurus POST]", e);
    return NextResponse.json({ error: "Gagal menambah pengurus" }, { status: 500 });
  }
}
