import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { eq } from "drizzle-orm";

const FALLBACK_PENGURUS = [
  { id: 1, nama: "Eka Rista Yudhistira, ST.", jabatan: "Ketua RT", periode: "2026 - 2031", isCurrent: "true", noHp: "+62 821-7129-9984", noRumah: "M-01", fotoUrl: "", catatan: "Masa tugas 5 tahun", urutan: 1, createdAt: new Date().toISOString() },
  { id: 2, nama: "Neny Melsya, S.Sp.", jabatan: "Bendahara", periode: "2026 - 2031", isCurrent: "true", noHp: "082173735449", noRumah: "M-02", fotoUrl: "", catatan: "Masa tugas 5 tahun", urutan: 2, createdAt: new Date().toISOString() },
  { id: 3, nama: "Sekretaris RT 002", jabatan: "Sekretaris", periode: "2026 - 2031", isCurrent: "true", noHp: "", noRumah: "", fotoUrl: "", catatan: "Masa tugas 5 tahun", urutan: 3, createdAt: new Date().toISOString() },
  { id: 4, nama: "Korlap Blok Mawar", jabatan: "Koordinator Lapangan", periode: "2026 - 2031", isCurrent: "true", noHp: "", noRumah: "", fotoUrl: "", catatan: "", urutan: 4, createdAt: new Date().toISOString() },
  { id: 5, nama: "Bambang Sudik Pamarto", jabatan: "Mantan Ketua RT", periode: "2021 - 2026", isCurrent: "false", noHp: "081234567890", noRumah: "M-01", fotoUrl: "", catatan: "Ketua RT periode sebelumnya", urutan: 10, createdAt: new Date().toISOString() },
];

export async function GET() {
  try {
    const rows = await db.select().from(pengurus);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ pengurus: FALLBACK_PENGURUS, source: "fallback-empty" });
    }
    const sorted = [...rows].sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0));
    return NextResponse.json({ pengurus: sorted, source: "database" });
  } catch (e: any) {
    return NextResponse.json({ pengurus: FALLBACK_PENGURUS, source: "fallback", error: e?.message });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.nama || !b.jabatan) return NextResponse.json({ error: "Nama dan jabatan wajib" }, { status: 400 });
    const [created] = await db.insert(pengurus).values({
      nama: b.nama,
      jabatan: b.jabatan,
      periode: b.periode || "2026 - 2031",
      isCurrent: b.isCurrent || "true",
      noHp: b.noHp || "",
      noRumah: b.noRumah || "",
      fotoUrl: b.fotoUrl || "",
      catatan: b.catatan || "",
      urutan: Number(b.urutan || 1),
    }).returning();
    return NextResponse.json({ success: true, pengurus: created });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal simpan pengurus", detail: e?.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    if (!b.id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });
    const updateData: any = {};
    for (const k of ["nama","jabatan","periode","isCurrent","noHp","noRumah","fotoUrl","catatan"] as const) {
      if (b[k] !== undefined) updateData[k] = b[k];
    }
    if (b.urutan !== undefined) updateData.urutan = Number(b.urutan || 1);
    const [updated] = await db.update(pengurus).set(updateData).where(eq(pengurus.id, Number(b.id))).returning();
    return NextResponse.json({ success: true, pengurus: updated });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal update", detail: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });
    await db.delete(pengurus).where(eq(pengurus.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal hapus", detail: e?.message }, { status: 500 });
  }
}
