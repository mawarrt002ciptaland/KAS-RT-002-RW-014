import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await db.pengaturan.findMany();
    const map: Record<string, string> = {};
    for (const p of items) map[p.key] = p.value;
    return NextResponse.json({ settings: map, items });
  } catch (e) {
    console.error("[api/pengaturan GET]", e);
    return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    // body is { key: value, ... }
    for (const [key, value] of Object.entries(body)) {
      const existing = await db.pengaturan.findUnique({ where: { key } });
      if (existing) {
        await db.pengaturan.update({ where: { key }, data: { value: String(value) } });
      } else {
        await db.pengaturan.create({ data: { key, value: String(value), kategori: "umum" } });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/pengaturan PATCH]", e);
    return NextResponse.json({ error: "Gagal memperbarui pengaturan" }, { status: 500 });
  }
}
