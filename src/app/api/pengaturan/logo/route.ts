import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/pengaturan/logo — brand settings for header (logo_url, nama_rt, blok, kota) */
export async function GET() {
  try {
    const items = await db.pengaturan.findMany({
      where: { key: { in: ["logo_url", "nama_rt", "rw", "perumahan", "kota", "blok"] } },
    });
    const map: Record<string, string> = {};
    for (const p of items) map[p.key] = p.value;
    return NextResponse.json({
      logoUrl: map.logo_url || "",
      namaRT: map.nama_rt || "RT 002",
      rw: map.rw || "014",
      perumahan: map.perumahan || "Ciptaland",
      kota: map.kota || "Batam",
      blok: map.blok || "Mawar",
    });
  } catch (e) {
    console.error("[api/pengaturan/logo]", e);
    return NextResponse.json({ error: "Gagal memuat logo" }, { status: 500 });
  }
}
