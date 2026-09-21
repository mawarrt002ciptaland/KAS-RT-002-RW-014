import { NextResponse } from "next/server";
import { db } from "@/db";
import { transaksi } from "@/db/schema";
import { desc, eq, and, ilike } from "drizzle-orm";

function generateKodeTransaksi() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TRX-${y}${m}${d}-${hh}${mm}${ss}-${rnd}`;
}

function normalizeTanggal(input?: string) {
  if (!input) return new Date().toISOString().split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jenis = searchParams.get("jenis");
    const kategori = searchParams.get("kategori");
    const search = searchParams.get("search");

    let query = db.select().from(transaksi).$dynamic();
    const conditions = [];
    if (jenis) conditions.push(eq(transaksi.jenis, jenis));
    if (kategori && kategori !== "Semua") conditions.push(eq(transaksi.kategori, kategori));
    if (search) conditions.push(ilike(transaksi.keterangan, `%${search}%`));
    if (conditions.length > 0) query = query.where(and(...conditions));

    const list = await query.orderBy(desc(transaksi.id));
    const all = await db.select().from(transaksi);

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    const pengeluaranPerKategori: Record<string, number> = {};

    for (const t of all) {
      if (t.jenis === "pemasukan") totalPemasukan += t.nominal;
      if (t.jenis === "pengeluaran") {
        totalPengeluaran += t.nominal;
        pengeluaranPerKategori[t.kategori] = (pengeluaranPerKategori[t.kategori] || 0) + t.nominal;
      }
    }

    return NextResponse.json({
      transaksi: list,
      ringkasan: {
        saldo: totalPemasukan - totalPengeluaran,
        totalPemasukan,
        totalPengeluaran,
        pengeluaranPerKategori,
        totalTransaksi: all.length,
      },
    });
  } catch (err: any) {
    console.error("Get transaksi error:", err);
    return NextResponse.json({ error: "Gagal mengambil data transaksi", detail: err?.message || "Unknown read error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jenis, kategori, tanggal, nominal, keterangan, metodePembayaran = "Transfer / QRIS", namaPihak = "", buktiUrl = "", createdBy = "Bendahara RT" } = body;

    if (!jenis || !kategori || !nominal || !keterangan) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 });
    }

    const kodeTransaksi = generateKodeTransaksi();
    const finalTanggal = normalizeTanggal(tanggal);

    const [created] = await db
      .insert(transaksi)
      .values({
        kodeTransaksi,
        jenis,
        kategori,
        tanggal: finalTanggal,
        nominal: Number(nominal),
        keterangan,
        metodePembayaran,
        namaPihak,
        buktiUrl,
        status: "berhasil",
        createdBy,
      })
      .returning();

    return NextResponse.json({ success: true, transaksi: created });
  } catch (err: any) {
    console.error("Create transaksi error:", err);
    return NextResponse.json(
      {
        error: "Gagal mencatat transaksi ke database. Periksa koneksi Neon dan tabel transaksi.",
        detail: err?.message || "Unknown transaksi write error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, jenis, kategori, tanggal, nominal, keterangan, metodePembayaran, namaPihak } = body;
    if (!id) return NextResponse.json({ error: "ID transaksi diperlukan" }, { status: 400 });

    const [updated] = await db
      .update(transaksi)
      .set({
        jenis,
        kategori,
        tanggal: normalizeTanggal(tanggal),
        nominal: Number(nominal),
        keterangan,
        metodePembayaran,
        namaPihak,
      })
      .where(eq(transaksi.id, id))
      .returning();

    return NextResponse.json({ success: true, transaksi: updated });
  } catch (err: any) {
    console.error("Update transaksi error:", err);
    return NextResponse.json({ error: "Gagal memperbarui transaksi", detail: err?.message || "Unknown update error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID transaksi diperlukan" }, { status: 400 });

    await db.delete(transaksi).where(eq(transaksi.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete transaksi error:", err);
    return NextResponse.json({ error: "Gagal menghapus transaksi", detail: err?.message || "Unknown delete error" }, { status: 500 });
  }
}
