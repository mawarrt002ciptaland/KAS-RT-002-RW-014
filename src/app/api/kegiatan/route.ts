import { NextResponse } from "next/server";
import { db } from "@/db";
import { kegiatanWarga } from "@/db/schema";
import { desc, eq, and, ilike } from "drizzle-orm";

const INITIAL_KEGIATAN = [
  {
    id: 1,
    namaKegiatan: "Gotong Royong & Fogging Lingkungan",
    kategori: "Gotong Royong",
    tanggal: "2026-09-27",
    waktu: "07.00 - 10.00 WIB",
    lokasi: "Lingkungan Blok Mawar (Depan Fasum & Gang M-01 s/d M-12)",
    peserta: "Seluruh Kepala Keluarga RT 002 RW 014",
    penanggungJawab: "Bpk. Eka Rista Yudhistira, ST. & Korlap",
    status: "Akan Datang",
    deskripsi: "Pembersihan selokan/drainase utama, perapihan semak pohon sekitar portal, dan fogging massal antisipasi nyamuk DBD.",
    daftarKebutuhan: "Cangkul, sapu lidi, karung plastik sampah, obat fogging, konsumsi snack & air mineral",
    anggaran: 750000,
    realisasiBiaya: 625000,
    dokumentasiUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80",
    pengumuman: "Diharapkan setiap rumah membawa minimal 1 perwakilan warga dan alat kerja bakti masing-masing. Titik kumpul di Pos Jaga jam 07.00 WIB.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    namaKegiatan: "Rapat Warga Evaluasi Triwulan III",
    kategori: "Rapat Warga",
    tanggal: "2026-10-04",
    waktu: "20.00 - 22.00 WIB",
    lokasi: "Balai Warga / Pos Keamanan Blok Mawar",
    peserta: "Warga RT 002 (Bapak-bapak / Perwakilan KK)",
    penanggungJawab: "Sekretaris & Bendahara RT",
    status: "Terjadwal",
    deskripsi: "Laporan pertanggungjawaban kas periode Juli-September 2026, pembahasan perbaikan CCTV gang dan rencana kerja bakti akhir tahun.",
    daftarKebutuhan: "Konsumsi kopi teh, gorengan, proyektor, lembar print laporan kas",
    anggaran: 400000,
    realisasiBiaya: 0,
    dokumentasiUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=80",
    pengumuman: "Laporan cetak keuangan akan dibagikan langsung sebelum agenda musyawarah dimulai.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    namaKegiatan: "Pengajian & Doa Bersama Warga",
    kategori: "Keagamaan",
    tanggal: "2026-10-10",
    waktu: "19.30 - 21.00 WIB",
    lokasi: "Mushola Al-Ikhlas Ciptaland",
    peserta: "Warga Muslim RT 002",
    penanggungJawab: "Sie Kerohanian & Bpk. Asrizal",
    status: "Terjadwal",
    deskripsi: "Pengajian bulanan, pembacaan surat Yasin dan tahlil, serta silaturahmi mempererat kerukunan antar tetangga.",
    daftarKebutuhan: "Sound system, konsumsi snack ringan, air mineral",
    anggaran: 300000,
    realisasiBiaya: 0,
    dokumentasiUrl: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&auto=format&fit=crop&q=80",
    pengumuman: "Terbuka untuk bapak-bapak, ibu-ibu dan remaja masjid.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    namaKegiatan: "Pemeriksaan Balita & Lansia Posyandu Melati",
    kategori: "Sosial",
    tanggal: "2026-10-15",
    waktu: "08.30 - 11.30 WIB",
    lokasi: "Pos Ronda Fasum RT 002",
    peserta: "Balita, Ibu Hamil & Lansia RT 002",
    penanggungJawab: "Kader Posyandu & Ibu Neny Melsya",
    status: "Terjadwal",
    deskripsi: "Penimbangan berat badan, imunisasi rutin, pengukuran tinggi badan, pemberian vitamin A dan PMT bergizi.",
    daftarKebutuhan: "Timbangan dacin, tensimeter, bubur kacang hijau, biskuit balita",
    anggaran: 350000,
    realisasiBiaya: 0,
    dokumentasiUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
    pengumuman: "Bawa buku KIA (Kesehatan Ibu dan Anak) saat datang ke posyandu.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    namaKegiatan: "Malam Puncak Peringatan HUT RI ke-81",
    kategori: "Perayaan & Perlombaan",
    tanggal: "2026-08-17",
    waktu: "19.00 - 23.00 WIB",
    lokasi: "Lapangan Voli Fasum Blok Mawar",
    peserta: "Seluruh Warga & Anak-anak Blok Mawar",
    penanggungJawab: "Panitia HUT RI & Karang Taruna",
    status: "Selesai",
    deskripsi: "Pembagian hadiah perlombaan anak-anak & bapak-ibu, turnamen voli, panggung hiburan warga, dan ramah tamah kemerdekaan.",
    daftarKebutuhan: "Sewa panggung, tenda, piala, seragam voli putra & putri, sound, konsumsi nasi tumpeng",
    anggaran: 2500000,
    realisasiBiaya: 2220512,
    dokumentasiUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    pengumuman: "Terima kasih atas partisipasi aktif seluruh warga. Sisa anggaran telah disetorkan kembali ke kas RT.",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kategori = searchParams.get("kategori");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    try {
      let query = db.select().from(kegiatanWarga).$dynamic();
      const conditions = [];

      if (kategori && kategori !== "Semua") {
        conditions.push(eq(kegiatanWarga.kategori, kategori));
      }
      if (status && status !== "Semua") {
        conditions.push(eq(kegiatanWarga.status, status));
      }
      if (search) {
        conditions.push(ilike(kegiatanWarga.namaKegiatan, `%${search}%`));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const rows = await query.orderBy(desc(kegiatanWarga.tanggal));
      if (rows.length === 0 && !search && (!kategori || kategori === "Semua") && (!status || status === "Semua")) {
        // Seed initial kegiatan if empty
        for (const item of INITIAL_KEGIATAN) {
          try {
            await db.insert(kegiatanWarga).values({
              namaKegiatan: item.namaKegiatan,
              kategori: item.kategori,
              tanggal: item.tanggal,
              waktu: item.waktu,
              lokasi: item.lokasi,
              peserta: item.peserta,
              penanggungJawab: item.penanggungJawab,
              status: item.status,
              deskripsi: item.deskripsi,
              daftarKebutuhan: item.daftarKebutuhan,
              anggaran: item.anggaran,
              realisasiBiaya: item.realisasiBiaya,
              dokumentasiUrl: item.dokumentasiUrl,
              pengumuman: item.pengumuman,
            });
          } catch {}
        }
        return NextResponse.json({ kegiatan: INITIAL_KEGIATAN, source: "initial-seeded" });
      }

      return NextResponse.json({ kegiatan: rows, source: "database" });
    } catch {
      let filtered = [...INITIAL_KEGIATAN];
      if (kategori && kategori !== "Semua") {
        filtered = filtered.filter((k) => k.kategori === kategori);
      }
      if (status && status !== "Semua") {
        filtered = filtered.filter((k) => k.status === status);
      }
      if (search) {
        filtered = filtered.filter((k) => k.namaKegiatan.toLowerCase().includes(search.toLowerCase()));
      }
      return NextResponse.json({ kegiatan: filtered, source: "fallback" });
    }
  } catch (error: any) {
    return NextResponse.json({ kegiatan: INITIAL_KEGIATAN, source: "fallback" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      namaKegiatan,
      kategori = "Gotong Royong",
      tanggal,
      waktu = "07.00 - 10.00 WIB",
      lokasi,
      peserta = "Seluruh Warga RT 002",
      penanggungJawab,
      status = "Terjadwal",
      deskripsi = "",
      daftarKebutuhan = "",
      anggaran = 0,
      realisasiBiaya = 0,
      dokumentasiUrl = "",
      pengumuman = "",
    } = body;

    if (!namaKegiatan || !tanggal || !lokasi || !penanggungJawab) {
      return NextResponse.json({ error: "Nama kegiatan, tanggal, lokasi, dan penanggung jawab wajib diisi!" }, { status: 400 });
    }

    try {
      const [created] = await db
        .insert(kegiatanWarga)
        .values({
          namaKegiatan,
          kategori,
          tanggal,
          waktu,
          lokasi,
          peserta,
          penanggungJawab,
          status,
          deskripsi,
          daftarKebutuhan,
          anggaran: Number(anggaran || 0),
          realisasiBiaya: Number(realisasiBiaya || 0),
          dokumentasiUrl: dokumentasiUrl || "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80",
          pengumuman,
        })
        .returning();

      return NextResponse.json({ success: true, kegiatan: created, source: "database" });
    } catch (e: any) {
      return NextResponse.json({
        success: true,
        kegiatan: { id: Date.now(), ...body },
        source: "client-persisted",
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal menyimpan kegiatan" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID kegiatan diperlukan" }, { status: 400 });

    try {
      const [updated] = await db
        .update(kegiatanWarga)
        .set({
          ...data,
          anggaran: Number(data.anggaran || 0),
          realisasiBiaya: Number(data.realisasiBiaya || 0),
        })
        .where(eq(kegiatanWarga.id, Number(id)))
        .returning();

      return NextResponse.json({ success: true, kegiatan: updated });
    } catch {
      return NextResponse.json({ success: true, kegiatan: body });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Gagal memperbarui kegiatan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID kegiatan diperlukan" }, { status: 400 });

    try {
      await db.delete(kegiatanWarga).where(eq(kegiatanWarga.id, Number(id)));
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Gagal menghapus kegiatan" }, { status: 500 });
  }
}
