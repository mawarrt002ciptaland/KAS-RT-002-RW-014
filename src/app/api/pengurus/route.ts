import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(pengurus).orderBy(asc(pengurus.urutan), asc(pengurus.id));
    return NextResponse.json({ pengurus: list, source: "database" });
  } catch (error: any) {
    console.error("Get pengurus error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pengurus", pengurus: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama, jabatan, noHp, noRumah, fotoUrl = "", periode = "2026 - 2031 (5 Tahun)", kategori = "aktif", masaJabatan = "Periode 2026 - 2031", catatan = "", urutan = 1 } = body;

    if (!nama || !jabatan) {
      return NextResponse.json({ error: "Nama dan jabatan wajib diisi" }, { status: 400 });
    }

    const [created] = await db
      .insert(pengurus)
      .values({
        nama: nama.trim(),
        jabatan: jabatan.trim(),
        noHp: noHp?.trim() || null,
        noRumah: noRumah?.trim() || null,
        fotoUrl: fotoUrl || null,
        periode: periode.trim(),
        kategori: kategori || "aktif",
        masaJabatan: masaJabatan?.trim() || null,
        catatan: catatan?.trim() || null,
        urutan: Number(urutan) || 1,
      })
      .returning();

    return NextResponse.json({ success: true, pengurus: created });
  } catch (error: any) {
    console.error("Create pengurus error:", error);
    return NextResponse.json({ error: "Gagal menambahkan pengurus", detail: error?.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nama, jabatan, noHp, noRumah, fotoUrl, periode, kategori, masaJabatan, catatan, urutan } = body;

    if (!id) return NextResponse.json({ error: "ID pengurus diperlukan" }, { status: 400 });

    const updateData: any = {};
    if (nama) updateData.nama = nama.trim();
    if (jabatan) updateData.jabatan = jabatan.trim();
    if (noHp !== undefined) updateData.noHp = noHp?.trim() || null;
    if (noRumah !== undefined) updateData.noRumah = noRumah?.trim() || null;
    if (fotoUrl !== undefined) updateData.fotoUrl = fotoUrl || null;
    if (periode) updateData.periode = periode.trim();
    if (kategori) updateData.kategori = kategori;
    if (masaJabatan !== undefined) updateData.masaJabatan = masaJabatan?.trim() || null;
    if (catatan !== undefined) updateData.catatan = catatan?.trim() || null;
    if (urutan !== undefined) updateData.urutan = Number(urutan) || 1;

    const [updated] = await db.update(pengurus).set(updateData).where(eq(pengurus.id, Number(id))).returning();
    return NextResponse.json({ success: true, pengurus: updated });
  } catch (error: any) {
    console.error("Update pengurus error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengurus", detail: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID pengurus diperlukan" }, { status: 400 });

    await db.delete(pengurus).where(eq(pengurus.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete pengurus error:", error);
    return NextResponse.json({ error: "Gagal menghapus pengurus" }, { status: 500 });
  }
}
