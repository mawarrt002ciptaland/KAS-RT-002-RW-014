"use client";

import { useEffect, useMemo, useState } from "react";
import { useFetch, postJSON, patchJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, CardSkeleton, openWhatsApp } from "@/components/shared";
import { formatTanggalID, relativeTime } from "@/lib/format";
import { toast } from "sonner";
import { Users, Plus, Search, Eye, Edit, Trash2, Phone, MapPin, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Warga {
  id: string; nama: string; noRumah: string; blok?: string;
  telepon?: string | null; pekerjaan?: string | null; jenisKelamin: "L" | "P";
  role: "warga" | "pengurus" | "admin"; jabatan?: string | null; alamat?: string | null;
  status: "aktif" | "pindah" | "meninggal"; tanggalBergabung: string;
  email?: string | null; nik?: string | null; noKK?: string | null;
}

const EMPTY_FORM = {
  nama: "", noRumah: "", blok: "Mawar", telepon: "", pekerjaan: "",
  jenisKelamin: "L" as "L" | "P", role: "warga" as Warga["role"],
  jabatan: "", alamat: "", status: "aktif" as Warga["status"],
};

const maskPhone = (p?: string | null) => {
  if (!p) return "—";
  const d = p.replace(/\D/g, "");
  if (d.length < 5) return p;
  return `${d.slice(0, 2)}${"*".repeat(Math.min(8, d.length - 4))}${d.slice(-2)}`;
};
const phoneDigits = (p?: string | null) => (p || "").replace(/\D/g, "");
const roleLabel = (r: string) => (r === "pengurus" ? "Pengurus" : r === "admin" ? "Admin" : "Warga");
const roleTone = (r: string) =>
  r === "pengurus" ? "bg-primary/10 text-primary" : r === "admin" ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground";
const jkLabel = (jk: string) => (jk === "P" ? "Perempuan" : "Laki-laki");

export function WargaView() {
  const isMobile = useIsMobile();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<Warga | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const apiUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ.trim()) p.set("q", debouncedQ.trim());
    if (roleFilter !== "all") p.set("role", roleFilter);
    const qs = p.toString();
    return `/api/warga${qs ? `?${qs}` : ""}`;
  }, [debouncedQ, roleFilter]);

  const { data, loading, error, refetch } = useFetch<{ items: Warga[]; total: number; totalKK: number }>(apiUrl);

  const items = useMemo(() => {
    if (!data?.items) return [];
    return statusFilter === "all" ? data.items : data.items.filter((w) => w.status === statusFilter);
  }, [data, statusFilter]);

  const stats = useMemo(() => {
    const list = data?.items || [];
    return {
      total: data?.total ?? 0,
      totalKK: data?.totalKK ?? 0,
      aktif: list.filter((w) => w.status === "aktif").length,
      pengurus: list.filter((w) => w.role === "pengurus").length,
    };
  }, [data]);

  function openCreate() {
    setFormMode("create"); setEditId(null); setForm(EMPTY_FORM); setFormOpen(true);
  }
  function openEdit(w: Warga) {
    setFormMode("edit"); setEditId(w.id);
    setForm({
      nama: w.nama, noRumah: w.noRumah, blok: w.blok || "Mawar",
      telepon: w.telepon || "", pekerjaan: w.pekerjaan || "",
      jenisKelamin: w.jenisKelamin, role: w.role, jabatan: w.jabatan || "",
      alamat: w.alamat || "", status: w.status,
    });
    setFormOpen(true); setDetail(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.noRumah.trim()) return toast.error("Nama & No Rumah wajib diisi");
    setSubmitting(true);
    const payload = {
      nama: form.nama.trim(), noRumah: form.noRumah.trim(), blok: form.blok || "Mawar",
      telepon: form.telepon || null, pekerjaan: form.pekerjaan || null,
      jenisKelamin: form.jenisKelamin, role: form.role,
      jabatan: form.role === "pengurus" ? form.jabatan || null : null,
      alamat: form.alamat || null, status: form.status,
    };
    const r = formMode === "edit" && editId
      ? await patchJSON(`/api/warga/${editId}`, payload)
      : await postJSON("/api/warga", payload);
    setSubmitting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(formMode === "edit" ? "Warga diperbarui" : "Warga ditambahkan");
    setFormOpen(false); refetch();
  }

  async function onDelete() {
    if (!deleteId) return;
    const r = await deleteJSON(`/api/warga/${deleteId}`);
    if (!r.ok) return toast.error(r.error);
    toast.success("Warga dihapus");
    setDeleteId(null); setDetail(null); refetch();
  }

  const filtered = q || roleFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Warga"
        description="Database kependudukan RT 002 Blok Mawar"
        icon={<Users className="h-5 w-5" />}
        actions={<Button onClick={openCreate} className="touch-target"><Plus className="h-4 w-4" /> Tambah Warga</Button>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Warga" value={stats.total} icon={<Users className="h-5 w-5" />} hint="Seluruh warga terdaftar" />
        <StatCard title="Total KK" value={stats.totalKK} tone="neutral" icon={<User className="h-5 w-5" />} hint="Kepala Keluarga unik" />
        <StatCard title="Warga Aktif" value={stats.aktif} tone="income" icon={<Shield className="h-5 w-5" />} hint="Status aktif" />
        <StatCard title="Pengurus" value={stats.pengurus} tone="warning" icon={<Shield className="h-5 w-5" />} hint="Pengurus RT aktif" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, no rumah, telepon, pekerjaan..." className="pl-9" aria-label="Cari warga" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filter peran"><SelectValue placeholder="Peran" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Peran</SelectItem>
              <SelectItem value="warga">Warga</SelectItem>
              <SelectItem value="pengurus">Pengurus</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filter status"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="pindah">Pindah</SelectItem>
              <SelectItem value="meninggal">Meninggal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Belum ada data warga"
          description={filtered ? "Tidak ada warga yang cocok dengan filter." : "Tambahkan warga pertama RT 002."}
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Warga</Button>}
        />
      ) : isMobile ? (
        <div className="grid gap-2">
          {items.map((w) => (
            <WargaCard key={w.id} w={w} onView={() => setDetail(w)} onEdit={() => openEdit(w)} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>No Rumah</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Pekerjaan</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((w, i) => (
                <TableRow key={w.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-semibold uppercase tracking-wide">{w.nama}</TableCell>
                  <TableCell>{w.blok} {w.noRumah}</TableCell>
                  <TableCell className="tabular-nums">{maskPhone(w.telepon)}</TableCell>
                  <TableCell>{w.pekerjaan || "—"}</TableCell>
                  <TableCell>{jkLabel(w.jenisKelamin)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleTone(w.role)}`}>{roleLabel(w.role)}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={w.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDetail(w)} aria-label="Lihat detail warga"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(w)} aria-label="Edit warga"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(w.id)} aria-label="Hapus warga"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === "edit" ? "Edit Data Warga" : "Tambah Warga Baru"}</DialogTitle>
            <DialogDescription>Isi data kependudukan RT 002. Field bertanda * wajib diisi.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="f-nama">Nama Lengkap *</Label>
                <Input id="f-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-rumah">No Rumah *</Label>
                <Input id="f-rumah" value={form.noRumah} onChange={(e) => setForm({ ...form, noRumah: e.target.value })} placeholder="58" required />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="f-blok">Blok</Label>
                <Input id="f-blok" value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} placeholder="Mawar" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-telp">Telepon</Label>
                <Input id="f-telp" type="tel" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="0812xxxxxx" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="f-kerja">Pekerjaan</Label>
                <Input id="f-kerja" value={form.pekerjaan} onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })} placeholder="Karyawan" />
              </div>
              <div className="space-y-1">
                <Label>Jenis Kelamin</Label>
                <Select value={form.jenisKelamin} onValueChange={(v) => setForm({ ...form, jenisKelamin: v as "L" | "P" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Warga["role"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warga">Warga</SelectItem>
                    <SelectItem value="pengurus">Pengurus</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Warga["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="pindah">Pindah</SelectItem>
                    <SelectItem value="meninggal">Meninggal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.role === "pengurus" && (
              <div className="space-y-1">
                <Label htmlFor="f-jabatan">Jabatan Pengurus</Label>
                <Input id="f-jabatan" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} placeholder="Koordinator Sosial" />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="f-alamat">Alamat</Label>
              <Textarea id="f-alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat lengkap" rows={2} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : formMode === "edit" ? "Simpan" : "Tambah"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary"><User className="h-7 w-7" /></AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="uppercase tracking-wide">{detail.nama}</DialogTitle>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleTone(detail.role)}`}>{roleLabel(detail.role)}</span>
                      <StatusBadge status={detail.status} />
                    </div>
                    {detail.jabatan && <p className="mt-1 text-xs text-muted-foreground">{detail.jabatan}</p>}
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <DetailRow icon={<MapPin className="h-4 w-4" />} label="No Rumah" value={`${detail.blok || "Mawar"} ${detail.noRumah}`} />
                <DetailRow icon={<Phone className="h-4 w-4" />} label="Telepon" value={maskPhone(detail.telepon)} />
                <DetailRow icon={<User className="h-4 w-4" />} label="Pekerjaan" value={detail.pekerjaan || "—"} />
                <DetailRow label="Jenis Kelamin" value={jkLabel(detail.jenisKelamin)} />
                <DetailRow label="Bergabung" value={`${formatTanggalID(detail.tanggalBergabung)} · ${relativeTime(detail.tanggalBergabung)}`} />
                {detail.alamat && <DetailRow label="Alamat" value={detail.alamat} />}
                {detail.email && <DetailRow label="Email" value={detail.email} />}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" disabled={!detail.telepon} onClick={() => openWhatsApp(phoneDigits(detail.telepon!), `Halo ${detail.nama}, info dari RT 002 Mawar`)}>
                  <Phone className="h-4 w-4" /> WhatsApp
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => openEdit(detail)}><Edit className="h-4 w-4" /> Edit</Button>
                <Button variant="destructive" className="flex-1" onClick={() => setDeleteId(detail.id)}><Trash2 className="h-4 w-4" /> Hapus</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data warga ini?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Data warga akan dihapus permanen dari database RT 002.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-white hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WargaCard({ w, onView, onEdit }: { w: Warga; onView: () => void; onEdit: () => void }) {
  return (
    <div className="card-hover rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-wide">{w.nama}</p>
        <StatusBadge status={w.status} />
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{roleLabel(w.role)}{w.jabatan ? ` • ${w.jabatan}` : ""}</p>
      <p className="mt-2 text-sm">{w.blok || "Mawar"} {w.noRumah}</p>
      <p className="text-xs text-muted-foreground">Pekerjaan: {w.pekerjaan || "—"}</p>
      <p className="mt-1 flex items-center gap-1 text-sm tabular-nums"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {maskPhone(w.telepon)}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" className="touch-target flex-1" onClick={onView}><Eye className="h-4 w-4" /> Lihat</Button>
        <Button size="sm" variant="outline" className="touch-target flex-1" onClick={onEdit}><Edit className="h-4 w-4" /> Edit</Button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 border-b border-border/60 pb-2 last:border-0">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words font-medium">{value}</p>
      </div>
    </div>
  );
}
