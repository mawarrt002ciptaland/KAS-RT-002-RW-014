import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await db.pengurus.update({ where: { id }, data: body });
    return NextResponse.json(item);
  } catch (e) {
    console.error("[api/pengurus/[id] PATCH]", e);
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.pengurus.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/pengurus/[id] DELETE]", e);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
