import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.kegiatan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/kegiatan/[id] DELETE]", e);
    return NextResponse.json({ error: "Gagal menghapus kegiatan" }, { status: 500 });
  }
}
