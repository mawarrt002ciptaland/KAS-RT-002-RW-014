import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturan } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_PENGATURAN = {
  namaRt: "RT 002 RW 014",
  perumahan: "Perumahan Ciptaland",
  blok: "Blok Mawar",
  ketuaRt: "Eka Rista Yudhistira, ST.",
  noHpKetua: "+62 821-7129-9984",
  bendahara: "Neny Melsya, S.Sp.",
  noHpBendahara: "082173735449",
  namaBank: "Bank Nasional Indonesia (BNI)",
  noRekening: "0799703264",
  atasNama: "Neny Melsya",
  qrisImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BNI-0799703264-NENY-MELSYA-KAS-RT002",
  logoImage: "",
  iuranWajib: 50000,
  templateWaTagihan: "Yth. Bpk/Ibu [NAMA_WARGA] ([NO_RUMAH]), menginfokan iuran Kas RT 002 RW 014 Blok Mawar untuk bulan [BULAN] sebesar [NOMINAL]. Terima kasih!",
  templateWaKwitansi: "Terima kasih Bpk/Ibu [NAMA_WARGA], pembayaran iuran Kas RT 002 RW 014 untuk [BULAN] sebesar [NOMINAL] telah kami terima dengan No. Kwitansi [NO_KWITANSI].",
};

export async function GET() {
  try {
    const list = await db.select().from(pengaturan).limit(1);
    if (list.length === 0) {
      return NextResponse.json({ pengaturan: DEFAULT_PENGATURAN, source: "default-empty" });
    }
    return NextResponse.json({ pengaturan: list[0], source: "database" });
  } catch (err: any) {
    console.error("Get pengaturan error:", err);
    return NextResponse.json(
      {
        pengaturan: DEFAULT_PENGATURAN,
        source: "database-error",
        error: err?.message || "Gagal mengambil data pengaturan dari Neon",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const list = await db.select().from(pengaturan).limit(1);

    if (list.length === 0) {
      const [created] = await db.insert(pengaturan).values({ ...DEFAULT_PENGATURAN, ...body }).returning();
      return NextResponse.json({ success: true, pengaturan: created, source: "database" });
    }

    const [updated] = await db.update(pengaturan).set({ ...body, updatedAt: new Date() }).where(eq(pengaturan.id, list[0].id)).returning();
    return NextResponse.json({ success: true, pengaturan: updated, source: "database" });
  } catch (err: any) {
    console.error("Update pengaturan error:", err);
    return NextResponse.json(
      {
        error: "Gagal menyimpan pengaturan ke database Neon.",
        detail: err?.message || "Unknown pengaturan write error",
      },
      { status: 500 }
    );
  }
}
