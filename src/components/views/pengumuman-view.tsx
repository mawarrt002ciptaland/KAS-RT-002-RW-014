"use client";

import { useState } from "react";
import { useFetch, postJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PageHeader, EmptyState, ErrorState, CardSkeleton, Card,
} from "@/components/shared";
import { formatTanggalID, relativeTime } from "@/lib/format";
import { KATEGORI_PENGUMUMAN } from "@/lib/constants";
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
import { Megaphone, Plus, Eye, Trash2, Clock, AlertTriangle } from "lucide-react";

type Prioritas = "normal" | "penting" | "mendesak";
interface Pengumuman {
  id: string; judul: string; konten: string; kategori: string;
  prioritas: Prioritas; status: "aktif" | "arsip";
  penulis?: string | null; tanggal: string; createdAt: string;
}

const STATUS_FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "aktif", label: "Aktif" },
  { value: "arsip", label: "Arsip" },
] as const;

const PRIORITAS_BADGE: Record<Prioritas, string> = {
  mendesak: "bg-destructive/10 text-destructive",
  penting: "bg-warning/20 text-warning",
  normal: "bg-info/15 text-info",
};
const PRIORITAS_LABEL: Record<Prioritas, string> = {
  mendesak: "Mendesak", penting: "Penting", normal: "Normal",
};

function PrioritasBadge({ prioritas }: { prioritas: Prioritas }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITAS_BADGE[prioritas]}`}>
      {prioritas === "mendesak" && <AlertTriangle className="h-3 w-3" />}
      {PRIORITAS_LABEL[prioritas]}
    </span>
  );
}

export function PengumumanView() {
  const isMobile = useIsMobile();
  const { data, loading, error, refetch } = useFetch<{ items: Pengumuman[] }>("/api/pengumuman");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [kategoriFilter, setKategoriFilter] = useState("semua");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Pengumuman | null>(null);
  const [hapus, setHapus] = useState<Pengumuman | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    judul: "", kategori: KATEGORI_PENGUMUMAN[0],
    prioritas: "normal" as Prioritas, konten: "",
  });

  const items = data?.items || [];
  const filtered = items.filter((p) => {
    if (statusFilter !== "semua" && p.status !== statusFilter) return false;
    if (kategoriFilter !== "semua" && p.kategori !== kategoriFilter) return false;
    return true;
  });

  function resetForm() {
    setForm({
      judul: "", kategori: KATEGORI_PENGUMUMAN[0],
      prioritas: "normal", konten: "",
    });
  }

  async function handleSubmit() {
    if (!form.judul || !form.konten) return toast.error("Judul dan konten wajib diisi");
    setSaving(true);
    const r = await postJSON("/api/pengumuman", {
      judul: form.judul, konten: form.konten,
      kategori: form.kategori, prioritas: form.prioritas,
    });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Pengumuman berhasil dibuat");
    setCreateOpen(false); resetForm(); refetch();
  }

  async function handleDelete() {
    if (!hapus) return;
    setDeleting(true);
    const r = await deleteJSON(`/api/pengumuman/${hapus.id}`);
    setDeleting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Pengumuman dihapus");
    setHapus(null); setDetail(null); refetch();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengumuman" description="Pengumuman & info terbaru RT 002 Mawar"
        icon={<Megaphone className="h-5 w-5" />}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="touch-target">
            <Plus className="h-4 w-4" /> Buat Pengumuman
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
            {KATEGORI_PENGUMUMAN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} className="h-32" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Belum ada pengumuman" description="Buat pengumuman baru untuk warga RT 002."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Buat Pengumuman</Button>}
        />
      ) : isMobile ? (
        <div className="grid gap-2">
          {filtered.map((p) => <PengumumanCard key={p.id} p={p} onDetail={() => setDetail(p)} />)}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="scrollbar-thin overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Penulis</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[260px] truncate font-medium">{p.judul}</TableCell>
                    <TableCell><PrioritasBadge prioritas={p.prioritas} /></TableCell>
                    <TableCell><Badge variant="secondary">{p.kategori}</Badge></TableCell>
                    <TableCell>{p.penulis || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{formatTanggalID(p.tanggal)}</span>
                        <span className="text-xs text-muted-foreground">{relativeTime(p.tanggal)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "aktif" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                        {p.status === "aktif" ? "Aktif" : "Arsip"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(p)} aria-label={`Lihat detail ${p.judul}`}>
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
            <DialogTitle>Buat Pengumuman</DialogTitle>
            <DialogDescription>Sampaikan info penting kepada warga RT 002.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p-judul">Judul</Label>
              <Input id="p-judul" value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Contoh: Rapat warga bulanan" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="p-kategori">Kategori</Label>
                <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                  <SelectTrigger id="p-kategori" className="w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {KATEGORI_PENGUMUMAN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-prioritas">Prioritas</Label>
                <Select value={form.prioritas} onValueChange={(v) => setForm({ ...form, prioritas: v as Prioritas })}>
                  <SelectTrigger id="p-prioritas" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="penting">Penting</SelectItem>
                    <SelectItem value="mendesak">Mendesak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-konten">Konten</Label>
              <Textarea id="p-konten" value={form.konten}
                onChange={(e) => setForm({ ...form, konten: e.target.value })}
                rows={5} placeholder="Tulis isi pengumuman..." />
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
                <PrioritasBadge prioritas={detail.prioritas} />
                <Badge variant="secondary">{detail.kategori}</Badge>
                {detail.status === "arsip" && <Badge variant="outline">Arsip</Badge>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTanggalID(detail.tanggal)}</span>
                <span>·</span>
                <span>{relativeTime(detail.tanggal)}</span>
              </div>
              {detail.penulis && (
                <p className="text-xs text-muted-foreground">Ditulis oleh: {detail.penulis}</p>
              )}
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="whitespace-pre-wrap">{detail.konten}</p>
              </div>
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
            <AlertDialogTitle>Hapus pengumuman ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengumuman &ldquo;{hapus?.judul}&rdquo; akan dihapus permanen.
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

function PengumumanCard({ p, onDetail }: { p: Pengumuman; onDetail: () => void }) {
  const isMendesak = p.prioritas === "mendesak";
  return (
    <Card className={`p-3 ${isMendesak ? "border-l-2 border-l-destructive" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.judul}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <PrioritasBadge prioritas={p.prioritas} />
            <Badge variant="secondary">{p.kategori}</Badge>
            {p.status === "arsip" && <Badge variant="outline">Arsip</Badge>}
          </div>
        </div>
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.konten}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex flex-col text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{formatTanggalID(p.tanggal)}
          </span>
          <span>{relativeTime(p.tanggal)}{p.penulis ? ` · ${p.penulis}` : ""}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onDetail}>
          <Eye className="h-4 w-4" /> Detail
        </Button>
      </div>
    </Card>
  );
}
