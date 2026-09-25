import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.kwitansi.deleteMany({ where: { transaksiId: id } });
    await db.transaksi.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/transaksi/[id] DELETE]", e);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.transaksi.findUnique({ where: { id }, include: { warga: true } });
    if (!item) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    return NextResponse.json(item);
  } catch (e) {
    console.error("[api/transaksi/[id] GET]", e);
    return NextResponse.json({ error: "Gagal memuat" }, { status: 500 });
  }
}
