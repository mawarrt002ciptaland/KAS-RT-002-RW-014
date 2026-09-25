import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

/** POST /api/auth/login — validate credentials, return user (without password) */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }
    const hash = createHash("sha256").update(password).digest("hex");
    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.password !== hash) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }
    if (user.status !== "aktif") {
      return NextResponse.json({ error: "Akun nonaktif. Hubungi administrator." }, { status: 403 });
    }
    // update last login
    await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    return NextResponse.json({
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
      wargaId: user.wargaId,
      telepon: user.telepon,
      foto: user.foto,
    });
  } catch (e) {
    console.error("[api/auth/login]", e);
    return NextResponse.json({ error: "Gagal masuk" }, { status: 500 });
  }
}
