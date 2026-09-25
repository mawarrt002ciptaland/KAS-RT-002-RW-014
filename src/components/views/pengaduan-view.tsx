"use client";

import { useMemo, useState } from "react";
import { useFetch, postJSON, patchJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, CardSkeleton, Card,
} from "@/components/shared";
import { KATEGORI_PENGADUAN, RT_INFO } from "@/lib/constants";
import { relativeTime, formatTanggalID } from "@/lib/format";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  MessageSquareWarning, Plus, MapPin, Trash2, Eye, Send, Image as ImageIcon, Clock,
} from "lucide-react";

type PengaduanStatus = "baru" | "proses" | "selesai" | "ditolak";

interface Pengaduan {
  id: string; kode: string; judul: string; deskripsi: string; kategori: string;
  lokasi?: string | null; fotoUrl?: string | null; status: PengaduanStatus;
  pelapor: string; wargaId?: string | null; tanggapan?: string | null; createdAt: string;
}

const STATUS_FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "baru", label: "Baru" },
  { value: "proses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
] as const;

const EMPTY_FORM = {
  kategori: KATEGORI_PENGADUAN[0],
  judul: "", deskripsi: "", lokasi: "", fotoUrl: "",
};

export function PengaduanView() {
  const isMobile = useIsMobile();
  const { data, loading, error, refetch } = useFetch<{ items: Pengaduan[] }>("/api/pengaduan");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [kategoriFilter, setKategoriFilter] = useState("semua");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Pengaduan | null>(null);
  const [hapus, setHapus] = useState<Pengaduan | null>(null);
  const [saving, setSaving] = useState(false);
  const [patching, setPatching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tanggapanForm, setTanggapanForm] = useState({
    status: "baru" as PengaduanStatus, tanggapan: "",
  });

  const items = data?.items || [];
  const filtered = items.filter((p) => {
    if (statusFilter !== "semua" && p.status !== statusFilter) return false;
    if (kategoriFilter !== "semua" && p.kategori !== kategoriFilter) return false;
    return true;
  });

  const stats = useMemo(() => {
    const list = data?.items || [];
    return {
      total: list.length,
      baru: list.filter((p) => p.status === "baru").length,
      proses: list.filter((p) => p.status === "proses").length,
      selesai: list.filter((p) => p.status === "selesai").length,
    };
  }, [data]);

  function resetForm() { setForm(EMPTY_FORM); }

  function openDetail(p: Pengaduan) {
    setDetail(p);
    setTanggapanForm({ status: p.status, tanggapan: p.tanggapan || "" });
  }

  async function handleSubmit() {
    if (!form.judul || !form.deskripsi || !form.kategori) {
      return toast.error("Judul, deskripsi & kategori wajib diisi");
    }
    setSaving(true);
    const r = await postJSON("/api/pengaduan", {
      judul: form.judul, deskripsi: form.deskripsi, kategori: form.kategori,
      lokasi: form.lokasi || undefined, fotoUrl: form.fotoUrl || undefined,
      pelapor: "Warga",
    });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    const created = r.data as Pengaduan;
    toast.success(`Aduan ${created.kode} terkirim. Status: BARU`);
    setCreateOpen(false); resetForm(); refetch();
  }

  async function handlePatch() {
    if (!detail) return;
    setPatching(true);
    const r = await patchJSON(`/api/pengaduan/${detail.id}`, {
      status: tanggapanForm.status,
      tanggapan: tanggapanForm.tanggapan || undefined,
    });
    setPatching(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Tanggapan tersimpan");
    setDetail(null); refetch();
  }

  async function handleDelete() {
    if (!hapus) return;
    setDeleting(true);
    const r = await deleteJSON(`/api/pengaduan/${hapus.id}`);
    setDeleting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Aduan dihapus");
    setHapus(null); setDetail(null); refetch();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setForm((s) => ({ ...s, fotoUrl: f.name }));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengaduan Warga"
        description={`Aduan & keluhan warga RT ${RT_INFO.rt} Blok ${RT_INFO.blok}`}
        icon={<MessageSquareWarning className="h-5 w-5" />}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="touch-target">
            <Plus className="h-4 w-4" /> Buat Aduan
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Total Aduan" value={stats.total} icon={<MessageSquareWarning className="h-5 w-5" />} hint="Seluruh aduan" />
        <StatCard title="Baru" value={stats.baru} tone="neutral" icon={<Eye className="h-5 w-5" />} hint="Perlu ditangani" />
        <StatCard title="Diproses" value={stats.proses} tone="warning" icon={<Clock className="h-5 w-5" />} hint="Sedang ditangani" />
        <StatCard title="Selesai" value={stats.selesai} tone="income" icon={<Send className="h-5 w-5" />} hint="Tertangani" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto">
            {STATUS_FILTERS.map((s) => (
              <TabsTrigger key={s.value} value={s.value} className="flex-1">{s.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
          <SelectTrigger className="h-9 w-full sm:w-[200px]" aria-label="Filter kategori">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {KATEGORI_PENGADUAN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-32" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquareWarning className="h-6 w-6" />}
          title="Belum ada aduan"
          description="Belum ada aduan yang cocok dengan filter saat ini."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Buat Aduan</Button>}
        />
      ) : isMobile ? (
        <div className="grid gap-2">
          {filtered.map((p) => (
            <PengaduanCard key={p.id} p={p}
              onTanggapi={() => openDetail(p)}
              onHapus={() => setHapus(p)} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="scrollbar-thin overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.kode}</TableCell>
                    <TableCell className="max-w-[220px] truncate font-medium">{p.judul}</TableCell>
                    <TableCell><Badge variant="secondary">{p.kategori}</Badge></TableCell>
                    <TableCell className="max-w-[180px] truncate">{p.lokasi || "—"}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(p.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(p)} aria-label={`Tanggapi ${p.kode}`}>
                          <Send className="h-4 w-4" /> Tanggapi
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setHapus(p)} aria-label={`Hapus ${p.kode}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Aduan</DialogTitle>
            <DialogDescription>Sampaikan keluhan atau aduan. Pengurus akan menindaklanjuti.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ad-kategori">Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                <SelectTrigger id="ad-kategori" className="w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {KATEGORI_PENGADUAN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-judul">Judul</Label>
              <Input id="ad-judul" value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Contoh: Lampu jalan mati" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-deskripsi">Deskripsi</Label>
              <Textarea id="ad-deskripsi" value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                rows={4} placeholder="Jelaskan aduan Anda..." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-lokasi">Lokasi</Label>
              <Input id="ad-lokasi" value={form.lokasi}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                placeholder="Contoh: Gang 2 no 58" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-foto">Foto (opsional)</Label>
              <label htmlFor="ad-foto" className="touch-target flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50">
                <ImageIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{form.fotoUrl || "Pilih foto"}</span>
              </label>
              <Input id="ad-foto" type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Mengirim..." : "Kirim Aduan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">{detail?.judul}</DialogTitle>
            <DialogDescription className="font-mono">{detail?.kode}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <Badge variant="secondary">{detail.kategori}</Badge>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="whitespace-pre-wrap">{detail.deskripsi}</p>
              </div>
              <div className="grid gap-1.5 text-sm">
                {detail.lokasi && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" /> {detail.lokasi}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Pelapor: {detail.pelapor} · {formatTanggalID(detail.createdAt)} · {relativeTime(detail.createdAt)}
                </p>
                {detail.fotoUrl && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><ImageIcon className="h-3.5 w-3.5 shrink-0" /> {detail.fotoUrl}</p>
                )}
              </div>
              {detail.tanggapan && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <p className="mb-1 text-xs font-medium text-primary">Tanggapan Pengurus</p>
                  <p className="whitespace-pre-wrap">{detail.tanggapan}</p>
                </div>
              )}
              <div className="mt-2 rounded-lg border p-3">
                <p className="mb-2 text-sm font-semibold">Tanggapi Aduan</p>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="t-status">Status</Label>
                    <Select value={tanggapanForm.status}
                      onValueChange={(v) => setTanggapanForm({ ...tanggapanForm, status: v as PengaduanStatus })}>
                      <SelectTrigger id="t-status" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baru">Baru</SelectItem>
                        <SelectItem value="proses">Diproses</SelectItem>
                        <SelectItem value="selesai">Selesai</SelectItem>
                        <SelectItem value="ditolak">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="t-tanggapan">Tanggapan</Label>
                    <Textarea id="t-tanggapan" value={tanggapanForm.tanggapan}
                      onChange={(e) => setTanggapanForm({ ...tanggapanForm, tanggapan: e.target.value })}
                      rows={3} placeholder="Tulis tanggapan untuk warga..." />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => setHapus(detail)} className="mr-auto" disabled={patching}>
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
            <Button variant="outline" onClick={() => setDetail(null)} disabled={patching}>Tutup</Button>
            <Button onClick={handlePatch} disabled={patching}>{patching ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!hapus} onOpenChange={(o) => !o && setHapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus aduan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Aduan &ldquo;{hapus?.judul}&rdquo; ({hapus?.kode}) akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PengaduanCard({ p, onTanggapi, onHapus }: {
  p: Pengaduan;
  onTanggapi: () => void;
  onHapus: () => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted-foreground">{p.kode}</p>
          <p className="mt-0.5 truncate font-semibold">{p.judul}</p>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{p.kategori}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.deskripsi}</p>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
        {p.lokasi && (
          <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.lokasi}</span></p>
        )}
        <p>{p.pelapor} · {relativeTime(p.createdAt)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="touch-target flex-1" onClick={onTanggapi}>
          <Send className="h-4 w-4" /> Tanggapi
        </Button>
        <Button size="sm" variant="ghost" onClick={onHapus} aria-label={`Hapus ${p.kode}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
