"use client";

import { useState } from "react";
import { useFetch, postJSON, patchJSON, deleteJSON } from "@/hooks/use-fetch";
import { PageHeader, EmptyState, ErrorState, CardSkeleton, Card, openWhatsApp } from "@/components/shared";
import { RT_INFO } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Network, Plus, Phone, Mail, Trash2, Edit, User, Crown } from "lucide-react";

interface Pengurus {
  id: string; nama: string; jabatan: string; urutan: number;
  telepon?: string | null; email?: string | null; foto?: string | null;
  bidang?: string | null; periode: string;
}

const JABATAN_OPTIONS = [
  "Ketua RT 002", "Bendahara RT 002", "Sekretaris RT 002",
  "Koordinator Keamanan", "Koordinator Kebersihan", "Koordinator Sosial",
  "Koordinator Pemuda", "Koordinator Agama", "Staf Administrasi",
];

const EMPTY_FORM = { nama: "", jabatan: "", bidang: "", telepon: "", email: "", urutan: "0" };

/** First letters of first 2 words, uppercase. */
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || "").join("") || "?";
}
function phoneDigits(p?: string | null) { return (p || "").replace(/\D/g, ""); }
/** Normalize 08… / 62… / +62… → 62… for wa.me. */
function waNumber(p?: string | null) {
  const d = phoneDigits(p);
  if (!d) return "";
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("62")) return d;
  return d;
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
  const ketua = items.find((p) => /ketua/i.test(p.jabatan));
  const bendahara = items.find((p) => p !== ketua && /bendahara/i.test(p.jabatan));
  const sekretaris = items.find((p) => p !== ketua && p !== bendahara && /sekretaris/i.test(p.jabatan));
  const tier2 = [bendahara, sekretaris].filter(Boolean) as Pengurus[];
  const tier2Ids = new Set(tier2.map((p) => p.id));
  const koordinator = items
    .filter((p) => p !== ketua && !tier2Ids.has(p.id))
    .sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0) || a.nama.localeCompare(b.nama));

  function openCreate() { setFormMode("create"); setEditId(null); setForm(EMPTY_FORM); setFormOpen(true); }
  function openEdit(p: Pengurus) {
    setFormMode("edit"); setEditId(p.id);
    setForm({ nama: p.nama, jabatan: p.jabatan, bidang: p.bidang || "", telepon: p.telepon || "", email: p.email || "", urutan: String(p.urutan ?? 0) });
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
    const r = formMode === "edit" && editId ? await patchJSON(`/api/pengurus/${editId}`, payload) : await postJSON("/api/pengurus", payload);
    setSubmitting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(formMode === "edit" ? "Perubahan disimpan" : "Pengurus ditambahkan");
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

  const isJabatanKnown = JABATAN_OPTIONS.includes(form.jabatan);
  const selectValue = form.jabatan === "" ? "" : isJabatanKnown ? form.jabatan : "__other__";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Struktur Pengurus RT 002"
        description={`Susunan pengurus RT ${RT_INFO.rt} / RW ${RT_INFO.rw} Blok ${RT_INFO.blok}`}
        icon={<Network className="h-5 w-5" />}
        actions={<Button onClick={openCreate} className="touch-target"><Plus className="h-4 w-4" /> Tambah Pengurus</Button>}
      />

      {/* HERO BANNER — green gradient */}
      <div className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-primary/70 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/85">Pengurus RT 002 Blok Mawar</p>
            <h2 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">Struktur Organisasi</h2>
            <p className="mt-1.5 text-sm text-white/85">Periode {periode} • Perumahan Ciptaland, Batam</p>
          </div>
          <div className="flex items-center gap-2.5 self-start rounded-xl bg-white/15 px-3.5 py-2.5 backdrop-blur-sm sm:self-auto">
            <Crown className="h-5 w-5 shrink-0" />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wide text-white/75">Periode</p>
              <p className="text-sm font-bold">{periode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BODY — Org Chart */}
      {loading ? (
        <OrgChartSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Network className="h-6 w-6" />}
          title="Belum ada pengurus"
          description="Tambahkan pengurus RT untuk mulai menyusun struktur organisasi."
          action={<Button onClick={openCreate} className="touch-target"><Plus className="h-4 w-4" /> Tambah Pengurus</Button>}
        />
      ) : (
        <div className="space-y-0">
          {/* LEVEL 1 — Ketua RT */}
          {ketua && (<>
            <div className="mx-auto max-w-md">
              <KetuaCard p={ketua} onEdit={() => openEdit(ketua)} onHapus={() => setHapus(ketua)} />
            </div>
            {(tier2.length > 0 || koordinator.length > 0) && <ConnectorV />}
          </>)}

          {/* LEVEL 2 — Bendahara + Sekretaris */}
          {tier2.length > 0 && (<>
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              {tier2.map((p) => (
                <Tier2Card key={p.id} p={p} onEdit={() => openEdit(p)} onHapus={() => setHapus(p)} />
              ))}
            </div>
            {koordinator.length > 0 && <ConnectorBranch />}
          </>)}

          {/* LEVEL 3 — Koordinator */}
          {koordinator.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {koordinator.map((p) => (
                <Tier3Card key={p.id} p={p} onEdit={() => openEdit(p)} onHapus={() => setHapus(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIALOG: Tambah / Edit Pengurus */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              {formMode === "edit" ? "Edit Pengurus" : "Tambah Pengurus RT 002"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "edit" ? "Perbarui data pengurus. Field bertanda * wajib diisi." : "Lengkapi data pengurus baru RT 002. Field bertanda * wajib diisi."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Avatar preview (live initials) */}
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-primary/20">
                {form.nama.trim() ? initials(form.nama) : <User className="h-8 w-8" />}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pg-nama">Nama Lengkap *</Label>
              <Input id="pg-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap pengurus" required className="touch-target" autoComplete="off" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pg-jabatan">Jabatan *</Label>
              <Select value={selectValue} onValueChange={(v) => v === "__other__" ? setForm({ ...form, jabatan: "" }) : setForm({ ...form, jabatan: v })}>
                <SelectTrigger id="pg-jabatan" className="touch-target w-full">
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {JABATAN_OPTIONS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  <SelectItem value="__other__">Lainnya…</SelectItem>
                </SelectContent>
              </Select>
              {!isJabatanKnown && (
                <Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} placeholder="Ketik jabatan kustom" required className="touch-target" autoComplete="off" />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pg-bidang">Bidang</Label>
              <Input id="pg-bidang" value={form.bidang} onChange={(e) => setForm({ ...form, bidang: e.target.value })} placeholder="Pimpinan / Keuangan / Keamanan / ..." className="touch-target" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pg-telp">Telepon</Label>
                <Input id="pg-telp" type="tel" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="0812xxxxxx" className="touch-target" autoComplete="tel" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pg-email">Email</Label>
                <Input id="pg-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" className="touch-target" autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pg-urutan">Urutan</Label>
              <Input id="pg-urutan" type="number" min="0" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} className="touch-target" />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="touch-target">Batal</Button>
              <Button type="submit" disabled={submitting} className="touch-target">{submitting ? "Menyimpan..." : "Simpan"}</Button>
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

/** Vertical connector line between org-chart tiers. */
function ConnectorV() {
  return <div className="mx-auto my-1 h-8 w-0.5 bg-primary/30 sm:h-10" aria-hidden="true" />;
}

/** Vertical drop + horizontal branch (desktop) connecting L2 to L3. */
function ConnectorBranch() {
  return (
    <div aria-hidden="true">
      <div className="mx-auto h-8 w-0.5 bg-primary/30 sm:h-10" />
      <div className="mx-auto hidden h-0.5 w-full max-w-3xl bg-primary/30 sm:block" />
      <div className="mx-auto h-4 w-0.5 bg-primary/30" />
    </div>
  );
}

/** LEVEL 1 — Ketua RT (centered, large highlighted card with Crown overlay). */
function KetuaCard({ p, onEdit, onHapus }: { p: Pengurus; onEdit: () => void; onHapus: () => void; }) {
  const wa = waNumber(p.telepon);
  return (
    <Card className="relative border-2 border-primary bg-primary/5 p-5 shadow-sm sm:p-6">
      <div className="absolute right-3 top-3 flex gap-1">
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${p.nama}`} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={onHapus} aria-label={`Hapus ${p.nama}`} className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <Avatar className="h-24 w-24 ring-4 ring-primary/15">
            {p.foto ? <AvatarImage src={p.foto} alt={p.nama} /> : null}
            <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">{initials(p.nama)}</AvatarFallback>
          </Avatar>
          <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background">
            <Crown className="h-4 w-4" />
          </div>
        </div>
        <h3 className="text-xl font-bold">{p.nama}</h3>
        <Badge className="mt-2 bg-primary text-primary-foreground"><Crown className="h-3 w-3" /> {p.jabatan}</Badge>
        {p.bidang && <p className="mt-1 text-xs text-muted-foreground">{p.bidang}</p>}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
          {p.telepon && (
            <button type="button" onClick={() => openWhatsApp(wa, `Halo ${p.nama}, saya warga RT 002 Mawar`)} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">
              <Phone className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.telepon}</span>
            </button>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">
              <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.email}</span>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

/** LEVEL 2 — Bendahara / Sekretaris (medium cards). */
function Tier2Card({ p, onEdit, onHapus }: { p: Pengurus; onEdit: () => void; onHapus: () => void; }) {
  const wa = waNumber(p.telepon);
  return (
    <Card className="relative border border-primary/40 bg-card p-4 shadow-sm sm:p-5">
      <div className="absolute right-2 top-2 flex gap-1">
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${p.nama}`} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={onHapus} aria-label={`Hapus ${p.nama}`} className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 ring-2 ring-primary/15">
          {p.foto ? <AvatarImage src={p.foto} alt={p.nama} /> : null}
          <AvatarFallback className="bg-primary/15 text-base font-bold text-primary">{initials(p.nama)}</AvatarFallback>
        </Avatar>
        <p className="mt-2 truncate font-semibold">{p.nama}</p>
        <Badge variant="outline" className="mt-1 border-primary/30 bg-primary/10 text-primary">{p.jabatan}</Badge>
        {p.bidang && <p className="mt-1 truncate text-xs text-muted-foreground">{p.bidang}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          {p.telepon && (
            <button type="button" onClick={() => openWhatsApp(wa, `Halo ${p.nama}`)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
              <Phone className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.telepon}</span>
            </button>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
              <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.email}</span>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

/** LEVEL 3 — Koordinator (standard grid cards). */
function Tier3Card({ p, onEdit, onHapus }: { p: Pengurus; onEdit: () => void; onHapus: () => void; }) {
  const wa = waNumber(p.telepon);
  return (
    <Card className="card-hover relative p-4">
      <div className="absolute right-2 top-2 flex gap-1">
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${p.nama}`} className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={onHapus} aria-label={`Hapus ${p.nama}`} className="h-7 w-7 p-0"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
      </div>
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          {p.foto ? <AvatarImage src={p.foto} alt={p.nama} /> : null}
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">{initials(p.nama)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 pr-14">
          <p className="truncate font-semibold">{p.nama}</p>
          <Badge variant="secondary" className="mt-1">{p.jabatan}</Badge>
          {p.bidang && <p className="mt-1 truncate text-xs text-muted-foreground">{p.bidang}</p>}
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            {p.telepon && (
              <button type="button" onClick={() => openWhatsApp(wa, `Halo ${p.nama}`)} className="flex items-center gap-1.5 text-left hover:text-primary">
                <Phone className="h-3 w-3 shrink-0" /> <span className="truncate">{p.telepon}</span>
              </button>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 truncate hover:text-primary">
                <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{p.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Loading skeleton mirroring the org-chart layout (3 tiers). */
function OrgChartSkeleton() {
  return (
    <div className="space-y-0">
      <div className="mx-auto max-w-md">
        <CardSkeleton className="h-56 border-2 border-primary/30" />
      </div>
      <ConnectorV />
      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
        <CardSkeleton className="h-44" />
        <CardSkeleton className="h-44" />
      </div>
      <ConnectorBranch />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} className="h-32" />)}
      </div>
    </div>
  );
}
