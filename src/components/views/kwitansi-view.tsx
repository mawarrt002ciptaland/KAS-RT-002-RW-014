"use client";

import { useState } from "react";
import Image from "next/image";
import { useFetch, postJSON } from "@/hooks/use-fetch";
import { useMounted } from "@/hooks/use-mounted";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader, SectionTitle, StatCard, EmptyState, ErrorState, CardSkeleton, RupiahText, Card } from "@/components/shared";
import { formatRupiah, formatTanggalID, formatTanggalLengkapID, parseRupiahInput, toThousandInput } from "@/lib/format";
import { RT_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Plus, Eye, Printer, Share2, Download, Wallet, Calendar, QrCode, Receipt, Building2 } from "lucide-react";

interface KwitansiTransaksi { kode?: string; jenis?: string; kategori?: string; keterangan?: string }
interface KwitansiTagihan { kode?: string; jenis?: string; periode?: string; warga?: { nama: string; noRumah: string } | null }
interface KwitansiWarga { nama: string; noRumah: string }
interface Kwitansi {
  id: string; kode: string;
  transaksiId?: string | null; transaksi?: KwitansiTransaksi | null;
  tagihanId?: string | null; tagihan?: KwitansiTagihan | null;
  wargaId?: string | null; warga?: KwitansiWarga | null;
  tanggal: string; nominal: number;
  penerima?: string | null; pembayar?: string | null; keterangan?: string | null; ttdUrl?: string | null;
}
interface Brand {
  qrisImage?: string; qrisUrl?: string;
  namaBendahara?: string; namaKetua?: string; namaRT?: string;
  bankNama?: string; bankRekening?: string; bankPemilik?: string;
}

/** Indonesian number-to-words for 0..999,999,999,999 */
function terbilang(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "nol";
  const SAT = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
  function below1000(x: number): string {
    if (x === 0) return "";
    const ratus = Math.floor(x / 100), sisa = x % 100;
    let s = ratus === 1 ? "seratus" : ratus > 1 ? SAT[ratus] + " ratus" : "";
    if (sisa > 0) {
      if (s) s += " ";
      if (sisa < 10) s += SAT[sisa];
      else if (sisa === 10) s += "sepuluh";
      else if (sisa === 11) s += "sebelas";
      else if (sisa < 20) s += SAT[sisa - 10] + " belas";
      else { const p = Math.floor(sisa / 10), s1 = sisa % 10; s += SAT[p] + " puluh"; if (s1) s += " " + SAT[s1]; }
    }
    return s;
  }
  if (n < 1000) return below1000(n);
  const miliar = Math.floor(n / 1_000_000_000),
    juta = Math.floor((n % 1_000_000_000) / 1_000_000),
    ribu = Math.floor((n % 1_000_000) / 1000),
    sis = n % 1000;
  const parts: string[] = [];
  if (miliar > 0) parts.push(miliar === 1 ? "satu miliar" : below1000(miliar) + " miliar");
  if (juta > 0) parts.push(juta === 1 ? "satu juta" : below1000(juta) + " juta");
  if (ribu > 0) parts.push(ribu === 1 ? "seribu" : below1000(ribu) + " ribu");
  if (sis > 0) parts.push(below1000(sis));
  return parts.join(" ").trim();
}

const kapital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const DEFAULT_PENERIMA = "Bendahara RT 002";
const SUBTITLE = "RT 002 / RW 014 Blok Mawar Perumahan Ciptaland Batam";

