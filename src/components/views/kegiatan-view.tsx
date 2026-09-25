"use client";

import { useState } from "react";
import { useFetch, postJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PageHeader, StatusBadge, EmptyState, ErrorState, CardSkeleton, Card,
} from "@/components/shared";
import { formatTanggalID, toISODate } from "@/lib/format";
import { KATEGORI_KEGIATAN } from "@/lib/constants";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CalendarDays, Plus, MapPin, Users, Eye, Trash2 } from "lucide-react";

type KegiatanStatus = "akan_datang" | "berlangsung" | "selesai" | "dibatalkan";
interface Kegiatan {
  id: string; judul: string; deskripsi: string; kategori: string;
  tanggalMulai: string; tanggalSelesai?: string | null; lokasi?: string | null;
  status: KegiatanStatus; fotoUrl?: string | null; jumlahPeserta: number; createdAt: string;
}

const STATUS_FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "akan_datang", label: "Akan Datang" },
  { value: "berlangsung", label: "Berlangsung" },
  { value: "selesai", label: "Selesai" },
] as const;

function formatTanggalRange(mulai: string, selesai?: string | null) {
  const s = formatTanggalID(mulai);
  return !selesai ? s : `${s} - ${formatTanggalID(selesai)}`;
}

export function KegiatanView() {
  const isMobile = useIsMobile();
  const { data, loading, error, refetch } = useFetch<{ items: Kegiatan[] }>("/api/kegiatan");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [kategoriFilter, setKategoriFilter] = useState("semua");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Kegiatan | null>(null);
  const [hapus, setHapus] = useState<Kegiatan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    judul: "", kategori: KATEGORI_KEGIATAN[0],
    tanggalMulai: toISODate(new Date()), tanggalSelesai: "",
    lokasi: "", deskripsi: "",
  });

  const items = data?.items || [];
  const filtered = items.filter((k) => {
    if (statusFilter !== "semua" && k.status !== statusFilter) return false;
    if (kategoriFilter !== "semua" && k.kategori !== kategoriFilter) return false;
    return true;
  });

  function resetForm() {
    setForm({
      judul: "", kategori: KATEGORI_KEGIATAN[0],
      tanggalMulai: toISODate(new Date()), tanggalSelesai: "",
      lokasi: "", deskripsi: "",
    });
  }

  async function handleSubmit() {
    if (!form.judul || !form.tanggalMulai) return toast.error("Judul dan tanggal mulai wajib diisi");
    setSaving(true);
    const r = await postJSON("/api/kegiatan", {
      judul: form.judul, kategori: form.kategori,
      tanggalMulai: form.tanggalMulai,
      tanggalSelesai: form.tanggalSelesai || undefined,
      lokasi: form.lokasi || undefined, deskripsi: form.deskripsi,
    });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Kegiatan berhasil ditambahkan");
    setCreateOpen(false); resetForm(); refetch();
  }

  async function handleDelete() {
    if (!hapus) return;
    setDeleting(true);
    const r = await deleteJSON(`/api/kegiatan/${hapus.id}`);
    setDeleting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Kegiatan dihapus");
    setHapus(null); setDetail(null); refetch();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kegiatan Warga" description="Agenda & kegiatan RT 002 Mawar"
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="touch-target">
            <Plus className="h-4 w-4" /> Tambah Kegiatan
          </Button>
        }
      />

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
            {KATEGORI_KEGIATAN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} className="h-28" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="Belum ada kegiatan" description="Tambahkan kegiatan baru untuk warga RT 002."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Tambah Kegiatan</Button>}
        />
      ) : isMobile ? (
        <div className="grid gap-2">
          {filtered.map((k) => <KegiatanCard key={k.id} k={k} onDetail={() => setDetail(k)} />)}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="scrollbar-thin overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead>Selesai</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">{k.judul}</TableCell>
                    <TableCell><Badge variant="secondary">{k.kategori}</Badge></TableCell>
                    <TableCell>{formatTanggalID(k.tanggalMulai)}</TableCell>
                    <TableCell>{k.tanggalSelesai ? formatTanggalID(k.tanggalSelesai) : "—"}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{k.lokasi || "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />{k.jumlahPeserta}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={k.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(k)} aria-label={`Lihat detail ${k.judul}`}>
                        <Eye className="h-4 w-4" /> Detail
                      </Button>
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
            <DialogTitle>Tambah Kegiatan</DialogTitle>
            <DialogDescription>Buat kegiatan baru untuk warga RT 002.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="k-judul">Judul</Label>
              <Input id="k-judul" value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Contoh: Kerja bakti bersih saluran" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="k-kategori">Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                <SelectTrigger id="k-kategori" className="w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {KATEGORI_KEGIATAN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="k-mulai">Tanggal Mulai</Label>
                <Input id="k-mulai" type="date" value={form.tanggalMulai}
                  onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="k-selesai">Tanggal Selesai</Label>
                <Input id="k-selesai" type="date" value={form.tanggalSelesai}
                  onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="k-lokasi">Lokasi</Label>
              <Input id="k-lokasi" value={form.lokasi}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                placeholder="Contoh: Lapangan Mawar" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="k-deskripsi">Deskripsi</Label>
              <Textarea id="k-deskripsi" value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                rows={3} placeholder="Detail kegiatan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">{detail?.judul}</DialogTitle>
            <DialogDescription>{detail?.kategori}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <Badge variant="secondary">{detail.kategori}</Badge>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{formatTanggalRange(detail.tanggalMulai, detail.tanggalSelesai)}</p>
                </div>
                {detail.lokasi && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <p>{detail.lokasi}</p>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <p>{detail.jumlahPeserta} peserta</p>
                </div>
              </div>
              {detail.deskripsi && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{detail.deskripsi}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => setHapus(detail)} className="mr-auto">
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
            <Button variant="outline" onClick={() => setDetail(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!hapus} onOpenChange={(o) => !o && setHapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kegiatan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kegiatan &ldquo;{hapus?.judul}&rdquo; akan dihapus permanen.
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

function KegiatanCard({ k, onDetail }: { k: Kegiatan; onDetail: () => void }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{k.judul}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{k.kategori}</Badge>
            <StatusBadge status={k.status} />
          </div>
        </div>
      </div>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatTanggalRange(k.tanggalMulai, k.tanggalSelesai)}
        </p>
        {k.lokasi && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />{k.lokasi}
          </p>
        )}
        <p className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />{k.jumlahPeserta} peserta
        </p>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={onDetail}>
          <Eye className="h-4 w-4" /> Detail
        </Button>
      </div>
    </Card>
  );
}
