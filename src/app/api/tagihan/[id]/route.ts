import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, tanggalBayar, metode, denda, tanggapan } = body;
    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (tanggalBayar) data.tanggalBayar = new Date(tanggalBayar);
    if (metode) data.metode = metode;
    if (typeof denda === "number") data.denda = denda;
    if (tanggapan !== undefined) data.keterangan = tanggapan;

    const updated = await db.tagihan.update({ where: { id }, data, include: { warga: true } });

    if (status === "lunas") {
      // create kwitansi for this tagihan payment
      const exists = await db.kwitansi.findFirst({ where: { tagihanId: id } });
      if (!exists) {
        const seq = String(await db.kwitansi.count() + 1).padStart(4, "0");
        await db.kwitansi.create({
          data: {
            kode: `KWI-PAY-${new Date().getFullYear()}-${seq}`,
            tagihanId: id,
            wargaId: updated.wargaId,
            tanggal: new Date(),
            nominal: updated.jumlah + (updated.denda || 0),
            penerima: "Bendahara RT 002",
            pembayar: updated.warga?.nama || "Warga",
            keterangan: `Pembayaran ${updated.jenis} ${updated.periode}`,
          },
        });
      }
    }
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[api/tagihan/[id] PATCH]", e);
    return NextResponse.json({ error: "Gagal memperbarui tagihan" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.kwitansi.deleteMany({ where: { tagihanId: id } });
    await db.tagihan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/tagihan/[id] DELETE]", e);
    return NextResponse.json({ error: "Gagal menghapus tagihan" }, { status: 500 });
  }
}
