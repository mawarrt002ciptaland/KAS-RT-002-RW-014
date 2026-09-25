import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, tanggapan } = body;
    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (tanggapan !== undefined) data.tanggapan = tanggapan;
    const item = await db.pengaduan.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (e) {
    console.error("[api/pengaduan/[id] PATCH]", e);
    return NextResponse.json({ error: "Gagal memperbarui pengaduan" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.pengaduan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/pengaduan/[id] DELETE]", e);
    return NextResponse.json({ error: "Gagal menghapus pengaduan" }, { status: 500 });
  }
}
