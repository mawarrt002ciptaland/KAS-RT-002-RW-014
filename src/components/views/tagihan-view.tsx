"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useFetch, postJSON, patchJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, CardSkeleton, RupiahText } from "@/components/shared";
import { formatRupiah, formatTanggalID, toISODate, parseRupiahInput, toThousandInput } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ReceiptText, Plus, Search, Check, Eye, Trash2, Printer, Filter, Calendar, Users } from "lucide-react";

type JenisTagihan = "iuran_bulanan" | "iuran_keamanan" | "iuran_kebersihan" | "lainnya";
type StatusTagihan = "belum_bayar" | "lunas" | "telat";

interface WargaRef { id: string; nama: string; noRumah: string; blok?: string | null }
interface Tagihan {
  id: string; kode: string; wargaId: string; warga: WargaRef;
  jenis: JenisTagihan; periode: string; jumlah: number; denda: number;
  tanggalJatuhTempo: string; status: StatusTagihan;
  tanggalBayar?: string | null; metode?: string | null; keterangan?: string | null;
}
interface TagihanListResponse { items: Tagihan[]; totalNominal: number; totalLunas: number; totalBelum: number; count: number }
interface WargaListResponse { items: WargaRef[] }

const JENIS_OPTIONS: { value: JenisTagihan; label: string }[] = [
  { value: "iuran_bulanan", label: "Iuran Bulanan" },
  { value: "iuran_keamanan", label: "Iuran Keamanan" },
  { value: "iuran_kebersihan", label: "Iuran Kebersihan" },
  { value: "lainnya", label: "Lainnya" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "belum_bayar", label: "Belum Bayar" },
  { value: "lunas", label: "Lunas" },
  { value: "telat", label: "Telat" },
];

const jenisLabel = (j: string) => j.replace(/_/g, " ");

