"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useFetch, postJSON, deleteJSON } from "@/hooks/use-fetch";
import { useMounted } from "@/hooks/use-mounted";
import {
  PageHeader, StatusBadge, EmptyState, ErrorState, CardSkeleton, Card,
} from "@/components/shared";
import {
  formatTanggalID, formatTanggalLengkapID, formatJam, toISODate, relativeTime,
} from "@/lib/format";
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
import { toast } from "sonner";
import Image from "next/image";
import {
  CalendarDays, Plus, MapPin, Users, Eye, Trash2, Filter, Clock,
  ChevronRight, Calendar, CheckCircle2, Camera,
} from "lucide-react";

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

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

const EMPTY_MSG: Record<string, { title: string; desc: string; icon: "calendar" | "clock" | "check" }> = {
  semua: { title: "Belum ada kegiatan", desc: "Tambahkan kegiatan baru untuk warga RT 002.", icon: "calendar" },
  akan_datang: { title: "Belum ada kegiatan yang akan datang", desc: "Jadwalkan kegiatan mendatang untuk warga.", icon: "calendar" },
  berlangsung: { title: "Tidak ada kegiatan berlangsung", desc: "Saat ini tidak ada kegiatan yang sedang berjalan.", icon: "clock" },
  selesai: { title: "Belum ada kegiatan selesai", desc: "Riwayat kegiatan yang sudah selesai akan muncul di sini.", icon: "check" },
};

function badgeClassFor(status: KegiatanStatus): string {
  switch (status) {
    case "akan_datang": return "bg-primary text-primary-foreground";
    case "berlangsung": return "bg-success text-success-foreground";
    case "selesai": return "bg-muted text-muted-foreground";
    case "dibatalkan": return "bg-destructive/10 text-destructive border border-destructive/30";
  }
}

/** Calendar tear-off date badge. new Date(string) is deterministic → no hydration concern. */
function DateBadge({ date, size = "lg", status = "akan_datang" }: {
  date: string; size?: "lg" | "sm"; status?: KegiatanStatus;
}) {
  const d = new Date(date);
  const dim = size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const textSize = size === "lg" ? "text-2xl" : "text-lg";
  const sub = size === "lg" ? "text-[10px]" : "text-[9px]";
  return (
    <div className={`${dim} flex flex-col items-center justify-center rounded-xl ${badgeClassFor(status)} shrink-0`}>
      <span className={`${textSize} font-bold leading-none`}>{d.getDate()}</span>
      <span className={`${sub} uppercase tracking-wide opacity-90`}>{MONTH_ABBR[d.getMonth()]}</span>
    </div>
  );
}

