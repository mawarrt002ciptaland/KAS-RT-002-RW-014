import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

/** GET /api/auth/users — list all user accounts */
export async function GET() {
  try {
    const items = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, nama: true, role: true, wargaId: true, telepon: true, foto: true, status: true, lastLogin: true, createdAt: true },
    });
    return NextResponse.json({ items, count: items.length });
  } catch (e) {
    console.error("[api/auth/users GET]", e);
    return NextResponse.json({ error: "Gagal memuat daftar user" }, { status: 500 });
  }
}

/** POST /api/auth/users — create a new user account */
export async function POST(req: NextRequest) {
  try {
    const { email, password, nama, role, telepon, wargaId } = await req.json();
    if (!email || !password || !nama || !role) {
      return NextResponse.json({ error: "Email, password, nama, dan role wajib diisi" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });

    const user = await db.user.create({
      data: { email, password: hash(password), nama, role, telepon: telepon || null, wargaId: wargaId || null },
      select: { id: true, email: true, nama: true, role: true, telepon: true, status: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error("[api/auth/users POST]", e);
    return NextResponse.json({ error: "Gagal menambah user" }, { status: 500 });
  }
}
