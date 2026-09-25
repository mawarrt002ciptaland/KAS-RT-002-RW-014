"use client";

import { useMemo, useState } from "react";
import { useFetch, postJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMounted } from "@/hooks/use-mounted";
import { KATEGORI_PEMASUKAN, KATEGORI_PENGELUARAN } from "@/lib/constants";
import { formatRupiah, formatTanggalID, formatTanggalLengkapID, toISODate, parseRupiahInput, toThousandInput, relativeTime, BULAN_ID } from "@/lib/format";
import { PageHeader, StatCard, SectionTitle, EmptyState, ErrorState, CardSkeleton, TrendBadge, RupiahText } from "@/components/shared";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Plus, Search, Filter, Eye, Trash2, Printer, Camera, X, Calendar, ChevronDown, ChevronRight, Wallet, Hash, Receipt } from "lucide-react";

type Jenis = "pemasukan" | "pengeluaran";

interface Transaksi {
  id: string;
  kode: string;
  jenis: Jenis;
  tanggal: string;
  kategori: string;
  keterangan: string;
  nominal: number;
  penerima?: string | null;
  sumber?: string | null;
  metode: string;
  buktiUrl?: string | null;
  status: string;
  wargaId?: string | null;
  createdAt: string;
}

interface ListResponse {
  items: Transaksi[];
  total: number;
  count: number;
}

const METODE_LIST = ["Tunai", "Transfer", "QRIS"];

interface MonthGroup {
  monthIdx: number;
  monthName: string;
  items: Transaksi[];
  total: number;
}

/** Group transaksi by month for a given year (ascending Jan→Des, only months with items). */
function groupByMonth(items: Transaksi[], year: number): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (let i = 0; i < 12; i++) {
    groups.push({ monthIdx: i, monthName: BULAN_ID[i], items: [], total: 0 });
  }
  for (const t of items) {
    const d = new Date(t.tanggal);
    if (Number.isNaN(d.getTime())) continue;
    if (d.getFullYear() !== year) continue;
    groups[d.getMonth()].items.push(t);
    groups[d.getMonth()].total += t.nominal || 0;
  }
  // Sort items within each month ascending by date for stable display
  for (const g of groups) {
    g.items.sort((a, b) => +new Date(a.tanggal) - +new Date(b.tanggal));
  }
  return groups.filter((g) => g.items.length > 0);
}

interface RowProps {
  items: Transaksi[];
  isPemasukan: boolean;
  nominalColor: string;
  sign: string;
  onDetail: (t: Transaksi) => void;
  onDelete: (t: Transaksi) => void;
}