export function KwitansiView() {
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const { data, loading, error, refetch } = useFetch<{ items: Kwitansi[]; brand?: Brand }>("/api/kwitansi?limit=200");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Kwitansi | null>(null);

  const items = data?.items ?? [];
  const brand = data?.brand ?? {};
  const totalNominal = items.reduce((s, k) => s + (k.nominal || 0), 0);
  const todayCount = mounted ? items.filter((k) => {
    const d = new Date(k.tanggal), now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kwitansi"
        description="Cetak & kelola kwitansi penerimaan resmi RT 002"
        icon={<FileText className="h-5 w-5" />}
        actions={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Buat Kwitansi</Button>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Total Kwitansi" value={items.length} icon={<Receipt className="h-5 w-5" />} hint="Seluruh periode" />
        <StatCard title="Nilai Total" tone="income" value={<RupiahText value={totalNominal} />} icon={<Wallet className="h-5 w-5" />} hint="Akumulasi nominal" />
        <StatCard title="Hari Ini" tone="neutral" value={todayCount} icon={<Calendar className="h-5 w-5" />} hint="Kwitansi baru" />
      </div>

      <section>
        <SectionTitle title="Daftar Kwitansi" action={<span className="text-xs text-muted-foreground">{items.length} entri</span>} />

        {loading ? (
          <div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Belum ada kwitansi"
            description="Buat kwitansi pertama untuk mencatat penerimaan uang secara resmi."
            action={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Buat Kwitansi</Button>}
          />
        ) : isMobile ? (
          <div className="grid gap-2">
            {items.map((k) => <KwitansiMobileCard key={k.id} k={k} onLihat={() => setDetail(k)} />)}
          </div>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Pembayar</TableHead>
                    <TableHead>Penerima</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-mono text-xs font-semibold">{k.kode}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatTanggalID(k.tanggal)}</TableCell>
                      <TableCell className="text-right"><RupiahText value={k.nominal} className="font-semibold text-success" /></TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">{k.pembayar || "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">{k.penerima || DEFAULT_PENERIMA}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">{k.keterangan || k.transaksi?.keterangan || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setDetail(k)} aria-label={`Lihat kwitansi ${k.kode}`}><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => window.print()} aria-label={`Cetak kwitansi ${k.kode}`}><Printer className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => shareKwitansi(k, brand)} aria-label={`Bagikan kwitansi ${k.kode}`}><Share2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </section>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onDone={refetch} defaultPenerima={brand?.namaBendahara || DEFAULT_PENERIMA} />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[92vh] max-w-[min(95vw,560px)] overflow-y-auto scrollbar-thin p-0">
          {detail && <ReceiptDetail k={detail} brand={brand} onClose={() => setDetail(null)} />}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-receipt, .print-receipt * { visibility: visible !important; }
          .print-receipt { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function KwitansiMobileCard({ k, onLihat }: { k: Kwitansi; onLihat: () => void }) {
  return (
    <Card className="card-hover p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs font-bold">{k.kode}</p>
            <Badge variant="outline" className="border-success/30 text-success"><Receipt className="h-3 w-3" /> Resmi</Badge>
          </div>
          <p className="mt-1 text-base font-bold text-success">{formatRupiah(k.nominal)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatTanggalID(k.tanggal)}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Penerima</span>
          <span className="max-w-[140px] truncate text-xs font-medium">{k.penerima || DEFAULT_PENERIMA}</span>
        </div>
      </div>
      {(k.keterangan || k.transaksi?.keterangan) && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{k.keterangan || k.transaksi?.keterangan}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button size="sm" onClick={onLihat} className="touch-target"><Eye className="h-3.5 w-3.5" /> Lihat</Button>
        <Button size="sm" variant="outline" onClick={() => window.print()} className="touch-target"><Printer className="h-3.5 w-3.5" /> Cetak</Button>
        <Button size="sm" variant="outline" onClick={() => shareKwitansi(k, undefined)} className="touch-target"><Share2 className="h-3.5 w-3.5" /> Share</Button>
      </div>
    </Card>
  );
}

function CreateDialog({ open, onOpenChange, onDone, defaultPenerima }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void; defaultPenerima: string }) {
  const [nominal, setNominal] = useState(0);
  const [penerima, setPenerima] = useState("");
  const [pembayar, setPembayar] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() { setNominal(0); setPenerima(""); setPembayar(""); setKeterangan(""); }

  async function submit() {
    if (!nominal) return toast.error("Nominal wajib diisi");
    setSaving(true);
    const r = await postJSON("/api/kwitansi", { nominal, penerima: penerima || undefined, pembayar: pembayar || undefined, keterangan: keterangan || undefined });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(`Kwitansi ${r.data?.kode || ""} berhasil dibuat`);
    reset();
    onOpenChange(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[min(95vw,460px)] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Buat Kwitansi Baru</DialogTitle>
          <DialogDescription>Kode otomatis dibuat dengan format KWI-YYYY-NNNN.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kw-nominal">Nominal (Rp)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
              <Input
                id="kw-nominal" inputMode="numeric" placeholder="0"
                value={toThousandInput(nominal)}
                onChange={(e) => setNominal(parseRupiahInput(e.target.value))}
                className="touch-target pl-9 text-lg font-bold text-success"
              />
            </div>
            {nominal > 0 && (
              <p className="text-xs italic text-muted-foreground">{kapital(terbilang(nominal))} rupiah</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kw-pembayar">Pembayar</Label>
            <Input id="kw-pembayar" placeholder="Nama warga / pihak ke-3" value={pembayar} onChange={(e) => setPembayar(e.target.value)} className="touch-target" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kw-penerima">Penerima</Label>
            <Input id="kw-penerima" placeholder={defaultPenerima} value={penerima} onChange={(e) => setPenerima(e.target.value)} className="touch-target" />
            <p className="text-xs text-muted-foreground">Default: {defaultPenerima}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kw-ket">Keterangan / Untuk Pembayaran</Label>
            <Textarea id="kw-ket" placeholder="Iuran bulanan / keperluan..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="touch-target">Batal</Button>
          <Button onClick={submit} disabled={saving} className="touch-target">{saving ? "Menyimpan..." : "Simpan Kwitansi"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptDetail({ k, brand, onClose }: { k: Kwitansi; brand: Brand; onClose: () => void }) {
  const pembayar = k.pembayar || "—";
  const penerima = k.penerima || brand?.namaBendahara || DEFAULT_PENERIMA;
  const keterangan = k.keterangan || k.transaksi?.keterangan || "—";
  const hasBank = !!(brand?.bankNama || brand?.bankRekening || brand?.bankPemilik);

  return (
    <div>
      <div className="print-receipt bg-white text-foreground">
        {/* Green banner header */}
        <div className="rounded-t-lg bg-primary px-4 py-5 text-center text-primary-foreground">
          <h1 className="text-2xl font-bold tracking-[0.2em] sm:text-3xl">KWITANSI</h1>
          <p className="mt-1 text-xs font-medium opacity-90 sm:text-sm">{brand?.namaRT || SUBTITLE}</p>
          <p className="mt-0.5 text-[10px] opacity-80 sm:text-[11px]">{SUBTITLE}</p>
        </div>

        <div className="border-x border-b border-primary/30 px-4 py-5 sm:px-6">
          {/* Code + date */}
          <div className="flex items-center justify-between border-b border-dashed border-primary/30 pb-3 text-xs sm:text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">No. Kwitansi</p>
              <p className="font-mono font-bold">{k.kode}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tanggal</p>
              <p className="font-semibold">{formatTanggalLengkapID(k.tanggal)}</p>
            </div>
          </div>

          {/* Fields */}
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Telah terima dari</dt>
              <dd className="mt-0.5 text-base font-bold">{pembayar}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Uang sejumlah</dt>
              <dd className="mt-1 text-2xl font-bold leading-tight text-success sm:text-3xl">{formatRupiah(k.nominal)}</dd>
              <dd className="mt-1 text-xs italic text-muted-foreground sm:text-sm">({kapital(terbilang(k.nominal))} rupiah)</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Untuk pembayaran</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm">{keterangan}</dd>
            </div>
          </dl>

          {/* Signature */}
          <div className="mt-8 flex justify-end">
            <div className="w-44 text-center">
              {k.ttdUrl ? (
                <div className="mx-auto mb-1 h-16 w-full">
                  <Image src={k.ttdUrl} alt="Tanda tangan" width={160} height={64} unoptimized className="mx-auto h-16 w-auto object-contain" />
                </div>
              ) : (
                <div className="h-16" />
              )}
              <div className="border-t border-foreground pt-1">
                <p className="text-sm font-semibold">{penerima}</p>
                <p className="text-[10px] text-muted-foreground">Bendahara RT 002</p>
              </div>
            </div>
          </div>
        </div>

        {/* QRIS + Bank footer */}
        <div className="border-x border-b border-primary/30 bg-primary/5 px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
            {brand?.qrisImage ? (
              <div className="flex flex-col items-center text-center">
                <div className="rounded-lg border border-primary/30 bg-white p-1.5">
                  <Image src={brand.qrisImage} alt="QRIS pembayaran" width={120} height={120} unoptimized className="h-[120px] w-[120px] object-contain" />
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-primary"><QrCode className="h-3 w-3" /> Scan QRIS untuk pembayaran</p>
              </div>
            ) : brand?.qrisUrl ? (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-[120px] w-[120px] items-center justify-center rounded-lg border border-dashed border-primary/40 bg-white">
                  <QrCode className="h-10 w-10 text-primary/60" />
                </div>
                <a href={brand.qrisUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 break-all text-[10px] font-medium text-primary underline">Bayar via QRIS</a>
              </div>
            ) : null}

            {hasBank && (
              <div className="flex-1 text-left text-xs">
                <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground"><Building2 className="h-3.5 w-3.5 text-primary" /> Transfer Bank</p>
                <dl className="space-y-0.5 text-muted-foreground">
                  {brand?.bankNama && (<div className="flex gap-1.5"><dt className="w-14 shrink-0">Bank</dt><dd className="font-medium text-foreground">{brand.bankNama}</dd></div>)}
                  {brand?.bankRekening && (<div className="flex gap-1.5"><dt className="w-14 shrink-0">No. Rek</dt><dd className="font-mono font-semibold text-foreground">{brand.bankRekening}</dd></div>)}
                  {brand?.bankPemilik && (<div className="flex gap-1.5"><dt className="w-14 shrink-0">Atas nama</dt><dd className="text-foreground">{brand.bankPemilik}</dd></div>)}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="rounded-b-lg bg-primary px-4 py-1.5 text-center text-[10px] text-primary-foreground">
          Dokumen sah diterbitkan oleh {brand?.namaRT || "RT 002 Blok Mawar"} · {SUBTITLE}
        </div>
      </div>

      {/* Actions */}
      <div className="no-print flex flex-wrap gap-2 p-4">
        <Button variant="ghost" onClick={onClose} className="touch-target">Tutup</Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => shareKwitansi(k, brand)} className="touch-target"><Share2 className="h-4 w-4" /> Share</Button>
          <Button
            variant="outline"
            onClick={() => { toast.info("Gunakan tombol Cetak lalu pilih Simpan sebagai PDF"); window.print(); }}
            className="touch-target"
          ><Download className="h-4 w-4" /> Unduh PDF</Button>
          <Button onClick={() => window.print()} className="touch-target"><Printer className="h-4 w-4" /> Cetak</Button>
        </div>
      </div>
    </div>
  );
}

async function shareKwitansi(k: Kwitansi, brand?: Brand) {
  const penerima = k.penerima || brand?.namaBendahara || DEFAULT_PENERIMA;
  const keterangan = k.keterangan || k.transaksi?.keterangan || "—";
  const text =
    `KWITANSI ${k.kode}\n` +
    `${RT_INFO.namaLengkap}\n` +
    `Tanggal: ${formatTanggalLengkapID(k.tanggal)}\n` +
    `Telah terima dari: ${k.pembayar || "—"}\n` +
    `Uang sejumlah: ${formatRupiah(k.nominal)}\n` +
    `Terbilang: ${kapital(terbilang(k.nominal))} rupiah\n` +
    `Untuk pembayaran: ${keterangan}\n` +
    `Diterima oleh: ${penerima}`;
  const url = typeof window !== "undefined" ? window.location.href : "";
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav && typeof (nav as Navigator & { share?: unknown }).share === "function") {
    try {
      await (nav as Navigator & { share: (d: unknown) => Promise<void> }).share({ title: `Kwitansi ${k.kode}`, text, url });
      return;
    } catch { /* fall through */ }
  }
  try {
    await nav?.clipboard?.writeText(text);
    toast.success("Detail kwitansi disalin ke clipboard");
  } catch {
    toast.info("Salin manual: " + k.kode);
  }
}
