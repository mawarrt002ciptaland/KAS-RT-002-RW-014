"use client";

import { useState } from "react";
import { useFetch, postJSON, patchJSON, deleteJSON } from "@/hooks/use-fetch";
import {
  PageHeader, EmptyState, ErrorState, CardSkeleton, Card, openWhatsApp,
} from "@/components/shared";
import { RT_INFO } from "@/lib/constants";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Network, Plus, Phone, Mail, Trash2, Edit, User, Shield } from "lucide-react";

interface Pengurus {
  id: string; nama: string; jabatan: string; urutan: number;
  telepon?: string | null; email?: string | null; foto?: string | null;
  bidang?: string | null; periode: string;
}

const EMPTY_FORM = {
  nama: "", jabatan: "", bidang: "", telepon: "", email: "", urutan: "0",
};

function getInitials(nama: string) {
  return nama.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || "").join("") || "?";
}

function phoneDigits(p?: string | null) {
  return (p || "").replace(/\D/g, "");
}

export function StrukturView() {
  const { data, loading, error, refetch } = useFetch<{ items: Pengurus[] }>("/api/pengurus");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [hapus, setHapus] = useState<Pengurus | null>(null);
  const [deleting, setDeleting] = useState(false);

  const items = data?.items || [];
  const periode = items[0]?.periode || "2024-2027";
  const ketua = items.find((p) => /ketua\s*r(t|w)?/i.test(p.jabatan) || /^ketua$/i.test(p.jabatan));
  const lainnya = items.filter((p) => p !== ketua);

  function openCreate() {
    setFormMode("create"); setEditId(null); setForm(EMPTY_FORM); setFormOpen(true);
  }
  function openEdit(p: Pengurus) {
    setFormMode("edit"); setEditId(p.id);
    setForm({
      nama: p.nama, jabatan: p.jabatan, bidang: p.bidang || "",
      telepon: p.telepon || "", email: p.email || "",
      urutan: String(p.urutan ?? 0),
    });
    setFormOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.jabatan.trim()) return toast.error("Nama & jabatan wajib diisi");
    setSubmitting(true);
    const payload = {
      nama: form.nama.trim(), jabatan: form.jabatan.trim(),
      bidang: form.bidang || undefined, telepon: form.telepon || undefined,
      email: form.email || undefined, urutan: Number(form.urutan) || 0,
    };
    const r = formMode === "edit" && editId
      ? await patchJSON(`/api/pengurus/${editId}`, payload)
      : await postJSON("/api/pengurus", payload);
    setSubmitting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(formMode === "edit" ? "Pengurus diperbarui" : "Pengurus ditambahkan");
    setFormOpen(false); refetch();
  }

  async function onDelete() {
    if (!hapus) return;
    setDeleting(true);
    const r = await deleteJSON(`/api/pengurus/${hapus.id}`);
    setDeleting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Pengurus dihapus");
    setHapus(null); refetch();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Struktur Pengurus RT 002"
        description={`Susunan pengurus RT ${RT_INFO.rt} / RW ${RT_INFO.rw} Blok ${RT_INFO.blok}`}
        icon={<Network className="h-5 w-5" />}
        actions={<Button onClick={openCreate} className="touch-target"><Plus className="h-4 w-4" /> Tambah Pengurus</Button>}
      />

      <Card className="border-primary/40 bg-primary/5 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Pengurus RT {RT_INFO.rt} Blok {RT_INFO.blok}</p>
            <p className="text-lg font-bold">Periode {periode}</p>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-40" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Network className="h-6 w-6" />}
          title="Belum ada pengurus"
          description="Tambahkan pengurus RT untuk mulai mengelola struktur organisasi."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Pengurus</Button>}
        />
      ) : (
        <>
          {ketua && (
            <PengurusCardLarge p={ketua} onEdit={() => openEdit(ketua)} onHapus={() => setHapus(ketua)} />
          )}
          {lainnya.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lainnya.map((p) => (
                <PengurusCard key={p.id} p={p} onEdit={() => openEdit(p)} onHapus={() => setHapus(p)} />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === "edit" ? "Edit Pengurus" : "Tambah Pengurus"}</DialogTitle>
            <DialogDescription>Isi data pengurus RT 002. Field bertanda * wajib diisi.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="pg-nama">Nama *</Label>
                <Input id="pg-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pg-jabatan">Jabatan *</Label>
                <Input id="pg-jabatan" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} placeholder="Ketua RT / Bendahara / ..." required />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="pg-bidang">Bidang</Label>
                <Input id="pg-bidang" value={form.bidang} onChange={(e) => setForm({ ...form, bidang: e.target.value })} placeholder="Sosial / Keamanan / ..." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pg-urutan">Urutan</Label>
                <Input id="pg-urutan" type="number" min="0" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="pg-telp">Telepon</Label>
                <Input id="pg-telp" type="tel" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="0812xxxxxx" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pg-email">Email</Label>
                <Input id="pg-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : formMode === "edit" ? "Simpan" : "Tambah"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!hapus} onOpenChange={(o) => !o && setHapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengurus ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengurus &ldquo;{hapus?.nama}&rdquo; ({hapus?.jabatan}) akan dihapus permanen.
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

function PengurusCardLarge({ p, onEdit, onHapus }: {
  p: Pengurus; onEdit: () => void; onHapus: () => void;
}) {
  return (
    <Card className="border-primary bg-primary/5 p-5">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <Avatar className="h-20 w-20 shrink-0 sm:h-16 sm:w-16">
          <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">{getInitials(p.nama)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Ketua RT</p>
          <p className="text-lg font-bold">{p.nama}</p>
          <p className="text-sm text-primary">{p.jabatan}</p>
          {p.bidang && <Badge variant="secondary" className="mt-1">{p.bidang}</Badge>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {p.telepon && (
            <Button size="sm" variant="outline"
              onClick={() => openWhatsApp(phoneDigits(p.telepon), `Halo ${p.nama}, saya warga RT 002 Mawar`)}>
              <Phone className="h-4 w-4" /> WhatsApp
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${p.nama}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onHapus} aria-label={`Hapus ${p.nama}`}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PengurusCard({ p, onEdit, onHapus }: {
  p: Pengurus; onEdit: () => void; onHapus: () => void;
}) {
  return (
    <Card className="card-hover p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary"><User className="h-6 w-6" /></AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{p.nama}</p>
          <p className="truncate text-sm text-primary">{p.jabatan}</p>
          {p.bidang && <Badge variant="secondary" className="mt-1">{p.bidang}</Badge>}
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            {p.telepon && (
              <button type="button"
                onClick={() => openWhatsApp(phoneDigits(p.telepon), `Halo ${p.nama}`)}
                className="flex items-center gap-1.5 text-left hover:text-primary">
                <Phone className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.telepon}</span>
              </button>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 truncate hover:text-primary">
                <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${p.nama}`}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onHapus} aria-label={`Hapus ${p.nama}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
