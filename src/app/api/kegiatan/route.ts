import { NextResponse } from "next/server";
import { db } from "@/db";
import { kegiatan } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(kegiatan).orderBy(desc(kegiatan.id));
    return NextResponse.json({ kegiatan: list, source: "database" });
  } catch (error: any) {
    console.error("Get kegiatan error:", error);
    return NextResponse.json({ error: "Gagal mengambil data kegiatan", kegiatan: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      judul,
      kategori = "Gotong Royong",
      tanggal,
      waktu = "07.00 - 10.00 WIB",
      lokasi,
      peserta = "Warga RT 002",
      penanggungJawab,
      kontakPj = "",
      fotoPj = "",
      deskripsi = "",
      daftarKebutuhan = "",
      anggaran = 0,
      pengeluaran = 0,
      dokumentasiUrl = "",
      pengumuman = "",
      status = "Akan Datang",
    } = body;

    if (!judul || !tanggal || !lokasi || !penanggungJawab) {
      return NextResponse.json({ error: "Judul, tanggal, lokasi, dan penanggung jawab wajib diisi" }, { status: 400 });
    }

    const ang = Number(anggaran) || 0;
    const peng = Number(pengeluaran) || 0;
    const sisa = ang - peng;

    const [created] = await db
      .insert(kegiatan)
      .values({
        judul: judul.trim(),
        kategori: kategori.trim(),
        tanggal: tanggal.trim(),
        waktu: waktu.trim(),
        lokasi: lokasi.trim(),
        peserta: peserta.trim(),
        penanggungJawab: penanggungJawab.trim(),
        kontakPj: kontakPj?.trim() || null,
        fotoPj: fotoPj || null,
        deskripsi: deskripsi?.trim() || null,
        daftarKebutuhan: daftarKebutuhan?.trim() || null,
        anggaran: ang,
        pengeluaran: peng,
        sisaAnggaran: sisa,
        dokumentasiUrl: dokumentasiUrl || null,
        pengumuman: pengumuman?.trim() || null,
        status: status || "Akan Datang",
      })
      .returning();

    return NextResponse.json({ success: true, kegiatan: created });
  } catch (error: any) {
    console.error("Create kegiatan error:", error);
    return NextResponse.json({ error: "Gagal menambahkan kegiatan", detail: error?.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, judul, kategori, tanggal, waktu, lokasi, peserta, penanggungJawab, kontakPj, fotoPj, deskripsi, daftarKebutuhan, anggaran, pengeluaran, dokumentasiUrl, pengumuman, status } = body;

    if (!id) return NextResponse.json({ error: "ID kegiatan diperlukan" }, { status: 400 });

    const updateData: any = {};
    if (judul) updateData.judul = judul.trim();
    if (kategori) updateData.kategori = kategori.trim();
    if (tanggal) updateData.tanggal = tanggal.trim();
    if (waktu) updateData.waktu = waktu.trim();
    if (lokasi) updateData.lokasi = lokasi.trim();
    if (peserta) updateData.peserta = peserta.trim();
    if (penanggungJawab) updateData.penanggungJawab = penanggungJawab.trim();
    if (kontakPj !== undefined) updateData.kontakPj = kontakPj?.trim() || null;
    if (fotoPj !== undefined) updateData.fotoPj = fotoPj || null;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi?.trim() || null;
    if (daftarKebutuhan !== undefined) updateData.daftarKebutuhan = daftarKebutuhan?.trim() || null;
    if (anggaran !== undefined) updateData.anggaran = Number(anggaran) || 0;
    if (pengeluaran !== undefined) updateData.pengeluaran = Number(pengeluaran) || 0;

    if (anggaran !== undefined || pengeluaran !== undefined) {
      const ang = Number(anggaran !== undefined ? anggaran : updateData.anggaran || 0);
      const peng = Number(pengeluaran !== undefined ? pengeluaran : updateData.pengeluaran || 0);
      updateData.sisaAnggaran = ang - peng;
    }

    if (dokumentasiUrl !== undefined) updateData.dokumentasiUrl = dokumentasiUrl || null;
    if (pengumuman !== undefined) updateData.pengumuman = pengumuman?.trim() || null;
    if (status) updateData.status = status;

    const [updated] = await db.update(kegiatan).set(updateData).where(eq(kegiatan.id, Number(id))).returning();
    return NextResponse.json({ success: true, kegiatan: updated });
  } catch (error: any) {
    console.error("Update kegiatan error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kegiatan", detail: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID kegiatan diperlukan" }, { status: 400 });

    await db.delete(kegiatan).where(eq(kegiatan.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete kegiatan error:", error);
    return NextResponse.json({ error: "Gagal menghapus kegiatan", detail: error?.message }, { status: 500 });
  }
}
