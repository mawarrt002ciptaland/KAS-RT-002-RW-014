"use client";

import { useState } from "react";
import { useFetch, postJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PageHeader,
  SectionTitle,
  StatCard,
  StatusBadge,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Eye,
  Printer,
  Share2,
  Trash2,
  Receipt,
  Wallet,
  Calendar,
} from "lucide-react";

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

export function KwitansiView() {
  const isMobile = useIsMobile();
  const { data, loading, error, refetch } = useFetch<{ items: Kwitansi[] }>(
    "/api/kwitansi?limit=200"
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Kwitansi | null>(null);

  const items = data?.items ?? [];

  const totalNominal = items.reduce((s, k) => s + (k.nominal || 0), 0);
  const todayCount = items.filter((k) => {
    const d = new Date(k.tanggal);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kwitansi"
        description="Cetak & kelola kwitansi RT 002"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="touch-target">
            <Plus className="h-4 w-4" /> Buat Kwitansi
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          title="Total Kwitansi"
          tone="default"
          value={items.length}
          icon={<Receipt className="h-5 w-5" />}
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

      {/* List */}
      <section>
        <SectionTitle
          title="Daftar Kwitansi"
          action={
            <span className="text-xs text-muted-foreground">
              {items.length} entri
            </span>
          }
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
            description="Buat kwitansi pertama untuk mencatat penerimaan uang."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Buat Kwitansi
              </Button>
            }
          />
        ) : isMobile ? (
          <div className="grid gap-2">
            {items.map((k) => (
              <KwitansiCard
                key={k.id}
                k={k}
                onLihat={() => setDetail(k)}
                onHapus={() => handleDelete(k, refetch)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Pembayar</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {k.kode}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatTanggalID(k.tanggal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <RupiahText value={k.nominal} className="font-semibold" />
                    </TableCell>
                    <TableCell className="text-sm">
                      {k.penerima || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {k.pembayar || "—"}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                      {k.keterangan || k.transaksi?.keterangan || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDetail(k)}
                          aria-label="Lihat kwitansi"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => printKwitansi(k)}
                          aria-label="Cetak kwitansi"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => shareKwitansi(k)}
                          aria-label="Bagikan kwitansi"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(k, refetch)}
                          aria-label="Hapus kwitansi"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* Create Dialog */}
      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onDone={refetch}
      />

      {/* Detail / Print Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[92vh] max-w-[min(95vw,520px)] overflow-y-auto scrollbar-thin">
          {detail && (
            <KwitansiPrintBody k={detail} onClose={() => setDetail(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Print-only container */}
      {detail && (
        <div className="hidden print:block">
          <PrintableKwitansi k={detail} />
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; inset: 0; padding: 16px; }
        }
      `}</style>
    </div>
  );
}

function KwitansiCard({
  k,
  onLihat,
  onHapus,
}: {
  k: Kwitansi;
  onLihat: () => void;
  onHapus: () => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs font-semibold">{k.kode}</p>
            <StatusBadge status="lunas" />
          </div>
          <p className="mt-1 text-sm font-semibold text-success">
            {formatRupiah(k.nominal)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatTanggalID(k.tanggal)}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-[11px] text-muted-foreground">Penerima</span>
          <span className="max-w-[140px] truncate text-xs font-medium">
            {k.penerima || "—"}
          </span>
        </div>
      </div>
      {(k.keterangan || k.transaksi?.keterangan) && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {k.keterangan || k.transaksi?.keterangan}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button size="sm" variant="default" onClick={onLihat} className="touch-target">
          <Eye className="h-3.5 w-3.5" /> Lihat
        </Button>
        <Button size="sm" variant="outline" onClick={() => printKwitansi(k)} className="touch-target">
          <Printer className="h-3.5 w-3.5" /> Cetak
        </Button>
        <Button size="sm" variant="outline" onClick={() => shareKwitansi(k)} className="touch-target">
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onHapus}
          className="touch-target text-destructive"
          aria-label="Hapus"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
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
    toast.success("Kwitansi berhasil dibuat");
    reset();
    onOpenChange(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[min(95vw,440px)] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Buat Kwitansi Baru</DialogTitle>
          <DialogDescription>
            Kode otomatis dibuat dengan format KWI-YYYY-NNNN.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kw-nominal">Nominal (Rp)</Label>
            <Input
              id="kw-nominal"
              inputMode="numeric"
              placeholder="0"
              value={toThousandInput(nominal)}
              onChange={(e) => setNominal(parseRupiahInput(e.target.value))}
              className="touch-target"
            />
            <p className="text-xs text-muted-foreground">
              {formatRupiah(nominal)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kw-penerima">Penerima</Label>
            <Input
              id="kw-penerima"
              placeholder="Bendahara RT 002"
              value={penerima}
              onChange={(e) => setPenerima(e.target.value)}
              className="touch-target"
            />
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
            <Label htmlFor="kw-ket">Keterangan</Label>
            <Textarea
              id="kw-ket"
              placeholder="Untuk pembayaran iuran / keperluan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="touch-target"
          >
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

function KwitansiPrintBody({
  k,
  onClose,
}: {
  k: Kwitansi;
  onClose: () => void;
}) {
  return (
    <div>
      <DialogHeader className="text-center">
        <DialogTitle className="text-center text-xl tracking-wide">
          KWITANSI
        </DialogTitle>
        <DialogDescription className="text-center">
          {RT_INFO.namaLengkap}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 rounded-lg border-2 border-dashed border-primary/40 bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-dashed pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              No. Kwitansi
            </p>
            <p className="font-mono text-sm font-semibold">{k.kode}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tanggal
            </p>
            <p className="text-sm font-semibold">
              {formatTanggalLengkapID(k.tanggal)}
            </p>
          </div>
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Telah terima dari</dt>
            <dd className="font-semibold">{k.pembayar || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Uang sejumlah</dt>
            <dd className="text-lg font-bold text-success">
              {formatRupiah(k.nominal)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Untuk pembayaran</dt>
            <dd className="whitespace-pre-wrap">
              {k.keterangan || k.transaksi?.keterangan || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Diterima oleh</dt>
            <dd className="font-semibold">{k.penerima || "—"}</dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-end">
          <div className="w-40 text-center">
            <div className="h-16" />
            <div className="border-t border-foreground pt-1 text-xs">
              {k.penerima || "Bendahara RT 002"}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="mt-4 sm:justify-between">
        <Button variant="ghost" onClick={onClose} className="touch-target">
          Tutup
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => shareKwitansi(k)}
            className="touch-target"
          >
            <Share2 className="h-4 w-4" /> Bagikan
          </Button>
          <Button onClick={() => printKwitansi(k)} className="touch-target">
            <Printer className="h-4 w-4" /> Cetak / PDF
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}

function PrintableKwitansi({ k }: { k: Kwitansi }) {
  return (
    <div className="print-only mx-auto max-w-md p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-widest">KWITANSI</h1>
        <p className="text-sm">{RT_INFO.namaLengkap}</p>
      </div>
      <div className="mt-4 flex justify-between border-b border-dashed pb-2 text-sm">
        <span>No. {k.kode}</span>
        <span>{formatTanggalLengkapID(k.tanggal)}</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <p>
          Telah terima dari: <strong>{k.pembayar || "—"}</strong>
        </p>
        <p>
          Uang sejumlah:{" "}
          <strong className="text-base">{formatRupiah(k.nominal)}</strong>
        </p>
        <p>
          Untuk pembayaran: {k.keterangan || k.transaksi?.keterangan || "—"}
        </p>
        <p>
          Diterima oleh: <strong>{k.penerima || "—"}</strong>
        </p>
      </div>
      <div className="mt-12 flex justify-end">
        <div className="w-48 text-center text-sm">
          <div className="h-12" />
          <div className="border-t border-black pt-1">
            {k.penerima || "Bendahara RT 002"}
          </div>
        </div>
      </div>
    </div>
  );
}

async function handleDelete(k: Kwitansi, refetch: () => void) {
  if (!confirm(`Hapus kwitansi ${k.kode}?`)) return;
  const r = await deleteJSON(`/api/kwitansi/${k.id}`);
  if (!r.ok) return toast.error(r.error);
  toast.success("Kwitansi dihapus");
  refetch();
}

function printKwitansi(k: Kwitansi) {
  // Render print-only node and trigger print
  const node = document.createElement("div");
  node.className = "print-only";
  node.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "mx-auto max-w-md p-6";
  wrap.innerHTML = `
    <div style="text-align:center">
      <h1 style="font-size:24px;font-weight:700;letter-spacing:4px;margin:0">KWITANSI</h1>
      <p style="font-size:14px;margin:4px 0 0">${RT_INFO.namaLengkap}</p>
    </div>
    <div style="margin-top:16px;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding-bottom:8px;font-size:13px">
      <span>No. ${k.kode}</span><span>${formatTanggalLengkapID(k.tanggal)}</span>
    </div>
    <div style="margin-top:16px;font-size:14px;line-height:1.8">
      <p>Telah terima dari: <strong>${k.pembayar || "—"}</strong></p>
      <p>Uang sejumlah: <strong style="font-size:16px">${formatRupiah(k.nominal)}</strong></p>
      <p>Untuk pembayaran: ${k.keterangan || k.transaksi?.keterangan || "—"}</p>
      <p>Diterima oleh: <strong>${k.penerima || "—"}</strong></p>
    </div>
    <div style="margin-top:48px;display:flex;justify-content:flex-end">
      <div style="width:200px;text-align:center;font-size:13px">
        <div style="height:48px"></div>
        <div style="border-top:1px solid #000;padding-top:4px">${k.penerima || "Bendahara RT 002"}</div>
      </div>
    </div>`;
  node.appendChild(wrap);
  document.body.appendChild(node);
  window.print();
  setTimeout(() => node.remove(), 500);
}

async function shareKwitansi(k: Kwitansi) {
  const text = `Kwitansi ${k.kode}\n${RT_INFO.namaLengkap}\nTelah terima dari: ${k.pembayar || "—"}\nUang sejumlah: ${formatRupiah(k.nominal)}\nUntuk: ${k.keterangan || k.transaksi?.keterangan || "—"}\nDiterima oleh: ${k.penerima || "—"}`;
  const url = typeof window !== "undefined" ? window.location.href : "";
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: `Kwitansi ${k.kode}`, text, url });
      return;
    } catch {
      /* fall through */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Detail kwitansi disalin ke clipboard");
  } catch {
    toast.info("Bagikan manual: " + k.kode);
  }
}