function MetaRow({ k, full = false }: { k: Kegiatan; full?: boolean }) {
  const hasTime = k.tanggalMulai.includes("T");
  const dateLabel = full ? formatTanggalLengkapID(k.tanggalMulai) : formatTanggalID(k.tanggalMulai);
  const timeLabel = hasTime ? ` • ${formatJam(k.tanggalMulai)}` : "";
  return (
    <div className={`mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground ${full ? "sm:flex-row sm:flex-wrap sm:gap-x-4" : ""}`}>
      <span className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 shrink-0" /> <span className="min-w-0">{dateLabel}{timeLabel}</span>
      </span>
      {k.lokasi && (
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="min-w-0">{k.lokasi}</span>
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 shrink-0" /> <span className="min-w-0">{k.jumlahPeserta} peserta</span>
      </span>
    </div>
  );
}

function MetaBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function FeaturedCard({ k, onDetail }: { k: Kegiatan; onDetail: () => void }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <DateBadge date={k.tanggalMulai} size="lg" status={k.status} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Kegiatan Mendatang</p>
          <h3 className="mt-0.5 text-lg font-bold leading-tight sm:text-xl">{k.judul}</h3>
          <div className="mt-1.5">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{k.kategori}</Badge>
          </div>
          <MetaRow k={k} full />
          {k.deskripsi && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{k.deskripsi}</p>
          )}
          <div className="mt-3">
            <Button size="sm" onClick={onDetail} className="touch-target">
              <Eye className="h-4 w-4" /> Lihat Detail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ k, onDetail, index }: { k: Kegiatan; onDetail: () => void; index: number }) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2 cursor-pointer p-3 transition-shadow hover:shadow-md sm:p-4"
      role="button"
      tabIndex={0}
      onClick={onDetail}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDetail(); } }}
      aria-label={`Lihat detail ${k.judul}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <DateBadge date={k.tanggalMulai} size="sm" status={k.status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold leading-tight">{k.judul}</p>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">{k.kategori}</Badge>
            <StatusBadge status={k.status} />
          </div>
          <MetaRow k={k} />
          {k.deskripsi && (
            <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">{k.deskripsi}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function KegiatanView() {
  const mounted = useMounted();
  const { data, loading, error, refetch } = useFetch<{ items: Kegiatan[] }>("/api/kegiatan");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [kategoriFilter, setKategoriFilter] = useState<string>("semua");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Kegiatan | null>(null);
  const [hapus, setHapus] = useState<Kegiatan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    judul: "", kategori: KATEGORI_KEGIATAN[0],
    tanggalMulai: "", tanggalSelesai: "",
    lokasi: "", deskripsi: "",
  });

  const items = data?.items || [];
  const filtered = items.filter((k) => {
    if (statusFilter !== "semua" && k.status !== statusFilter) return false;
    if (kategoriFilter !== "semua" && k.kategori !== kategoriFilter) return false;
    return true;
  });
  const showFeatured = statusFilter === "semua" || statusFilter === "akan_datang";
  const upcoming = filtered
    .filter((k) => k.status === "akan_datang")
    .sort((a, b) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime());
  const featured = showFeatured && upcoming.length > 0 ? upcoming[0] : null;
  const listItems = featured ? filtered.filter((k) => k.id !== featured.id) : filtered;

  function openCreate() {
    setForm({
      judul: "", kategori: KATEGORI_KEGIATAN[0],
      tanggalMulai: toISODate(new Date()), tanggalSelesai: "",
      lokasi: "", deskripsi: "",
    });
    setCreateOpen(true);
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
    setCreateOpen(false); refetch();
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

  const empty = EMPTY_MSG[statusFilter] || EMPTY_MSG.semua;
  const emptyIcon = empty.icon === "check"
    ? <CheckCircle2 className="h-6 w-6" />
    : empty.icon === "clock"
      ? <Clock className="h-6 w-6" />
      : <CalendarDays className="h-6 w-6" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kegiatan Warga"
        description="Agenda & kegiatan RT 002 Mawar"
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <Button onClick={openCreate} className="touch-target">
            <Plus className="h-4 w-4" /> Tambah Kegiatan
          </Button>
        }
      />

      {/* FILTER TABS — horizontally scrollable pills */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex min-w-0 flex-1 overflow-x-auto scrollbar-hide gap-2 pb-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatusFilter(s.value)}
              aria-pressed={statusFilter === s.value}
              className={`touch-target shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors ${
                statusFilter === s.value ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
          <SelectTrigger className="h-9 w-[150px] shrink-0 overflow-hidden rounded-full" aria-label="Filter kategori">
            <span className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              <SelectValue placeholder="Kategori" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {KATEGORI_KEGIATAN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3">
          <CardSkeleton className="h-32" />
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={empty.title}
          description={empty.desc}
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Kegiatan</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {featured && <FeaturedCard k={featured} onDetail={() => setDetail(featured)} />}
          <div className="grid grid-cols-1 gap-2.5">
            {listItems.map((k, i) => (
              <ActivityCard key={k.id} k={k} index={i} onDetail={() => setDetail(k)} />
            ))}
          </div>
        </div>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Kegiatan</DialogTitle>
            <DialogDescription>Buat kegiatan baru untuk warga RT 002.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="k-judul">Judul</Label>
              <Input id="k-judul" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Contoh: Kerja bakti bersih saluran" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="k-kategori">Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                <SelectTrigger id="k-kategori" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KATEGORI_KEGIATAN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="k-mulai">Tanggal Mulai</Label>
                <Input id="k-mulai" type="date" value={form.tanggalMulai} onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="k-selesai">Tanggal Selesai</Label>
                <Input id="k-selesai" type="date" value={form.tanggalSelesai} onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="k-lokasi">Lokasi</Label>
              <Input id="k-lokasi" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Contoh: Lapangan Mawar" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="k-deskripsi">Deskripsi</Label>
              <Textarea id="k-deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={3} placeholder="Detail kegiatan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL DIALOG */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8">{detail?.judul}</DialogTitle>
            <DialogDescription>Detail kegiatan RT 002</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <DateBadge date={detail.tanggalMulai} size="lg" status={detail.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={detail.status} />
                    <Badge variant="secondary">{detail.kategori}</Badge>
                  </div>
                  <MetaRow k={detail} full />
                </div>
              </div>
              {detail.fotoUrl ? (
                <div className="overflow-hidden rounded-xl border bg-muted">
                  <Image src={detail.fotoUrl} alt={detail.judul}
                    width={800} height={450}
                    className="h-48 w-full object-cover sm:h-56" unoptimized />
                </div>
              ) : null}
              {detail.deskripsi && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="whitespace-pre-wrap leading-relaxed">{detail.deskripsi}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MetaBox icon={<Calendar className="h-3.5 w-3.5" />} label="Mulai" value={formatTanggalLengkapID(detail.tanggalMulai)} />
                <MetaBox icon={<Clock className="h-3.5 w-3.5" />} label="Selesai" value={detail.tanggalSelesai ? formatTanggalLengkapID(detail.tanggalSelesai) : "—"} />
                {detail.lokasi && <MetaBox icon={<MapPin className="h-3.5 w-3.5" />} label="Lokasi" value={detail.lokasi} />}
                <MetaBox icon={<Users className="h-3.5 w-3.5" />} label="Peserta" value={`${detail.jumlahPeserta} orang`} />
              </div>
              <p className="text-xs text-muted-foreground">
                Dibuat {mounted ? relativeTime(detail.createdAt) : "\u00A0"}
              </p>
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {detail?.status === "selesai" && detail.fotoUrl ? (
              <Button variant="outline" asChild className="sm:mr-auto">
                <a href={detail.fotoUrl} target="_blank" rel="noopener noreferrer">
                  <Camera className="h-4 w-4" /> Lihat Foto Kegiatan
                </a>
              </Button>
            ) : <span className="hidden sm:block" />}
            <div className="flex gap-2">
              {detail && (
                <Button variant="destructive" onClick={() => setHapus(detail)}>
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetail(null)}>Tutup</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
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
