import { NextResponse } from "next/server";
import { db } from "@/db";
import { warga } from "@/db/schema";
import { eq, or, ilike } from "drizzle-orm";

const FALLBACK_WARGA = [
  { id: 1, nik: "3201140102850001", nama: "Bambang Sudik Pamarto", noRumah: "M-01", noHp: "081234567890", statusTinggal: "Tetap", jumlahKeluarga: 4, pekerjaan: "Wiraswasta", statusIuran: "Aktif" },
  { id: 2, nik: "3201141208920003", nama: "Bayu Sudik Pamarto", noRumah: "M-02", noHp: "081298765431", statusTinggal: "Tetap", jumlahKeluarga: 3, pekerjaan: "Pegawai BUMN", statusIuran: "Aktif" },
  { id: 3, nik: "3201140504900002", nama: "Ahmad Suryana", noRumah: "M-03", noHp: "081398765432", statusTinggal: "Tetap", jumlahKeluarga: 3, pekerjaan: "Akuntan", statusIuran: "Aktif" },
  { id: 4, nik: "3201140903890006", nama: "Hendro Wijaya", noRumah: "M-04", noHp: "081211223344", statusTinggal: "Tetap", jumlahKeluarga: 4, pekerjaan: "Teknisi Elektronik", statusIuran: "Aktif" },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    try {
      let query = db.select().from(warga).$dynamic();
      if (search) {
        query = query.where(or(ilike(warga.nama, `%${search}%`), ilike(warga.nik, `%${search}%`), ilike(warga.noRumah, `%${search}%`)));
      }
      const list = await query.orderBy(warga.id);
      return NextResponse.json({ warga: list, source: "database" });
    } catch {
      const fallback = search
        ? FALLBACK_WARGA.filter((w) => w.nama.toLowerCase().includes(search.toLowerCase()) || w.nik.includes(search) || w.noRumah.toLowerCase().includes(search.toLowerCase()))
        : FALLBACK_WARGA;
      return NextResponse.json({ warga: fallback, source: "fallback" });
    }
  } catch (err: any) {
    console.error("Get warga error:", err);
    return NextResponse.json({ warga: FALLBACK_WARGA, source: "fallback" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nik, nama, noRumah, noHp, statusTinggal = "Tetap", jumlahKeluarga = 1, pekerjaan = "" } = body;

    if (!nik || !nama || !noRumah || !noHp) {
      return NextResponse.json({ error: "NIK, Nama, No Rumah, dan No HP wajib diisi" }, { status: 400 });
    }

    try {
      const existing = await db.select().from(warga).where(eq(warga.nik, nik.trim())).limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ error: "NIK sudah terdaftar sebelumnya" }, { status: 409 });
      }

      const [newWarga] = await db
        .insert(warga)
        .values({ nik: nik.trim(), nama: nama.trim(), noRumah: noRumah.trim(), noHp: noHp.trim(), statusTinggal, jumlahKeluarga: Number(jumlahKeluarga) || 1, pekerjaan: pekerjaan.trim() })
        .returning();

      return NextResponse.json({ success: true, warga: newWarga, source: "database" });
    } catch (tableErr: any) {
      return NextResponse.json(
        {
          error: "Tabel warga di Neon belum tersedia. Jalankan push schema / buat tabel warga terlebih dahulu.",
          detail: tableErr?.message || "Unknown warga write error",
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error("Add warga error:", err);
    return NextResponse.json(
      {
        error: "Gagal menambahkan warga ke database. Periksa koneksi Neon dan tabel warga.",
        detail: err?.message || "Unknown warga write error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nama, noRumah, noHp, statusTinggal, jumlahKeluarga, pekerjaan, statusIuran } = body;
    if (!id) return NextResponse.json({ error: "ID warga diperlukan" }, { status: 400 });

    const [updated] = await db.update(warga).set({ nama, noRumah, noHp, statusTinggal, jumlahKeluarga: Number(jumlahKeluarga) || 1, pekerjaan, statusIuran }).where(eq(warga.id, id)).returning();
    return NextResponse.json({ success: true, warga: updated });
  } catch (err: any) {
    console.error("Update warga error:", err);
    return NextResponse.json({ error: "Gagal memperbarui warga" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID warga diperlukan" }, { status: 400 });
    await db.delete(warga).where(eq(warga.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete warga error:", err);
    return NextResponse.json({ error: "Gagal menghapus warga" }, { status: 500 });
  }
}
