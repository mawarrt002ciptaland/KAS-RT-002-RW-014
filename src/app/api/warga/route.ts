import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const role = searchParams.get("role") || undefined;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { nama: { contains: q } },
        { noRumah: { contains: q } },
        { telepon: { contains: q } },
        { pekerjaan: { contains: q } },
      ];
    }
    const items = await db.warga.findMany({
      where,
      orderBy: { noRumah: "asc" },
    });
    const total = items.length;
    const kk = new Set(items.map((w) => w.noKK).filter(Boolean)).size;
    return NextResponse.json({ items, total, totalKK: kk });
  } catch (e) {
    console.error("[api/warga GET]", e);
    return NextResponse.json({ error: "Gagal memuat data warga" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, noRumah, telepon, pekerjaan, jenisKelamin, role, jabatan, alamat, blok, nik, noKK } = body;
    if (!nama || !noRumah) return NextResponse.json({ error: "Nama & no rumah wajib diisi" }, { status: 400 });
    const item = await db.warga.create({
      data: {
        nama,
        noRumah,
        blok: blok || "Mawar",
        telepon: telepon || null,
        pekerjaan: pekerjaan || null,
        jenisKelamin: jenisKelamin || "L",
        role: role || "warga",
        jabatan: jabatan || null,
        alamat: alamat || `${noRumah}, Blok Mawar, Ciptaland, Batam`,
        nik: nik || null,
        noKK: noKK || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/warga POST]", e);
    return NextResponse.json({ error: "Gagal menambah warga" }, { status: 500 });
  }
}
