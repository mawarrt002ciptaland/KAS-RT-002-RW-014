import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturan } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_PENGATURAN = {
  namaRt: "RT 002 RW 014",
  perumahan: "Perumahan Ciptaland",
  blok: "Blok Mawar",
  ketuaRt: "Bambang Sudik Pamarto",
  noHpKetua: "081234567890",
  bendahara: "Ahmad Suryana",
  noHpBendahara: "081398765432",
  namaBank: "Bank Central Asia (BCA)",
  noRekening: "8720192831",
  atasNama: "KAS RT 002 BLOK MAWAR",
  qrisImage:
    "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021226590014ID.LINKAJA.WWW01189360091100214002021587201928315204581253033605802ID5919KAS%20RT%20002%20BLOK%20MAWAR6009TANGERANG61051515462070703A0163048B5A",
  logoImage: "",
  iuranWajib: 50000,
  templateWaTagihan:
    "Yth. Bpk/Ibu [NAMA_WARGA] ([NO_RUMAH]), menginfokan iuran Kas RT 002 RW 014 Blok Mawar untuk bulan [BULAN] sebesar [NOMINAL]. Terima kasih!",
  templateWaKwitansi:
    "Terima kasih Bpk/Ibu [NAMA_WARGA], pembayaran iuran Kas RT 002 RW 014 untuk [BULAN] sebesar [NOMINAL] telah kami terima dengan No. Kwitansi [NO_KWITANSI].",
};

export async function GET() {
  try {
    try {
      const list = await db.select().from(pengaturan).limit(1);

      if (list.length === 0) {
        try {
          const [created] = await db.insert(pengaturan).values(DEFAULT_PENGATURAN).returning();
          return NextResponse.json({ pengaturan: created, source: "database-created" });
        } catch {
          return NextResponse.json({ pengaturan: DEFAULT_PENGATURAN, source: "default-fallback" });
        }
      }

      return NextResponse.json({ pengaturan: list[0], source: "database" });
    } catch (tableError: any) {
      console.error("Get pengaturan table fallback:", tableError);
      return NextResponse.json({ pengaturan: DEFAULT_PENGATURAN, source: "default-fallback" });
    }
  } catch (err: any) {
    console.error("Get pengaturan error:", err);
    return NextResponse.json({ pengaturan: DEFAULT_PENGATURAN, source: "default-fallback" });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    try {
      const list = await db.select().from(pengaturan).limit(1);

      if (list.length === 0) {
        const [created] = await db
          .insert(pengaturan)
          .values({
            ...DEFAULT_PENGATURAN,
            ...body,
          })
          .returning();
        return NextResponse.json({ success: true, pengaturan: created });
      }

      const [updated] = await db
        .update(pengaturan)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(pengaturan.id, list[0].id))
        .returning();

      return NextResponse.json({ success: true, pengaturan: updated });
    } catch (dbWriteError: any) {
      console.error("Update pengaturan database unavailable:", dbWriteError);
      return NextResponse.json(
        {
          success: false,
          error: "Tabel pengaturan di Neon belum tersedia. Jalankan push schema terlebih dahulu.",
          detail: dbWriteError?.message || "Unknown pengaturan write error",
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error("Update pengaturan error:", err);
    return NextResponse.json(
      {
        error: "Gagal menyimpan pengaturan ke database. Periksa koneksi Neon dan tabel pengaturan.",
        detail: err?.message || "Unknown pengaturan write error",
      },
      { status: 500 }
    );
  }
}
