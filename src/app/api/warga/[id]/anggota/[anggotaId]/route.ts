import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** DELETE /api/warga/[id]/anggota/[anggotaId] — remove a family member */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; anggotaId: string }> }) {
  try {
    const { anggotaId } = await params;
    await db.anggotaKK.delete({ where: { id: anggotaId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/warga/[id]/anggota/[anggotaId] DELETE]", e);
    return NextResponse.json({ error: "Gagal menghapus anggota" }, { status: 500 });
  }
}
