"use client";

import { useState } from "react";
import Image from "next/image";
import { useFetch, postJSON } from "@/hooks/use-fetch";
import { useMounted } from "@/hooks/use-mounted";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PageHeader,
  SectionTitle,
  StatCard,
  EmptyState,
  ErrorState,
  CardSkeleton,
  RupiahText,
  Card,
} from "@/components/shared";
import {
  formatRupiah,
  formatTanggalID,
  formatTanggalLengkapID,
  parseRupiahInput,
  toThousandInput,
} from "@/lib/format";
import { RT_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Eye,
  Printer,
  Share2,
  Download,
  Wallet,
  Calendar,
  QrCode,
  Stamp,
} from "lucide-react";

/* ---------------- Types ---------------- */
interface KwitansiTransaksi {
  kode?: string;
  jenis?: string;
  kategori?: string;
  keterangan?: string;
}
interface KwitansiTagihan {
  kode?: string;
  jenis?: string;
  periode?: string;
  warga?: { nama: string; noRumah: string } | null;
}
interface KwitansiWarga {
  nama: string;
  noRumah: string;
}
interface Kwitansi {
  id: string;
  kode: string;
  transaksiId?: string | null;
  transaksi?: KwitansiTransaksi | null;
  tagihanId?: string | null;
  tagihan?: KwitansiTagihan | null;
  wargaId?: string | null;
  warga?: KwitansiWarga | null;
  tanggal: string;
  nominal: number;
  penerima?: string | null;
  pembayar?: string | null;
  keterangan?: string | null;
  ttdUrl?: string | null;
}
interface Brand {
  qrisImage?: string;
  qrisUrl?: string;
  namaBendahara?: string;
  namaKetua?: string;
  namaRT?: string;
  bankNama?: string;
  bankRekening?: string;
  bankPemilik?: string;
}

