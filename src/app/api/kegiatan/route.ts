import { NextResponse } from "next/server";
import { db } from "@/db";
import { kegiatan } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const FALLBACK_KEGIATAN = [
  {
    id: 1,
    judul: "Semarak Peringatan HUT RI ke-81",
    kategori: "Perayaan & Perlombaan",
    tanggal: "2026-08-17",
    waktu: "08.00 - 17.00 WIB",
    lokasi: "Fasum Lapangan Blok Mawar",
    peserta: "Seluruh Warga RT 002",
    penanggungJawab: "Panitia HUT RI (Asrizal)",
    pjFoto: "",
    pjNoHp: "082274449963",
    deskripsi: "Lomba anak-anak (makan kerupuk, balap karung, mewarnai) dan turnamen voli antar blok serta pembagian doorprize malam syukuran.",
    daftarKebutuhan: "Tenda, panggung mini, sound system, hadiah piala & doorprize, konsumsi",
    anggaran: 2500000,
    realisasi: 2450000,
    dokumentasi: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    pengumuman: "",
    linkUrl: "https://instagram.com/rt002blokmawar",
    linkLabel: "Instagram RT 002 Blok Mawar",
    status: "Selesai",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    judul: "Gotong Royong Lingkungan",
    kategori: "Gotong Royong",
    tanggal: "2026-09-27",
    waktu: "07.00 - 10.00 WIB",
    lokasi: "Lingkungan Blok Mawar",
    peserta: "Warga RT 002",
    penanggungJawab: "Eka Rista Yudhistira, ST.",
    pjFoto: "",
    pjNoHp: "+62 821-7129-9984",
    deskripsi: "Bersihkan selokan, potong rumput taman, dan cat ulang pos jaga.",
    daftarKebutuhan: "Sapu, cangkul, cat, kuas, konsumsi",
    anggaran: 750000,
    realisasi: 625000,
    dokumentasi: "",
    pengumuman: "Bawa peralatan masing-masing. Konsumsi disediakan.",
    linkUrl: "https://chat.whatsapp.com/contoh-link-grup-goro",
    linkLabel: "Grup WhatsApp Goro",
    status: "Akan Datang",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    judul: "Pengajian Warga",
    kategori: "Keagamaan",
    tanggal: "2026-10-10",
    waktu: "19.30 - 21.00 WIB",
    lokasi: "Mushola",
    peserta: "Warga RT 002",
    penanggungJawab: "Ust. Ahmad",
    pjFoto: "",
    pjNoHp: "",
    deskripsi: "Pengajian rutin bulanan warga.",
    daftarKebutuhan: "Sound, tikar, konsumsi",
    anggaran: 300000,
    realisasi: 0,
    dokumentasi: "",
    pengumuman: "",
    linkUrl: "https://youtube.com/@rt002blokmawar",
    linkLabel: "Live Pengajian YouTube",
    status: "Terjadwal",
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const rows = await db.select().from(kegiatan).orderBy(desc(kegiatan.id));
    if (!rows || rows.length === 0) {
      return NextResponse.json({ kegiatan: FALLBACK_KEGIATAN, source: "fallback-empty" });
    }
    return NextResponse.json({ kegiatan: rows, source: "database" });
  } catch (e: any) {
    return NextResponse.json({ kegiatan: FALLBACK_KEGIATAN, source: "fallback", error: e?.message });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.judul || !b.tanggal || !b.penanggungJawab) {
      return NextResponse.json({ error: "Judul, tanggal, dan penanggung jawab wajib diisi" }, { status: 400 });
    }
    const [created] = await db.insert(kegiatan).values({
      judul: b.judul,
      kategori: b.kategori || "Gotong Royong",
      tanggal: b.tanggal,
      waktu: b.waktu || "07.00 - 10.00 WIB",
      lokasi: b.lokasi || "Blok Mawar",
      peserta: b.peserta || "Warga RT 002 RW 014",
      penanggungJawab: b.penanggungJawab,
      pjFoto: b.pjFoto || "",
      pjNoHp: b.pjNoHp || "",
      deskripsi: b.deskripsi || "",
      daftarKebutuhan: b.daftarKebutuhan || "",
      anggaran: Number(b.anggaran || 0),
      realisasi: Number(b.realisasi || 0),
      dokumentasi: b.dokumentasi || "",
      pengumuman: b.pengumuman || "",
      linkUrl: b.linkUrl || "",
      linkLabel: b.linkLabel || "",
      status: b.status || "Akan Datang",
    }).returning();
    return NextResponse.json({ success: true, kegiatan: created });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal menyimpan kegiatan", detail: e?.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    if (!b.id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });
    const updateData: any = {};
    for (const k of ["judul","kategori","tanggal","waktu","lokasi","peserta","penanggungJawab","pjFoto","pjNoHp","deskripsi","daftarKebutuhan","pengumuman","linkUrl","linkLabel","status","dokumentasi"] as const) {
      if (b[k] !== undefined) updateData[k] = b[k];
    }
    if (b.anggaran !== undefined) updateData.anggaran = Number(b.anggaran || 0);
    if (b.realisasi !== undefined) updateData.realisasi = Number(b.realisasi || 0);
    const [updated] = await db.update(kegiatan).set(updateData).where(eq(kegiatan.id, Number(b.id))).returning();
    return NextResponse.json({ success: true, kegiatan: updated });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal update kegiatan", detail: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });
    await db.delete(kegiatan).where(eq(kegiatan.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Gagal hapus", detail: e?.message }, { status: 500 });
  }
}