export function TagihanView() {
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodeFilter, setPeriodeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (periodeFilter) params.set("periode", periodeFilter);
    const q = params.toString();
    return `/api/tagihan${q ? "?" + q : ""}`;
  }, [statusFilter, periodeFilter]);

  const { data, loading, error, refetch } = useFetch<TagihanListResponse>(url);
  const { data: wargaData } = useFetch<WargaListResponse>("/api/warga");
  const wargaList = wargaData?.items ?? [];

  const items = (data?.items ?? []).filter((t) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (t.warga?.nama ?? "").toLowerCase().includes(q) || (t.warga?.noRumah ?? "").toLowerCase().includes(q);
  });

  const detailItem = detailId ? (data?.items.find((t) => t.id === detailId) ?? null) : null;

  async function handleTandaiLunas(id: string) {
    const r = await patchJSON(`/api/tagihan/${id}`, { status: "lunas", tanggalBayar: new Date().toISOString() });
    if (!r.ok) return toast.error(r.error);
    toast.success("Tagihan ditandai lunas");
    setDetailId(null);
    refetch();
  }

  async function handleDelete(id: string) {
    const r = await deleteJSON(`/api/tagihan/${id}`);
    if (!r.ok) return toast.error(r.error);
    toast.success("Tagihan dihapus");
    setDetailId(null);
    refetch();
  }

  function handleCetak(item: Tagihan) {
    if (item.status !== "lunas") return toast.info("Tagihan belum lunas — kwitansi belum tersedia");
    toast.info("Mencetak kwitansi...");
    setTimeout(() => window.print(), 400);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tagihan Warga"
        description="Kelola tagihan iuran warga"
        icon={<ReceiptText className="h-5 w-5" />}
        actions={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Buat Tagihan</Button>}
      />

      {/* Stat cards */}
      {loading && !data ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-28" />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Tunggakan" tone="warning" value={<RupiahText value={data.totalNominal} />} icon={<ReceiptText className="h-5 w-5" />} hint="Belum + telat bayar" />
          <StatCard title="Tagihan Lunas" tone="income" value={data.totalLunas} icon={<Check className="h-5 w-5" />} hint="Sudah dibayar" />
          <StatCard title="Belum Bayar" tone="expense" value={data.totalBelum} icon={<Calendar className="h-5 w-5" />} hint="Termasuk telat" />
          <StatCard title="Total Tagihan" value={data.count} icon={<Users className="h-5 w-5" />} hint="Seluruh record" />
        </div>
      ) : null}

      {/* Filter bar — mobile stacked */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="touch-target w-full" aria-label="Filter status tagihan">
            <span className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue placeholder="Semua Status" /></span>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="month" value={periodeFilter} onChange={(e) => setPeriodeFilter(e.target.value)} className="touch-target pl-9" aria-label="Filter periode tagihan" />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama warga..." className="touch-target pl-9" aria-label="Cari warga" />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} className="h-20" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="Belum ada tagihan" description="Tambah tagihan iuran untuk warga RT 002." action={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Buat Tagihan</Button>} />
      ) : isMobile ? (
        <div className="space-y-2">
          {items.map((t) => <TagihanCard key={t.id} item={t} onDetail={() => setDetailId(t.id)} onLunas={() => handleTandaiLunas(t.id)} />)}
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">Warga</th>
                <th className="px-3 py-2.5 font-medium">Jenis</th>
                <th className="px-3 py-2.5 font-medium">Periode</th>
                <th className="px-3 py-2.5 text-right font-medium">Jumlah</th>
                <th className="px-3 py-2.5 font-medium">Jatuh Tempo</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{t.warga?.nama}</p>
                    <p className="text-xs text-muted-foreground">No. {t.warga?.noRumah}{t.warga?.blok ? ` • Blok ${t.warga.blok}` : ""}</p>
                  </td>
                  <td className="px-3 py-2.5 capitalize">{jenisLabel(t.jenis)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{t.periode}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <p className="font-semibold">{formatRupiah(t.jumlah + (t.denda || 0))}</p>
                    {t.denda ? <p className="text-[11px] text-destructive">+{formatRupiah(t.denda)}</p> : null}
                  </td>
                  <td className="px-3 py-2.5">{formatTanggalID(t.tanggalJatuhTempo)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="touch-target" onClick={() => setDetailId(t.id)} aria-label="Lihat detail tagihan"><Eye className="h-4 w-4" /></Button>
                      {t.status !== "lunas" && (
                        <Button size="sm" variant="outline" className="touch-target" onClick={() => handleTandaiLunas(t.id)}><Check className="h-4 w-4" /> Lunas</Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="touch-target text-destructive hover:text-destructive" aria-label="Hapus tagihan"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus tagihan?</AlertDialogTitle>
                            <AlertDialogDescription>Tagihan {t.kode} akan dihapus permanen beserta kwitansi terkait.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => handleDelete(t.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateTagihanDialog open={createOpen} onOpenChange={setCreateOpen} wargaList={wargaList} onCreated={refetch} />
      <DetailTagihanDialog item={detailItem} onOpenChange={(v) => !v && setDetailId(null)} onTandaiLunas={handleTandaiLunas} onDelete={handleDelete} onCetak={handleCetak} />
    </div>
  );
}

function TagihanCard({ item, onDetail, onLunas }: { item: Tagihan; onDetail: () => void; onLunas: () => void }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.warga?.nama} — No. {item.warga?.noRumah}</p>
          <p className="text-xs text-muted-foreground capitalize">{jenisLabel(item.jenis)} • Periode {item.periode}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-muted-foreground">Jumlah</p>
          <p className="text-sm font-bold tabular-nums">{formatRupiah(item.jumlah + (item.denda || 0))}</p>
          {item.denda ? <p className="text-[11px] text-destructive">+ denda {formatRupiah(item.denda)}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Jatuh tempo</p>
          <p className="text-xs font-medium">{formatTanggalID(item.tanggalJatuhTempo)}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" className="touch-target flex-1" onClick={onDetail}><Eye className="h-4 w-4" /> Detail</Button>
        {item.status !== "lunas" && (
          <Button size="sm" className="touch-target flex-1" onClick={onLunas}><Check className="h-4 w-4" /> Tandai Lunas</Button>
        )}
      </div>
    </div>
  );
}

function CreateTagihanDialog({ open, onOpenChange, wargaList, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; wargaList: WargaRef[]; onCreated: () => void }) {
  const [wargaId, setWargaId] = useState("");
  const [jenis, setJenis] = useState<JenisTagihan>("iuran_bulanan");
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [jumlahStr, setJumlahStr] = useState("");
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState(toISODate(new Date()));
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setWargaId(""); setJenis("iuran_bulanan"); setJumlahStr(""); setKeterangan("");
    setPeriode(new Date().toISOString().slice(0, 7)); setTanggalJatuhTempo(toISODate(new Date()));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!wargaId) return toast.error("Pilih warga terlebih dahulu");
    const jumlah = parseRupiahInput(jumlahStr);
    if (!jumlah) return toast.error("Jumlah harus diisi");
    setSaving(true);
    const r = await postJSON("/api/tagihan", { wargaId, jenis, periode, jumlah, tanggalJatuhTempo, keterangan: keterangan || undefined });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Tagihan dibuat");
    reset();
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Tagihan Iuran</DialogTitle>
          <DialogDescription>Tambah tagihan iuran untuk warga RT 002.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wargaId">Warga</Label>
            <Select value={wargaId} onValueChange={setWargaId}>
              <SelectTrigger id="wargaId" className="touch-target w-full"><SelectValue placeholder="Pilih warga" /></SelectTrigger>
              <SelectContent>
                {wargaList.map((w) => <SelectItem key={w.id} value={w.id}>{w.nama} — No. {w.noRumah}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jenis">Jenis</Label>
              <Select value={jenis} onValueChange={(v) => setJenis(v as JenisTagihan)}>
                <SelectTrigger id="jenis" className="touch-target w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JENIS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="periode">Periode</Label>
              <Input id="periode" type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} className="touch-target" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jumlah">Jumlah (Rp)</Label>
              <Input id="jumlah" inputMode="numeric" value={jumlahStr} onChange={(e) => setJumlahStr(toThousandInput(parseRupiahInput(e.target.value)))} placeholder="0" className="touch-target" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jatuhTempo">Tanggal Jatuh Tempo</Label>
              <Input id="jatuhTempo" type="date" value={tanggalJatuhTempo} onChange={(e) => setTanggalJatuhTempo(e.target.value)} className="touch-target" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="keterangan">Keterangan (opsional)</Label>
            <Textarea id="keterangan" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} placeholder="Catatan tambahan..." className="touch-target" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" className="touch-target">Batal</Button></DialogClose>
            <Button type="submit" disabled={saving} className="touch-target"><Plus className="h-4 w-4" /> {saving ? "Menyimpan..." : "Buat Tagihan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DetailTagihanDialog({ item, onOpenChange, onTandaiLunas, onDelete, onCetak }: {
  item: Tagihan | null;
  onOpenChange: (v: boolean) => void;
  onTandaiLunas: (id: string) => void;
  onDelete: (id: string) => void;
  onCetak: (item: Tagihan) => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {item ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> {item.kode}</DialogTitle>
              <DialogDescription>Detail tagihan iuran warga.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Warga</p>
                <p className="text-sm font-semibold">{item.warga?.nama}</p>
                <p className="text-xs text-muted-foreground">No. {item.warga?.noRumah}{item.warga?.blok ? ` • Blok ${item.warga.blok}` : ""}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Field label="Jenis" value={<span className="capitalize">{jenisLabel(item.jenis)}</span>} />
                <Field label="Periode" value={item.periode} />
                <Field label="Jumlah" value={formatRupiah(item.jumlah)} />
                <Field label="Denda" value={item.denda ? formatRupiah(item.denda) : "—"} />
                <Field label="Jatuh Tempo" value={formatTanggalID(item.tanggalJatuhTempo)} />
                <Field label="Status" value={<StatusBadge status={item.status} />} />
                {item.tanggalBayar ? <Field label="Tgl Bayar" value={formatTanggalID(item.tanggalBayar)} /> : null}
                {item.metode ? <Field label="Metode" value={item.metode} /> : null}
              </div>
              {item.keterangan ? (
                <div>
                  <p className="text-xs text-muted-foreground">Keterangan</p>
                  <p className="text-sm">{item.keterangan}</p>
                </div>
              ) : null}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="flex w-full gap-2">
                <Button variant="outline" size="sm" className="touch-target flex-1" onClick={() => onCetak(item)}><Printer className="h-4 w-4" /> Cetak Kwitansi</Button>
                {item.status !== "lunas" ? (
                  <Button size="sm" className="touch-target flex-1" onClick={() => onTandaiLunas(item.id)}><Check className="h-4 w-4" /> Tandai Lunas</Button>
                ) : null}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="touch-target sm:w-auto"><Trash2 className="h-4 w-4" /> Hapus</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus tagihan?</AlertDialogTitle>
                    <AlertDialogDescription>Tagihan {item.kode} akan dihapus permanen beserta kwitansi terkait.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => onDelete(item.id)}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
