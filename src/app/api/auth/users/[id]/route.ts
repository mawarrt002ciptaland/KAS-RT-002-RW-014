import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** PATCH /api/auth/users/[id] — update user (role, status, telepon, nama; password optional) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of ["nama", "role", "telepon", "status", "wargaId", "foto"]) {
      if (body[k] !== undefined) data[k] = body[k] === "" ? null : body[k];
    }
    // password change (hashed) — optional
    if (body.password) {
      if (typeof body.password !== "string" || body.password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      const { createHash } = await import("crypto");
      data.password = createHash("sha256").update(body.password).digest("hex");
    }
    const user = await db.user.update({ where: { id }, data, select: { id: true, email: true, nama: true, role: true, telepon: true, status: true } });
    return NextResponse.json(user);
  } catch (e) {
    console.error("[api/auth/users/[id] PATCH]", e);
    return NextResponse.json({ error: "Gagal memperbarui user" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/auth/users/[id] DELETE]", e);
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}
