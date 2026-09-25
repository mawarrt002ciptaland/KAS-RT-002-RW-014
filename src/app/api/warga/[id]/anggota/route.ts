import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/warga/[id]/anggota — list family members (AnggotaKK) for a warga */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const items = await db.anggotaKK.findMany({
      where: { wargaId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ items, count: items.length });
  } catch (e) {
    console.error("[api/warga/[id]/anggota GET]", e);
    return NextResponse.json({ error: "Gagal memuat anggota KK" }, { status: 500 });
  }
}

/** POST /api/warga/[id]/anggota — add a family member */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { nama, nik, jenisKelamin, hubungan, tanggalLahir } = await req.json();
    if (!nama) return NextResponse.json({ error: "Nama anggota wajib diisi" }, { status: 400 });
    const item = await db.anggotaKK.create({
      data: {
        wargaId: id,
        nama,
        nik: nik || null,
        jenisKelamin: jenisKelamin || "L",
        hubungan: hubungan || "Anggota",
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("[api/warga/[id]/anggota POST]", e);
    return NextResponse.json({ error: "Gagal menambah anggota" }, { status: 500 });
  }
}
