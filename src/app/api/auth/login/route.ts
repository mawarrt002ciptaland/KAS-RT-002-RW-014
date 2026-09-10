import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, warga } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username/NIK dan password wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedUser = username.trim();

    // Check user by username OR nik
    const foundUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.username, trimmedUser), eq(users.nik, trimmedUser)))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan. Pastikan Username atau NIK benar." },
        { status: 401 }
      );
    }

    const user = foundUsers[0];

    // Check password
    if (user.password !== password) {
      return NextResponse.json(
        { error: "Password salah. Silakan coba lagi." },
        { status: 401 }
      );
    }

    // Return user info
    const safeUser = {
      id: user.id,
      nik: user.nik,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      houseNumber: user.houseNumber,
      avatar: user.avatar,
    };

    const res = NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: safeUser,
    });

    // Set cookie for session persistence
    res.cookies.set("kas_rt_user", JSON.stringify(safeUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat login" },
      { status: 500 }
    );
  }
}
