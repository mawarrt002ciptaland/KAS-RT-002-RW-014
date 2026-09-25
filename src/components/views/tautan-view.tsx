"use client";

import { useState } from "react";
import { useFetch, postJSON, deleteJSON } from "@/hooks/use-fetch";
import {
  PageHeader, EmptyState, ErrorState, CardSkeleton, Card, openWhatsApp,
} from "@/components/shared";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Link2, Plus, Trash2, Building2, Globe, ExternalLink, MessageCircle, Instagram,
  ArrowRight, Send as WhatsappIcon,
} from "lucide-react";

type KategoriTautan = "Sosial Media" | "Pemerintah" | "Layanan" | "Kontak" | "Umum";

interface Tautan {
  id: string; judul: string; url: string; kategori: KategoriTautan;
  logo?: string | null; deskripsi?: string | null; urutan: number;
}

const KATEGORI_LIST: KategoriTautan[] = [
  "Sosial Media", "Pemerintah", "Layanan", "Kontak", "Umum",
];

const KATEGORI_STYLE: Record<KategoriTautan, { bg: string; icon: React.ReactNode }> = {
  "Sosial Media": { bg: "bg-primary/15 text-primary", icon: <Instagram className="h-5 w-5" /> },
  Pemerintah: { bg: "bg-info/15 text-info", icon: <Building2 className="h-5 w-5" /> },
  Layanan: { bg: "bg-success/15 text-success", icon: <Globe className="h-5 w-5" /> },
  Kontak: { bg: "bg-warning/20 text-warning", icon: <MessageCircle className="h-5 w-5" /> },
  Umum: { bg: "bg-muted text-muted-foreground", icon: <ExternalLink className="h-5 w-5" /> },
};

const EMPTY_FORM = {
  judul: "", url: "", kategori: "Umum" as KategoriTautan, deskripsi: "",
};

export function TautanView() {
  const { data, loading, error, refetch } = useFetch<{ items: Tautan[] }>("/api/tautan");
  const [kategoriFilter, setKategoriFilter] = useState("semua");
  const [createOpen, setCreateOpen] = useState(false);
  const [hapus, setHapus] = useState<Tautan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const items = data?.items || [];
  const filtered = items.filter((t) => kategoriFilter === "semua" || t.kategori === kategoriFilter);

  function resetForm() { setForm(EMPTY_FORM); }

  async function handleSubmit() {
    if (!form.judul || !form.url) return toast.error("Judul & URL wajib diisi");
    setSaving(true);
    const r = await postJSON("/api/tautan", {
      judul: form.judul, url: form.url,
      kategori: form.kategori, deskripsi: form.deskripsi || undefined,
    });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Tautan ditambahkan");
    setCreateOpen(false); resetForm(); refetch();
  }

  async function onDelete() {
    if (!hapus) return;
    setDeleting(true);
    const r = await deleteJSON(`/api/tautan/${hapus.id}`);
    setDeleting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Tautan dihapus");
    setHapus(null); refetch();
  }

  function openTautan(t: Tautan) {
    if (t.kategori === "Kontak" && /wa\.me|whatsapp/i.test(t.url)) {
      const num = t.url.replace(/^https?:\/\/wa\.me\//i, "").replace(/[^0-9]/g, "");
      openWhatsApp(num, "Halo, saya warga RT 002 Mawar");
      return;
    }
    window.open(t.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tautan & Kontak"
        description="Tautan penting & kontak pengurus RT 002 Mawar"
        icon={<Link2 className="h-5 w-5" />}
        actions={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Tambah Tautan</Button>}
      />

      <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
        <SelectTrigger className="h-9 w-full sm:w-[220px]" aria-label="Filter kategori">
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="semua">Semua Kategori</SelectItem>
          {KATEGORI_LIST.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-28" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-6 w-6" />}
          title="Belum ada tautan"
          description="Tambahkan tautan penting & kontak untuk warga RT 002."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Tambah Tautan</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((t) => (
            <TautanCard key={t.id} t={t} onOpen={() => openTautan(t)} onHapus={() => setHapus(t)} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Tautan</DialogTitle>
            <DialogDescription>Tambah tautan atau kontak penting untuk warga RT 002.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="t-judul">Judul</Label>
              <Input id="t-judul" value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Contoh: Instagram RT 002" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-url">URL</Label>
              <Input id="t-url" type="url" value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://... atau wa.me/628xxx" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-kategori">Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v as KategoriTautan })}>
                <SelectTrigger id="t-kategori" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KATEGORI_LIST.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-deskripsi">Deskripsi</Label>
              <Textarea id="t-deskripsi" value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                rows={3} placeholder="Deskripsi singkat..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!hapus} onOpenChange={(o) => !o && setHapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tautan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Tautan &ldquo;{hapus?.judul}&rdquo; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void onDelete(); }}
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

function TautanCard({ t, onOpen, onHapus }: {
  t: Tautan; onOpen: () => void; onHapus: () => void;
}) {
  const style = KATEGORI_STYLE[t.kategori] || KATEGORI_STYLE.Umum;
  const isKontak = t.kategori === "Kontak";
  const label = isKontak ? "Hubungi" : "Kunjungi";
  return (
    <Card className="card-hover p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
          {style.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-bold">{t.judul}</p>
            <Button size="sm" variant="ghost" onClick={onHapus} aria-label={`Hapus ${t.judul}`} className="-mr-2 -mt-2 h-8 w-8 shrink-0 p-0">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          {t.deskripsi && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{t.deskripsi}</p>}
          <div className="mt-3">
            <Button size="sm" onClick={onOpen} className="touch-target">
              {isKontak ? <WhatsappIcon className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {label}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