/** ====== BASE VIEW ====== */
function TransaksiViewBase({ jenis }: { jenis: Jenis }) {
  const isPemasukan = jenis === "pemasukan";
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState<string>("all");
  // Lazy init: server-safe 2026, client uses current year (no setState-in-effect).
  const [year, setYear] = useState<number>(() =>
    typeof window !== "undefined" ? new Date().getFullYear() : 2026,
  );
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Transaksi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaksi | null>(null);
  const [deleting, setDeleting] = useState(false);

  const kategoriList = isPemasukan ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;
  const title = isPemasukan ? "Pemasukan" : "Pengeluaran";
  const Icon = isPemasukan ? TrendingUp : TrendingDown;
  const tone = isPemasukan ? ("income" as const) : ("expense" as const);
  const nominalColor = isPemasukan ? "text-success" : "text-destructive";
  const sign = isPemasukan ? "+" : "−";

  const queryString = useMemo(() => {
    const p = new URLSearchParams({ jenis });
    if (kategori && kategori !== "all") p.set("kategori", kategori);
    if (q.trim()) p.set("q", q.trim());
    p.set("limit", "200");
    return `?${p.toString()}`;
  }, [jenis, kategori, q]);

  const { data, loading, error, refetch } = useFetch<ListResponse>(
    `/api/transaksi${queryString}`,
  );
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const count = data?.count ?? 0;

  // Year options: union of data years + selected year + (after mount) current year.
  const yearOptions = useMemo(() => {
    const set = new Set<number>([year]);
    if (mounted) set.add(new Date().getFullYear());
    for (const t of items) {
      const y = new Date(t.tanggal).getFullYear();
      if (!Number.isNaN(y)) set.add(y);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [items, mounted, year]);

  const monthGroups = useMemo(() => groupByMonth(items, year), [items, year]);
  const yearTotal = useMemo(() => monthGroups.reduce((s, g) => s + g.total, 0), [monthGroups]);
  const yearCount = useMemo(() => monthGroups.reduce((s, g) => s + g.items.length, 0), [monthGroups]);

  const bulanIni = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return items.filter((t) => { const d = new Date(t.tanggal); return d.getFullYear() === y && d.getMonth() === m; }).reduce((s, t) => s + (t.nominal || 0), 0);
  }, [items]);
  const rataRata = count > 0 ? Math.round(total / count) : 0;

  function toggleCollapse(idx: number) {
    setCollapsed((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const r = await deleteJSON(`/api/transaksi/${deleteTarget.id}`);
    setDeleting(false);
    if (!r.ok) return toast.error(r.error || "Gagal menghapus");
    toast.success("Transaksi dihapus");
    setDeleteTarget(null);
    setDetailItem(null);
    refetch();
  }

  const baseRow: Pick<RowProps, "isPemasukan" | "nominalColor" | "sign" | "onDetail" | "onDelete"> = { isPemasukan, nominalColor, sign, onDetail: setDetailItem, onDelete: setDeleteTarget };

  return (
    <div className="space-y-5">
      <PageHeader title={title} description={`Catat & kelola ${title.toLowerCase()} kas RT 002 per bulan`} icon={<Icon className="h-5 w-5" />} actions={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Catat {title}</Button>} />

      {/* Summary StatCards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={`Total ${title}`} tone={tone} value={<RupiahText value={total} />} icon={<Wallet className="h-5 w-5" />} hint={`Akumulasi ${count} transaksi`} />
        <StatCard title="Jumlah Transaksi" tone="neutral" value={count} icon={<Hash className="h-5 w-5" />} hint={kategori !== "all" ? `Filter: ${kategori}` : "Tanpa filter"} />
        <StatCard title="Bulan Ini" tone={tone} value={<RupiahText value={bulanIni} />} icon={<Calendar className="h-5 w-5" />} hint={mounted ? formatTanggalID(new Date()) : "\u00A0"} />
        <StatCard title="Rata-rata / Transaksi" tone="default" value={<RupiahText value={rataRata} />} icon={<Receipt className="h-5 w-5" />} hint="Nilai rata-rata" />
      </div>

      {/* Filter bar: search + kategori + year selector (mobile stacked) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari keterangan, kode, nama…" className="touch-target pl-9" aria-label="Cari transaksi" />
          {q && (
            <button type="button" onClick={() => setQ("")} className="touch-target absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent" aria-label="Hapus pencarian">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={kategori} onValueChange={setKategori}>
            <SelectTrigger className="touch-target w-full sm:w-52" aria-label="Filter kategori"><Filter className="mr-1 h-4 w-4" /><SelectValue placeholder="Semua kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {kategoriList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="touch-target w-full sm:w-32" aria-label="Filter tahun"><Calendar className="mr-1 h-4 w-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          {(q || kategori !== "all") && (
            <Button variant="outline" size="sm" onClick={() => { setQ(""); setKategori("all"); }} className="touch-target" aria-label="Reset filter"><X className="h-4 w-4" /><span className="hidden md:inline">Semua</span></Button>
          )}
        </div>
      </div>

      {/* Monthly grouping */}
      <section>
        <SectionTitle title={`Buku Kas ${title} ${year}`} action={<span className="text-xs text-muted-foreground">{yearCount} transaksi • {monthGroups.length} bulan</span>} />

        {loading ? (
          <div className="grid gap-3">{Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : items.length === 0 ? (
          <EmptyState icon={<Icon className="h-6 w-6" />} title={`Belum ada ${title.toLowerCase()}`} description={`Mulai catat ${title.toLowerCase()} kas RT dengan menekan tombol "Catat ${title}".`} action={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Catat {title}</Button>} />
        ) : monthGroups.length === 0 ? (
          <EmptyState icon={<Calendar className="h-6 w-6" />} title={`Tidak ada transaksi tahun ${year}`} description={`Tidak ada ${title.toLowerCase()} tercatat di tahun ${year}. Pilih tahun lain atau catat transaksi baru.`} action={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Catat {title}</Button>} />
        ) : (
          <div className="space-y-4">
            {monthGroups.map((g) => {
              const isCollapsed = collapsed.has(g.monthIdx);
              const rowProps: RowProps = { ...baseRow, items: g.items };
              return (
                <div key={g.monthIdx} className="rounded-xl border bg-card">
                  {/* Sticky month header bar */}
                  <div className="sticky top-16 z-20 flex items-center gap-2 rounded-t-xl border-b bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                    <button type="button" onClick={() => toggleCollapse(g.monthIdx)} className="touch-target -ml-1 rounded-md p-1.5 hover:bg-accent" aria-label={isCollapsed ? `Buka ${g.monthName}` : `Tutup ${g.monthName}`} aria-expanded={!isCollapsed}>
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <Calendar className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                    <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{g.monthName} {year}</h3>
                    <Badge variant="secondary" className="shrink-0 text-[11px]">{g.items.length} trx</Badge>
                    <p className={`shrink-0 text-sm font-bold tabular-nums ${nominalColor}`}>{sign}{formatRupiah(g.total)}</p>
                  </div>
                  {!isCollapsed && (
                    <>
                      {isMobile ? <MobileCardList {...rowProps} /> : <div className="overflow-x-auto scrollbar-thin"><DesktopTable {...rowProps} /></div>}
                      <div className="flex items-center justify-between rounded-b-xl border-t bg-muted/40 px-3 py-2 text-sm">
                        <span className="font-medium">Total {g.monthName}</span>
                        <span className={`font-bold tabular-nums ${nominalColor}`}>{sign}{formatRupiah(g.total)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <div className={`flex flex-col gap-2 rounded-xl border-2 p-4 sm:flex-row sm:items-center sm:justify-between ${isPemasukan ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isPemasukan ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}><Icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Total Tahun {year}</p>
                  <p className="text-sm font-medium">{yearCount} transaksi • {monthGroups.length} bulan aktif</p>
                </div>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${nominalColor}`}>{sign}{formatRupiah(yearTotal)}</p>
            </div>
          </div>
        )}
      </section>

      {/* Create Dialog */}
      <CreateTransaksiDialog open={createOpen} onOpenChange={setCreateOpen} jenis={jenis} kategoriList={kategoriList} onDone={refetch} />

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(o) => !o && setDetailItem(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {detailItem && (
            <DetailBody trx={detailItem} isPemasukan={isPemasukan} nominalColor={nominalColor} sign={sign} onPrint={() => toast.info("Membuka dialog cetak kwitansi…")} onDelete={() => setDeleteTarget(detailItem)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kode} — {deleteTarget?.keterangan}. Tindakan ini tidak dapat dibatalkan. Kwitansi terkait juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="touch-target">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="touch-target bg-destructive text-white hover:bg-destructive/90">
              {deleting ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** ====== MOBILE CARD LIST ====== */
function MobileCardList({ items, isPemasukan, nominalColor, sign, onDetail, onDelete }: RowProps) {
  const Icon = isPemasukan ? TrendingUp : TrendingDown;
  return (
    <div className="divide-y">
      {items.map((t) => (
        <div key={t.id} className="flex items-start gap-3 p-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isPemasukan ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}><Icon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{t.keterangan}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[11px]">{t.kategori}</Badge>
              <span>•</span>
              <span className="truncate font-mono">{t.kode}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{formatTanggalID(t.tanggal)} • {(isPemasukan ? t.sumber : t.penerima) || "-"}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className={`text-sm font-bold tabular-nums ${nominalColor}`}>{sign}{formatRupiah(t.nominal)}</p>
            <div className="flex gap-1">
              <button onClick={() => onDetail(t)} className="touch-target rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Lihat detail"><Eye className="h-4 w-4" /></button>
              <button onClick={() => onDelete(t)} className="touch-target rounded-md p-1.5 text-destructive hover:bg-destructive/10" aria-label="Hapus transaksi"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** ====== DESKTOP TABLE ====== */
function DesktopTable({ items, isPemasukan, nominalColor, sign, onDetail, onDelete }: RowProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Kode</TableHead>
          <TableHead>Keterangan</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>{isPemasukan ? "Sumber" : "Penerima"}</TableHead>
          <TableHead className="text-right">Nominal</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="whitespace-nowrap text-sm">{formatTanggalID(t.tanggal)}</TableCell>
            <TableCell className="max-w-[120px] truncate font-mono text-xs text-muted-foreground">{t.kode}</TableCell>
            <TableCell className="max-w-[260px] truncate text-sm font-medium">{t.keterangan}</TableCell>
            <TableCell><Badge variant="secondary" className="text-[11px]">{t.kategori}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">{(isPemasukan ? t.sumber : t.penerima) || "-"}</TableCell>
            <TableCell className={`whitespace-nowrap text-right text-sm font-bold tabular-nums ${nominalColor}`}>{sign}{formatRupiah(t.nominal)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onDetail(t)} aria-label="Lihat detail" className="touch-target"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(t)} aria-label="Hapus transaksi" className="touch-target text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** ====== DETAIL BODY ====== */
function DetailBody({ trx, isPemasukan, nominalColor, sign, onPrint, onDelete }: { trx: Transaksi; isPemasukan: boolean; nominalColor: string; sign: string; onPrint: () => void; onDelete: () => void; }) {
  const rows: { label: string; value: string }[] = [
    { label: "Kode", value: trx.kode },
    { label: "Tanggal", value: formatTanggalLengkapID(trx.tanggal) },
    { label: "Kategori", value: trx.kategori },
    { label: "Keterangan", value: trx.keterangan },
    { label: isPemasukan ? "Sumber" : "Penerima", value: (isPemasukan ? trx.sumber : trx.penerima) || "-" },
    { label: "Metode", value: trx.metode },
    { label: "Status", value: trx.status },
    { label: "Dibuat", value: relativeTime(trx.createdAt) },
  ];
  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="min-w-0">
            <DialogTitle className="truncate">{trx.keterangan}</DialogTitle>
            <DialogDescription className="mt-0.5 font-mono text-xs">{trx.kode}</DialogDescription>
          </div>
          <TrendBadge jenis={trx.jenis} />
        </div>
      </DialogHeader>
      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="text-xs text-muted-foreground">Nominal</p>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${nominalColor}`}>{sign}{formatRupiah(trx.nominal)}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</dt>
            <dd className="mt-0.5 break-words text-sm font-medium">{r.value}</dd>
          </div>
        ))}
        {trx.buktiUrl && (
          <div className="col-span-2 min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Bukti</dt>
            <dd className="mt-0.5 break-words text-sm font-medium text-primary">{trx.buktiUrl}</dd>
          </div>
        )}
      </dl>
      <DialogFooter>
        <Button variant="outline" onClick={onDelete} className="touch-target text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Hapus</Button>
        <Button onClick={onPrint} className="touch-target"><Printer className="h-4 w-4" /> Cetak Kwitansi</Button>
      </DialogFooter>
    </>
  );
}

/** ====== CREATE DIALOG ====== */
function CreateTransaksiDialog({ open, onOpenChange, jenis, kategoriList, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; jenis: Jenis; kategoriList: string[]; onDone: () => void; }) {
  const isPemasukan = jenis === "pemasukan";
  const title = isPemasukan ? "Catat Pemasukan" : "Catat Pengeluaran";

  const [tanggal, setTanggal] = useState<string>(() =>
    typeof window !== "undefined" ? toISODate(new Date()) : "2026-01-01",
  );
  const [kategori, setKategori] = useState<string>(kategoriList[0] ?? "");
  const [keterangan, setKeterangan] = useState("");
  const [nominal, setNominal] = useState(0);
  const [penerimaSumber, setPenerimaSumber] = useState("");
  const [metode, setMetode] = useState<string>("Tunai");
  const [buktiName, setBuktiName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  function resetForm() {
    setTanggal(typeof window !== "undefined" ? toISODate(new Date()) : "2026-01-01");
    setKategori(kategoriList[0] ?? "");
    setKeterangan("");
    setNominal(0);
    setPenerimaSumber("");
    setMetode("Tunai");
    setBuktiName("");
    setTouched(false);
  }

  const keteranganInvalid = !keterangan.trim();
  const nominalInvalid = !nominal || nominal <= 0;
  const hasError = touched && (keteranganInvalid || nominalInvalid);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (keteranganInvalid || nominalInvalid) return;
    setSaving(true);
    const body: Record<string, unknown> = { jenis, kategori, keterangan: keterangan.trim(), nominal, tanggal, metode, buktiUrl: buktiName || undefined };
    if (isPemasukan) body.sumber = penerimaSumber.trim() || undefined;
    else body.penerima = penerimaSumber.trim() || undefined;
    const r = await postJSON("/api/transaksi", body);
    setSaving(false);
    if (!r.ok) return toast.error(r.error || "Gagal menyimpan");
    toast.success(`${isPemasukan ? "Pemasukan" : "Pengeluaran"} berhasil dicatat`);
    resetForm();
    onOpenChange(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Isi data {title.toLowerCase()} kas RT 002. Kode & kwitansi dibuat otomatis.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="trx-tanggal">Tanggal</Label>
              <Input id="trx-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="touch-target" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="trx-kategori">Kategori</Label>
              <Select value={kategori} onValueChange={setKategori}>
                <SelectTrigger id="trx-kategori" className="touch-target w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>{kategoriList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="trx-ket">Keterangan</Label>
            <Input id="trx-ket" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder={isPemasukan ? "Contoh: Iuran bulanan warga Blok Mawar" : "Contoh: Pembelian perlengkapan kebersihan"} className="touch-target" aria-invalid={hasError && keteranganInvalid} required />
            {hasError && keteranganInvalid && <p className="text-xs text-destructive">Keterangan wajib diisi.</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="trx-nominal">Nominal (Rp)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
              <Input id="trx-nominal" inputMode="numeric" value={toThousandInput(nominal)} onChange={(e) => setNominal(parseRupiahInput(e.target.value))} placeholder="0" className="touch-target pl-9 tabular-nums" aria-invalid={hasError && nominalInvalid} required />
            </div>
            {hasError && nominalInvalid && <p className="text-xs text-destructive">Nominal harus &gt; 0.</p>}
            <p className="text-xs text-muted-foreground">{formatRupiah(nominal)}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="trx-penerima">{isPemasukan ? "Sumber" : "Penerima"}</Label>
              <Input id="trx-penerima" value={penerimaSumber} onChange={(e) => setPenerimaSumber(e.target.value)} placeholder={isPemasukan ? "Warga / Donatur" : "Nama penerima / vendor"} className="touch-target" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="trx-metode">Metode</Label>
              <Select value={metode} onValueChange={setMetode}>
                <SelectTrigger id="trx-metode" className="touch-target w-full"><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                <SelectContent>{METODE_LIST.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="trx-bukti">Bukti Transaksi</Label>
            <label htmlFor="trx-bukti" className="touch-target flex cursor-pointer items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              <Camera className="h-4 w-4" /><span className="truncate">{buktiName || "Pilih foto / ambil dari kamera"}</span>
            </label>
            <Input id="trx-bukti" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setBuktiName(e.target.files?.[0]?.name ?? "")} />
            {buktiName && (
              <button type="button" onClick={() => setBuktiName("")} className="touch-target mt-1 inline-flex w-fit items-center gap-1 text-xs text-destructive"><X className="h-3 w-3" /> Hapus berkas</button>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="touch-target">Batal</Button>
            <Button type="submit" disabled={saving} className="touch-target">{saving ? "Menyimpan…" : `Simpan ${title}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** ====== EXPORTED VIEWS ====== */
export function PemasukanView() {
  return <TransaksiViewBase jenis="pemasukan" />;
}
export function PengeluaranView() {
  return <TransaksiViewBase jenis="pengeluaran" />;
}