/* ---------------- Helpers ---------------- */
const DEFAULT_PENERIMA = "Bendahara RT 002";
const SUBTITLE = "RT 002 / RW 014 Blok Mawar Perumahan Ciptaland Batam";
const kapital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Indonesian number-to-words, 0..~999 triliun (covers any realistic RT amount). */
function terbilang(num: number): string {
  num = Math.floor(Math.abs(num));
  if (num === 0) return "nol";
  const SAT = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
  function below1000(x: number): string {
    if (x === 0) return "";
    const ratus = Math.floor(x / 100);
    const sisa = x % 100;
    let s = "";
    if (ratus === 1) s = "seratus";
    else if (ratus > 1) s = SAT[ratus] + " ratus";
    if (sisa > 0) {
      if (s) s += " ";
      if (sisa < 10) s += SAT[sisa];
      else if (sisa === 10) s += "sepuluh";
      else if (sisa === 11) s += "sebelas";
      else if (sisa < 20) s += SAT[sisa - 10] + " belas";
      else {
        const p = Math.floor(sisa / 10);
        const s1 = sisa % 10;
        s += SAT[p] + " puluh";
        if (s1) s += " " + SAT[s1];
      }
    }
    return s;
  }
  const TRILYUN = 1_000_000_000_000;
  const parts: string[] = [];
  const triliun = Math.floor(num / TRILYUN);
  if (triliun > 0) {
    parts.push(triliun === 1 ? "satu triliun" : below1000(triliun) + " triliun");
    num -= triliun * TRILYUN;
  }
  const miliar = Math.floor(num / 1_000_000_000);
  if (miliar > 0) {
    parts.push(miliar === 1 ? "satu miliar" : below1000(miliar) + " miliar");
    num -= miliar * 1_000_000_000;
  }
  const juta = Math.floor(num / 1_000_000);
  if (juta > 0) {
    parts.push(juta === 1 ? "satu juta" : below1000(juta) + " juta");
    num -= juta * 1_000_000;
  }
  const ribu = Math.floor(num / 1000);
  if (ribu > 0) {
    parts.push(ribu === 1 ? "seribu" : below1000(ribu) + " ribu");
    num -= ribu * 1000;
  }
  if (num > 0) parts.push(below1000(num));
  return parts.join(" ").trim();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** Build a full standalone HTML receipt file & trigger download. ALWAYS produces a file. */
function downloadReceiptHtml(k: Kwitansi, brand: Brand) {
  const pembayar = k.pembayar || "—";
  const penerima = k.penerima || brand?.namaBendahara || DEFAULT_PENERIMA;
  const keterangan = k.keterangan || k.transaksi?.keterangan || "—";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const abs = (u?: string) => {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return origin + u;
    return u;
  };
  const hasBank = !!(brand?.bankNama || brand?.bankRekening || brand?.bankPemilik);
  const qrisBlock = brand?.qrisImage
    ? `<div class="qris"><img src="${abs(brand.qrisImage)}" alt="QRIS" width="140" height="140" /><p>Scan QRIS untuk pembayaran</p></div>`
    : brand?.qrisUrl
      ? `<div class="qris"><div class="qris-ph">QRIS</div><a href="${abs(brand.qrisUrl)}">Bayar via QRIS</a></div>`
      : hasBank
        ? `<div class="bank"><p class="bank-title">Transfer Bank</p>` +
          (brand?.bankNama ? `<p><span>Bank</span><b>${escapeHtml(brand.bankNama)}</b></p>` : "") +
          (brand?.bankRekening
            ? `<p><span>No. Rek</span><b class="mono">${escapeHtml(brand.bankRekening)}</b></p>`
            : "") +
          (brand?.bankPemilik
            ? `<p><span>Atas nama</span><b>${escapeHtml(brand.bankPemilik)}</b></p>`
            : "") +
          `</div>`
        : "";
  const ttdBlock = k.ttdUrl
    ? `<img class="ttd" src="${abs(k.ttdUrl)}" alt="Tanda tangan" />`
    : `<div class="ttd-ph"></div>`;
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Kwitansi ${escapeHtml(k.kode)}</title>
<style>
*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;margin:0;padding:16px;background:#f0fdf4;color:#111}
.receipt{max-width:600px;margin:0 auto;background:#fff;border:1px solid #a7f3d0;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(16,185,129,.1)}
.letterhead{background:#10b981;color:#fff;text-align:center;padding:18px 16px}
.letterhead .eyebrow{font-size:10px;letter-spacing:.25em;text-transform:uppercase;opacity:.9;margin:0}
.letterhead h1{font-size:28px;font-weight:800;letter-spacing:.2em;margin:4px 0}
.letterhead .subtitle{font-size:12px;opacity:.95;margin:0}
.letterhead .rule{height:1px;background:rgba(255,255,255,.4);margin:10px auto 0;max-width:320px}
.body{padding:18px;border-left:1px solid #a7f3d0;border-right:1px solid #a7f3d0}
.meta{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px dashed #6ee7b7;padding-bottom:10px}
.meta-label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin:0 0 2px}
.meta-value{font-size:13px;font-weight:700;margin:0}
.meta .kode{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
dl{margin:14px 0 0;padding:0} dl>div{margin-bottom:14px}
dt{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;margin:0 0 4px}
dd{margin:0} dd.pembayar{font-size:17px;font-weight:700}
.terbilang-box{border:2px solid #6ee7b7;background:#ecfdf5;border-radius:8px;padding:8px 10px;font-style:italic;font-size:13px;margin-bottom:6px}
.nominal{font-size:26px;font-weight:800;color:#047857;line-height:1.2}
.footer-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-top:22px;flex-wrap:wrap}
.qris{text-align:center}
.qris img{width:140px;height:140px;border:1px solid #a7f3d0;border-radius:8px;padding:6px;background:#fff}
.qris p{margin:6px 0 0;font-size:10px;color:#047857;font-weight:600}
.qris-ph{width:140px;height:140px;border:1px dashed #6ee7b7;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#10b981;font-weight:700}
.qris a{display:inline-block;margin-top:6px;font-size:11px;color:#047857}
.bank{font-size:12px} .bank-title{font-size:11px;font-weight:600;color:#111;margin:0 0 6px}
.bank p{margin:2px 0;color:#6b7280} .bank b{color:#111;font-weight:600}
.bank .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.sig{width:170px;text-align:center;margin-left:auto}
.sig .label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin:0 0 2px}
.sig .name-sm{font-size:12px;font-weight:600;margin:0 0 6px}
.ttd,.ttd-ph{height:56px;margin:0 auto}
.ttd{max-width:140px;max-height:56px;object-fit:contain}
.sig-line{border-top:1px solid #111;padding-top:4px}
.sig-line p{margin:0;font-size:13px;font-weight:700}
.sig-line small{display:block;font-size:10px;color:#6b7280;margin-top:1px}
.strip{background:#10b981;color:#fff;text-align:center;padding:8px 16px;font-size:10px}
.strip p{margin:0} .strip .ts{opacity:.85;margin-top:2px}
@media print{body{padding:0;background:#fff}.receipt{box-shadow:none}}
</style></head>
<body><div class="receipt">
  <div class="letterhead"><p class="eyebrow">Sistem Informasi RT 002</p><h1>KWITANSI</h1>
    <p class="subtitle">RT 002 / RW 014 Blok Mawar Perumahan Ciptaland Batam</p><div class="rule"></div></div>
  <div class="body">
    <div class="meta"><div><p class="meta-label">No. Kwitansi</p><p class="meta-value kode">${escapeHtml(k.kode)}</p></div>
      <div style="text-align:right"><p class="meta-label">Tanggal</p><p class="meta-value">${escapeHtml(formatTanggalLengkapID(k.tanggal))}</p></div></div>
    <dl>
      <div><dt>Telah terima dari</dt><dd class="pembayar">${escapeHtml(pembayar)}</dd></div>
      <div><dt>Uang sejumlah</dt><dd><div class="terbilang-box">${escapeHtml(kapital(terbilang(k.nominal)))} rupiah</div>
        <div class="nominal">${escapeHtml(formatRupiah(k.nominal))}</div></dd></div>
      <div><dt>Untuk pembayaran</dt><dd style="white-space:pre-wrap;font-size:13px">${escapeHtml(keterangan)}</dd></div>
    </dl>
    <div class="footer-row">${qrisBlock}
      <div class="sig"><p class="label">Diterima oleh</p><p class="name-sm">${escapeHtml(penerima)}</p>${ttdBlock}
        <div class="sig-line"><p>${escapeHtml(penerima)}</p><small>Bendahara RT 002</small></div></div>
    </div>
  </div>
  <div class="strip"><p>Kwitansi ini sah tanpa tanda tangan dan stempel bila menggunakan cap RT</p>
    <p class="ts">${escapeHtml(formatTanggalLengkapID(new Date()))} &middot; ${escapeHtml(brand?.namaRT || "RT 002 Blok Mawar")}</p></div>
</div></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Kwitansi-${k.kode}.html`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // IMPORTANT: delay the revoke so the browser has time to read the blob.
  // Revoking immediately cancels the download in most browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
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
      await (nav as Navigator & { share: (d: unknown) => Promise<void> }).share({
        title: `Kwitansi ${k.kode}`,
        text,
        url,
      });
      return;
    } catch {
      /* fall through to clipboard */
    }
  }
  try {
    await nav?.clipboard?.writeText(text);
    toast.success("Detail kwitansi disalin ke clipboard");
  } catch {
    toast.info("Salin manual: " + k.kode);
  }
}

/* ---------------- Main View ---------------- */
export function KwitansiView() {
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const { data, loading, error, refetch } = useFetch<{ items: Kwitansi[]; brand?: Brand }>(
    "/api/kwitansi?limit=200",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Kwitansi | null>(null);

  const items = data?.items ?? [];
  const brand = data?.brand ?? {};
  const totalNominal = items.reduce((s, k) => s + (k.nominal || 0), 0);
  const todayCount = mounted
    ? items.filter((k) => {
        const d = new Date(k.tanggal);
        const now = new Date();
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kwitansi"
        description="Cetak & kelola kwitansi penerimaan resmi RT 002"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="touch-target">
            <Plus className="h-4 w-4" /> Buat Kwitansi
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          title="Total Kwitansi"
          value={items.length}
          icon={<FileText className="h-5 w-5" />}
          hint="Seluruh periode"
        />
        <StatCard
          title="Nilai Total"
          tone="income"
          value={<RupiahText value={totalNominal} />}
          icon={<Wallet className="h-5 w-5" />}
          hint="Akumulasi nominal"
        />
        <StatCard
          title="Hari Ini"
          tone="neutral"
          value={todayCount}
          icon={<Calendar className="h-5 w-5" />}
          hint="Kwitansi baru"
        />
      </div>

      <section>
        <SectionTitle
          title="Daftar Kwitansi"
          action={<span className="text-xs text-muted-foreground">{items.length} entri</span>}
        />

        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} className="h-24" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Belum ada kwitansi"
            description="Buat kwitansi pertama untuk mencatat penerimaan uang secara resmi."
            action={
              <Button onClick={() => setCreateOpen(true)} className="touch-target">
                <Plus className="h-4 w-4" /> Buat Kwitansi
              </Button>
            }
          />
        ) : isMobile ? (
          <div className="grid gap-2">
            {items.map((k) => (
              <KwitansiMobileCard
                key={k.id}
                k={k}
                brand={brand}
                onLihat={() => setDetail(k)}
              />
            ))}
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
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatTanggalID(k.tanggal)}
                      </TableCell>
                      <TableCell className="text-right">
                        <RupiahText value={k.nominal} className="font-semibold text-success" />
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {k.pembayar || "—"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {k.penerima || brand?.namaBendahara || DEFAULT_PENERIMA}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                        {k.keterangan || k.transaksi?.keterangan || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDetail(k)}
                            aria-label={`Lihat kwitansi ${k.kode}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDetail(k)}
                            aria-label={`Cetak kwitansi ${k.kode}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => shareKwitansi(k, brand)}
                            aria-label={`Bagikan kwitansi ${k.kode}`}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              downloadReceiptHtml(k, brand);
                              toast.success(`File Kwitansi-${k.kode}.html diunduh`);
                            }}
                            aria-label={`Unduh kwitansi ${k.kode}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
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

      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onDone={refetch}
        defaultPenerima={brand?.namaBendahara || DEFAULT_PENERIMA}
      />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[92vh] max-w-[min(95vw,560px)] overflow-y-auto scrollbar-thin p-0">
          {detail && <ReceiptDetail k={detail} brand={brand} onClose={() => setDetail(null)} />}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-receipt, .print-receipt * { visibility: visible !important; }
          .print-receipt { position: absolute !important; left: 0; top: 0; width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Mobile card ---------------- */
function KwitansiMobileCard({
  k,
  brand,
  onLihat,
}: {
  k: Kwitansi;
  brand: Brand;
  onLihat: () => void;
}) {
  return (
    <Card className="card-hover p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs font-bold">{k.kode}</p>
            <Badge variant="outline" className="border-success/30 text-success">
              <Stamp className="h-3 w-3" /> Resmi
            </Badge>
          </div>
          <p className="mt-1 text-base font-bold text-success">{formatRupiah(k.nominal)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatTanggalID(k.tanggal)}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Penerima</span>
          <span className="max-w-[140px] truncate text-xs font-medium">
            {k.penerima || brand?.namaBendahara || DEFAULT_PENERIMA}
          </span>
        </div>
      </div>
      {(k.keterangan || k.transaksi?.keterangan) && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {k.keterangan || k.transaksi?.keterangan}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button size="sm" onClick={onLihat} className="touch-target">
          <Eye className="h-3.5 w-3.5" /> Lihat
        </Button>
        <Button size="sm" variant="outline" onClick={onLihat} className="touch-target">
          <Printer className="h-3.5 w-3.5" /> Cetak
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => shareKwitansi(k, brand)}
          className="touch-target"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            downloadReceiptHtml(k, brand);
            toast.success(`File Kwitansi-${k.kode}.html diunduh`);
          }}
          className="touch-target"
        >
          <Download className="h-3.5 w-3.5" /> Unduh
        </Button>
      </div>
    </Card>
  );
}

/* ---------------- Create dialog ---------------- */
function CreateDialog({
  open,
  onOpenChange,
  onDone,
  defaultPenerima,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
  defaultPenerima: string;
}) {
  const [nominal, setNominal] = useState(0);
  const [penerima, setPenerima] = useState("");
  const [pembayar, setPembayar] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setNominal(0);
    setPenerima("");
    setPembayar("");
    setKeterangan("");
  }

  async function submit() {
    if (!nominal) return toast.error("Nominal wajib diisi");
    setSaving(true);
    const r = await postJSON("/api/kwitansi", {
      nominal,
      penerima: penerima || undefined,
      pembayar: pembayar || undefined,
      keterangan: keterangan || undefined,
    });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(`Kwitansi ${r.data?.kode || ""} dibuat`);
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
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rp
              </span>
              <Input
                id="kw-nominal"
                inputMode="numeric"
                placeholder="0"
                value={toThousandInput(nominal)}
                onChange={(e) => setNominal(parseRupiahInput(e.target.value))}
                className="touch-target pl-9 text-lg font-bold text-success"
              />
            </div>
            {nominal > 0 && (
              <p className="text-xs italic text-muted-foreground">
                {formatRupiah(nominal)} &middot; {kapital(terbilang(nominal))} rupiah
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kw-pembayar">Pembayar</Label>
            <Input
              id="kw-pembayar"
              placeholder="Nama warga / pihak ke-3"
              value={pembayar}
              onChange={(e) => setPembayar(e.target.value)}
              className="touch-target"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kw-penerima">Penerima</Label>
            <Input
              id="kw-penerima"
              placeholder={defaultPenerima}
              value={penerima}
              onChange={(e) => setPenerima(e.target.value)}
              className="touch-target"
            />
            <p className="text-xs text-muted-foreground">Default: {defaultPenerima}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kw-ket">Keterangan / Untuk Pembayaran</Label>
            <Textarea
              id="kw-ket"
              placeholder="Iuran bulanan / keperluan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="touch-target">
            Batal
          </Button>
          <Button onClick={submit} disabled={saving} className="touch-target">
            {saving ? "Menyimpan..." : "Simpan Kwitansi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Receipt detail (print + download) ---------------- */
function ReceiptDetail({ k, brand, onClose }: { k: Kwitansi; brand: Brand; onClose: () => void }) {
  const mounted = useMounted();
  const pembayar = k.pembayar || "—";
  const penerima = k.penerima || brand?.namaBendahara || DEFAULT_PENERIMA;
  const keterangan = k.keterangan || k.transaksi?.keterangan || "—";
  const hasBank = !!(brand?.bankNama || brand?.bankRekening || brand?.bankPemilik);

  return (
    <div>
      <div className="print-receipt bg-white text-foreground">
        {/* Green letterhead */}
        <div className="bg-primary px-4 py-4 text-center text-primary-foreground sm:px-6 sm:py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] opacity-90">
            Sistem Informasi RT 002
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-[0.2em] sm:text-3xl">KWITANSI</h1>
          <p className="mt-1 text-xs opacity-90 sm:text-sm">{SUBTITLE}</p>
          <div className="mx-auto mt-3 h-0.5 w-full max-w-md bg-primary-foreground/40" />
        </div>

        {/* Body */}
        <div className="border-x border-b border-primary/30 px-4 py-5 sm:px-6">
          {/* Meta row */}
          <div className="flex flex-col gap-2 border-b border-dashed border-primary/30 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">No. Kwitansi</p>
              <p className="font-mono text-sm font-bold tracking-wide">{k.kode}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tanggal</p>
              <p className="text-sm font-semibold">
                {mounted ? formatTanggalLengkapID(k.tanggal) : "\u00A0"}
              </p>
            </div>
          </div>

          {/* Fields */}
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Telah terima dari
              </dt>
              <dd className="mt-0.5 text-base font-bold sm:text-lg">{pembayar}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Uang sejumlah
              </dt>
              <dd className="mt-1 rounded-lg border-2 border-primary/30 bg-primary/5 px-3 py-2 text-xs italic text-foreground sm:text-sm">
                {kapital(terbilang(k.nominal))} rupiah
              </dd>
              <dd className="mt-1 text-2xl font-extrabold leading-tight text-success sm:text-3xl">
                {formatRupiah(k.nominal)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Untuk pembayaran
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm">{keterangan}</dd>
            </div>
          </dl>

          {/* Footer two columns */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: QRIS / bank */}
            <div className="text-center sm:text-left">
              {brand?.qrisImage ? (
                <div className="flex flex-col items-center sm:items-start">
                  <div className="rounded-lg border border-primary/30 bg-white p-1.5">
                    <Image
                      src={brand.qrisImage}
                      alt="QRIS pembayaran"
                      width={140}
                      height={140}
                      unoptimized
                      className="h-[140px] w-[140px] object-contain"
                    />
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-primary">
                    <QrCode className="h-3 w-3" /> Scan QRIS untuk pembayaran
                  </p>
                </div>
              ) : brand?.qrisUrl ? (
                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex h-[140px] w-[140px] items-center justify-center rounded-lg border border-dashed border-primary/40 bg-white">
                    <QrCode className="h-12 w-12 text-primary/60" />
                  </div>
                  <a
                    href={brand.qrisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 break-all text-[10px] font-medium text-primary underline"
                  >
                    Bayar via QRIS
                  </a>
                </div>
              ) : hasBank ? (
                <div className="text-left text-xs">
                  <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">
                    <Stamp className="h-3.5 w-3.5 text-primary" /> Transfer Bank
                  </p>
                  <dl className="space-y-0.5 text-muted-foreground">
                    {brand?.bankNama && (
                      <div className="flex gap-1.5">
                        <dt className="w-14 shrink-0">Bank</dt>
                        <dd className="font-medium text-foreground">{brand.bankNama}</dd>
                      </div>
                    )}
                    {brand?.bankRekening && (
                      <div className="flex gap-1.5">
                        <dt className="w-14 shrink-0">No. Rek</dt>
                        <dd className="font-mono font-semibold text-foreground">{brand.bankRekening}</dd>
                      </div>
                    )}
                    {brand?.bankPemilik && (
                      <div className="flex gap-1.5">
                        <dt className="w-14 shrink-0">Atas nama</dt>
                        <dd className="text-foreground">{brand.bankPemilik}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              ) : null}
            </div>

            {/* Right: signature */}
            <div className="w-full text-center sm:w-44">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Diterima oleh
              </p>
              <p className="text-xs font-semibold text-foreground">{penerima}</p>
              <div className="my-2 flex h-14 items-center justify-center">
                {k.ttdUrl ? (
                  <Image
                    src={k.ttdUrl}
                    alt="Tanda tangan"
                    width={140}
                    height={56}
                    unoptimized
                    className="h-14 w-auto object-contain"
                  />
                ) : null}
              </div>
              <div className="border-t border-foreground pt-1">
                <p className="text-sm font-semibold">{penerima}</p>
                <p className="text-[10px] text-muted-foreground">Bendahara RT 002</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="bg-primary px-4 py-2 text-center text-[10px] text-primary-foreground">
          <p className="flex items-center justify-center gap-1.5">
            <Stamp className="h-3 w-3" /> Kwitansi ini sah tanpa tanda tangan dan stempel bila
            menggunakan cap RT
          </p>
          <p className="mt-0.5 opacity-80">
            {mounted ? formatTanggalLengkapID(new Date()) : "\u00A0"} &middot;{" "}
            {brand?.namaRT || "RT 002 Blok Mawar"}
          </p>
        </div>
      </div>

      {/* Action buttons (hidden on print) */}
      <div className="no-print flex flex-wrap gap-2 p-4">
        <Button variant="ghost" onClick={onClose} className="touch-target">
          Tutup
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => shareKwitansi(k, brand)}
            className="touch-target"
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              downloadReceiptHtml(k, brand);
              toast.success(`File Kwitansi-${k.kode}.html diunduh`);
            }}
            className="touch-target"
          >
            <Download className="h-4 w-4" /> Unduh
          </Button>
          <Button onClick={() => window.print()} className="touch-target">
            <Printer className="h-4 w-4" /> Cetak
          </Button>
        </div>
      </div>
    </div>
  );
}
