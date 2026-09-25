import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const wargaId = searchParams.get("wargaId") || undefined;
    const periode = searchParams.get("periode") || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (wargaId) where.wargaId = wargaId;
    if (periode) where.periode = periode;

    const items = await db.tagihan.findMany({
      where,
      include: { warga: true },
      orderBy: [{ status: "asc" }, { tanggalJatuhTempo: "desc" }],
    });

    const totalNominal = items.reduce((s, t) => s + (t.status !== "lunas" ? t.jumlah + (t.denda || 0) : 0), 0);
    const totalLunas = items.filter((t) => t.status === "lunas").length;
    const totalBelum = items.length - totalLunas;

    return NextResponse.json({ items, totalNominal, totalLunas, totalBelum, count: items.length });
  } catch (e) {
    console.error("[api/tagihan GET]", e);
    return NextResponse.json({ error: "Gagal memuat tagihan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wargaId, jenis, periode, jumlah, tanggalJatuhTempo, keterangan } = body;
    if (!wargaId || !jenis || !periode || !jumlah || !tanggalJatuhTempo) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    const count = await db.tagihan.count();
    const kode = `TAG-${periode.replace("-", "")}-${String(count + 1).padStart(4, "0")}`;
    const item = await db.tagihan.create({
      data: {
        kode,
        wargaId,
        jenis,
        periode,
        jumlah: parseInt(jumlah, 10),
        tanggalJatuhTempo: new Date(tanggalJatuhTempo),
        keterangan: keterangan || null,
      },
      include: { warga: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/tagihan POST]", e);
    return NextResponse.json({ error: "Gagal menyimpan tagihan" }, { status: 500 });
  }
}
