"use client";

import { useEffect, useMemo, useState } from "react";
import { useFetch, postJSON, patchJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMounted } from "@/hooks/use-mounted";
import {
  PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, CardSkeleton,
  SectionTitle, openWhatsApp,
} from "@/components/shared";
import { formatTanggalID, relativeTime } from "@/lib/format";
import { toast } from "sonner";
import {
  Users, Plus, Search, Eye, Edit, Trash2, Phone, MapPin, User, Shield,
  UserPlus, X, IdCard, UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface AnggotaKK {
  id: string; wargaId: string; nama: string; nik?: string | null;
  jenisKelamin: "L" | "P"; hubungan: string; tanggalLahir?: string | null; createdAt: string;
}

type Hubungan = "Kepala Keluarga" | "Istri" | "Anak" | "Famili Lain";
const HUBUNGAN: Hubungan[] = ["Kepala Keluarga", "Istri", "Anak", "Famili Lain"];

const EMPTY_FORM = {
  nama: "", nik: "", noKK: "", noRumah: "", blok: "Mawar", telepon: "", pekerjaan: "",
  jenisKelamin: "L" as "L" | "P", role: "warga" as Warga["role"],
  jabatan: "", alamat: "", status: "aktif" as Warga["status"],
  jmlKeluarga: 0,
};

/** Mask NIK: show first 4 + "********" + last 4 (16-digit style) */
const maskNIK = (nik?: string | null) => {
  if (!nik) return "—";
  const d = nik.replace(/\D/g, "");
  if (d.length < 8) return nik;
  return `${d.slice(0, 4)}${"*".repeat(Math.min(8, d.length - 8))}${d.slice(-4)}`;
};
/** Mask telepon: first 2 + "******" + last 2 */
const maskTelepon = (t?: string | null) => {
  if (!t) return "—";
  const d = t.replace(/\D/g, "");
  if (d.length < 5) return t;
  return `${d.slice(0, 2)}${"*".repeat(Math.min(8, d.length - 4))}${d.slice(-2)}`;
};
const phoneDigits = (p?: string | null) => (p || "").replace(/\D/g, "");
const roleLabel = (r: string) => (r === "pengurus" ? "Pengurus" : r === "admin" ? "Admin" : "Warga");
const roleTone = (r: string) =>
  r === "pengurus" ? "bg-primary/10 text-primary" : r === "admin" ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground";
const jkLabel = (jk: string) => (jk === "P" ? "Perempuan" : "Laki-laki");
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((s) => s[0] || "").join("").toUpperCase() || "?";

type AnggotaFormRow = { nama: string; nik: string; hubungan: Hubungan; jenisKelamin: "L" | "P" };
const EMPTY_ROW: AnggotaFormRow = { nama: "", nik: "", hubungan: "Anak", jenisKelamin: "L" };

export function WargaView() {
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [anggotaRows, setAnggotaRows] = useState<AnggotaFormRow[]>([]);
  const [existingAnggota, setExistingAnggota] = useState<AnggotaKK[]>([]);
  const [newAnggota, setNewAnggota] = useState<AnggotaFormRow>(EMPTY_ROW);
  const [anggotaLoading, setAnggotaLoading] = useState(false);
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
    setFormMode("create"); setEditId(null);
    setForm(EMPTY_FORM); setAnggotaRows([]); setExistingAnggota([]);
    setNewAnggota(EMPTY_ROW); setFormOpen(true);
  }

  async function openEdit(w: Warga) {
    setFormMode("edit"); setEditId(w.id);
    setForm({
      nama: w.nama, nik: w.nik || "", noKK: w.noKK || "", noRumah: w.noRumah, blok: w.blok || "Mawar",
      telepon: w.telepon || "", pekerjaan: w.pekerjaan || "",
      jenisKelamin: w.jenisKelamin, role: w.role, jabatan: w.jabatan || "",
      alamat: w.alamat || "", status: w.status, jmlKeluarga: 0,
    });
    setExistingAnggota([]); setNewAnggota(EMPTY_ROW);
    setFormOpen(true); setDetail(null);
    setAnggotaLoading(true);
    try {
      const res = await fetch(`/api/warga/${w.id}/anggota`);
      const j = await res.json();
      if (Array.isArray(j.items)) setExistingAnggota(j.items);
    } catch { /* ignore */ }
    setAnggotaLoading(false);
  }

  function setJml(n: number) {
    const next = Math.max(0, Math.min(20, Number.isFinite(n) ? n : 0));
    setForm({ ...form, jmlKeluarga: next });
    setAnggotaRows((prev) => {
      const arr = [...prev];
      while (arr.length < next) arr.push({ ...EMPTY_ROW });
      arr.length = next;
      return arr;
    });
  }

  function setRow(i: number, patch: Partial<AnggotaFormRow>) {
    setAnggotaRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.noRumah.trim()) return toast.error("Nama & No Rumah wajib diisi");
    if (form.nik && form.nik.replace(/\D/g, "").length !== 16) return toast.error("NIK harus 16 digit");
    if (form.noKK && form.noKK.replace(/\D/g, "").length !== 16) return toast.error("No KK harus 16 digit");
    setSubmitting(true);
    const payload = {
      nama: form.nama.trim(), nik: form.nik || null, noKK: form.noKK || null,
      noRumah: form.noRumah.trim(), blok: form.blok || "Mawar",
      telepon: form.telepon || null, pekerjaan: form.pekerjaan || null,
      jenisKelamin: form.jenisKelamin, role: form.role,
      jabatan: form.role === "pengurus" ? form.jabatan || null : null,
      alamat: form.alamat || null, status: form.status,
    };
    let createdId: string | null = null;
    if (formMode === "edit" && editId) {
      const r = await patchJSON(`/api/warga/${editId}`, payload);
      if (!r.ok) { setSubmitting(false); return toast.error(r.error); }
      createdId = editId;
      toast.success("Warga diperbarui");
    } else {
      const r = await postJSON("/api/warga", payload);
      if (!r.ok) { setSubmitting(false); return toast.error(r.error); }
      createdId = (r.data as Warga | undefined)?.id || null;
      toast.success("Warga ditambahkan");
    }
    // On CREATE: sequentially POST each filled anggota row
    if (formMode === "create" && createdId) {
      const rows = anggotaRows.filter((a) => a.nama.trim());
      if (rows.length) {
        let ok = 0;
        for (const a of rows) {
          const r = await postJSON(`/api/warga/${createdId}/anggota`, {
            nama: a.nama.trim(), nik: a.nik || null,
            jenisKelamin: a.jenisKelamin, hubungan: a.hubungan,
          });
          if (r.ok) ok++;
        }
        if (ok) toast.success(`${ok} anggota keluarga ditambahkan`);
      }
    }
    setSubmitting(false);
    setFormOpen(false); refetch();
  }

  async function onAddAnggotaExisting() {
    if (!editId || !newAnggota.nama.trim()) return toast.error("Nama anggota wajib diisi");
    setSubmitting(true);
    const r = await postJSON(`/api/warga/${editId}/anggota`, {
      nama: newAnggota.nama.trim(), nik: newAnggota.nik || null,
      jenisKelamin: newAnggota.jenisKelamin, hubungan: newAnggota.hubungan,
    });
    setSubmitting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Anggota keluarga ditambahkan");
    setNewAnggota(EMPTY_ROW);
    try {
      const res = await fetch(`/api/warga/${editId}/anggota`);
      const j = await res.json();
      if (Array.isArray(j.items)) setExistingAnggota(j.items);
    } catch { /* ignore */ }
  }

  async function onDeleteAnggota(anggotaId: string) {
    if (!editId) return;
    const r = await deleteJSON(`/api/warga/${editId}/anggota/${anggotaId}`);
    if (!r.ok) return toast.error(r.error);
    toast.success("Anggota dihapus");
    setExistingAnggota((prev) => prev.filter((a) => a.id !== anggotaId));
  }

  async function onDelete() {
    if (!deleteId) return;
    const r = await deleteJSON(`/api/warga/${deleteId}`);
    if (!r.ok) return toast.error(r.error);
    toast.success("Warga dihapus");
    setDeleteId(null); setDetail(null); refetch();
  }

  const filtered = !!(q || roleFilter !== "all" || statusFilter !== "all");

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
        <StatCard title="Total KK" value={stats.totalKK} tone="neutral" icon={<UsersRound className="h-5 w-5" />} hint="Kepala Keluarga unik" />
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
                <TableHead>NIK</TableHead>
                <TableHead>No Rumah</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Pekerjaan</TableHead>
                <TableHead>JK</TableHead>
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
                  <TableCell className="font-mono text-xs tabular-nums">{maskNIK(w.nik)}</TableCell>
                  <TableCell>{w.blok} {w.noRumah}</TableCell>
                  <TableCell className="tabular-nums">{maskTelepon(w.telepon)}</TableCell>
                  <TableCell>{w.pekerjaan || "—"}</TableCell>
                  <TableCell>{w.jenisKelamin}</TableCell>
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

      {/* CREATE / EDIT Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => setFormOpen(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === "edit" ? "Edit Data Warga" : "Tambah Warga Baru"}</DialogTitle>
            <DialogDescription>Isi data kependudukan RT 002. Field bertanda * wajib diisi.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="f-nama">Nama Lengkap *</Label>
              <Input id="f-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="f-nik">NIK <span className="text-xs text-muted-foreground">(16 digit)</span></Label>
                <Input id="f-nik" type="tel" inputMode="numeric" maxLength={16} value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })} placeholder="7171xxxxxxxx0001" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-nokk">No KK <span className="text-xs text-muted-foreground">(16 digit)</span></Label>
                <Input id="f-nokk" type="tel" inputMode="numeric" maxLength={16} value={form.noKK} onChange={(e) => setForm({ ...form, noKK: e.target.value.replace(/\D/g, "") })} placeholder="7171xxxxxxxx0001" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="f-rumah">No Rumah *</Label>
                <Input id="f-rumah" value={form.noRumah} onChange={(e) => setForm({ ...form, noRumah: e.target.value })} placeholder="58" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-blok">Blok</Label>
                <Input id="f-blok" value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} placeholder="Mawar" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="f-telp">Telepon</Label>
                <Input id="f-telp" type="tel" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="0812xxxxxx" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-kerja">Pekerjaan</Label>
                <Input id="f-kerja" value={form.pekerjaan} onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })} placeholder="Karyawan" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Jenis Kelamin</Label>
                <Select value={form.jenisKelamin} onValueChange={(v) => setForm({ ...form, jenisKelamin: v as "L" | "P" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Warga["role"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="warga">Warga</SelectItem><SelectItem value="pengurus">Pengurus</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Warga["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="pindah">Pindah</SelectItem><SelectItem value="meninggal">Meninggal</SelectItem></SelectContent></Select>
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

            {/* Jml Keluarga + Anggota sub-form (CREATE mode) */}
            {formMode === "create" ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-primary" />
                    <Label htmlFor="f-jml" className="text-sm font-semibold">Jumlah Anggota Keluarga</Label>
                  </div>
                  <Input id="f-jml" type="number" min={0} max={20} value={form.jmlKeluarga} onChange={(e) => setJml(parseInt(e.target.value, 10) || 0)} className="h-9 w-20" aria-label="Jumlah anggota keluarga" />
                </div>
                {anggotaRows.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Isi data anggota keluarga — akan dibuat otomatis setelah warga tersimpan.</p>
                    {anggotaRows.map((a, i) => (
                      <div key={i} className="rounded-md border bg-card p-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-medium">Anggota #{i + 1}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setJml(anggotaRows.length - 1)} aria-label="Hapus baris anggota"><X className="h-3.5 w-3.5" /></Button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input placeholder="Nama anggota" value={a.nama} onChange={(e) => setRow(i, { nama: e.target.value })} className="h-9" />
                          <Input placeholder="NIK (16 digit)" inputMode="numeric" maxLength={16} value={a.nik} onChange={(e) => setRow(i, { nik: e.target.value.replace(/\D/g, "") })} className="h-9" />
                          <Select value={a.hubungan} onValueChange={(v) => setRow(i, { hubungan: v as Hubungan })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{HUBUNGAN.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select>
                          <Select value={a.jenisKelamin} onValueChange={(v) => setRow(i, { jenisKelamin: v as "L" | "P" })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* EDIT mode: list existing anggota + mini add form */
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Anggota Keluarga (KK)</span>
                  <Badge variant="secondary" className="ml-auto">{existingAnggota.length} anggota</Badge>
                </div>
                <div className="mt-2 space-y-2">
                  {anggotaLoading ? (
                    <p className="text-xs text-muted-foreground">Memuat anggota keluarga...</p>
                  ) : existingAnggota.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada anggota terdaftar untuk warga ini.</p>
                  ) : (
                    existingAnggota.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border bg-card p-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.nama}</p>
                          <p className="text-xs text-muted-foreground">{a.hubungan} • {jkLabel(a.jenisKelamin)} • NIK <span className="font-mono tabular-nums">{maskNIK(a.nik)}</span></p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onDeleteAnggota(a.id)} aria-label="Hapus anggota"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 border-t pt-2">
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-medium"><UserPlus className="h-3.5 w-3.5" /> Tambah Anggota Baru</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Nama anggota" value={newAnggota.nama} onChange={(e) => setNewAnggota({ ...newAnggota, nama: e.target.value })} className="h-9" />
                    <Input placeholder="NIK (16 digit)" inputMode="numeric" maxLength={16} value={newAnggota.nik} onChange={(e) => setNewAnggota({ ...newAnggota, nik: e.target.value.replace(/\D/g, "") })} className="h-9" />
                    <Select value={newAnggota.hubungan} onValueChange={(v) => setNewAnggota({ ...newAnggota, hubungan: v as Hubungan })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{HUBUNGAN.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select>
                    <Select value={newAnggota.jenisKelamin} onValueChange={(v) => setNewAnggota({ ...newAnggota, jenisKelamin: v as "L" | "P" })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2 touch-target" onClick={onAddAnggotaExisting} disabled={submitting}>
                    <Plus className="h-4 w-4" /> Tambah Anggota
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : formMode === "edit" ? "Simpan" : "Tambah"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {detail && (
            <WargaDetail w={detail} mounted={mounted} onEdit={() => openEdit(detail)} onDelete={() => setDeleteId(detail.id)} />
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
      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
        <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" /> {w.blok || "Mawar"} {w.noRumah}</p>
        <p className="flex items-center gap-1 text-muted-foreground"><IdCard className="h-3 w-3" /> <span className="font-mono tabular-nums">{maskNIK(w.nik)}</span></p>
        <p className="text-muted-foreground">Pekerjaan: <span className="text-foreground">{w.pekerjaan || "—"}</span></p>
        <p className="flex items-center gap-1 tabular-nums"><Phone className="h-3 w-3 text-muted-foreground" /> {maskTelepon(w.telepon)}</p>
      </div>
      <KKBadge wargaId={w.id} />
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" className="touch-target flex-1" onClick={onView}><Eye className="h-4 w-4" /> Lihat</Button>
        <Button size="sm" variant="outline" className="touch-target flex-1" onClick={onEdit}><Edit className="h-4 w-4" /> Edit</Button>
      </div>
    </div>
  );
}

/** Lazy badge: fetches anggota count per card. Shows "KK: N anggota" when count > 0. */
function KKBadge({ wargaId }: { wargaId: string }) {
  const { data } = useFetch<{ items: AnggotaKK[]; count: number }>(`/api/warga/${wargaId}/anggota`);
  if (!data || data.count === 0) return null;
  return (
    <div className="mt-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        <UsersRound className="h-3 w-3" /> KK: {data.count} anggota
      </span>
    </div>
  );
}

function WargaDetail({ w, mounted, onEdit, onDelete }: { w: Warga; mounted: boolean; onEdit: () => void; onDelete: () => void }) {
  const { data: agg, loading: aggLoading } = useFetch<{ items: AnggotaKK[]; count: number }>(`/api/warga/${w.id}/anggota`);
  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary">{initials(w.nama)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <DialogTitle className="uppercase tracking-wide">{w.nama}</DialogTitle>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleTone(w.role)}`}>{roleLabel(w.role)}</span>
              <StatusBadge status={w.status} />
            </div>
            {w.jabatan && <p className="mt-1 text-xs text-muted-foreground">{w.jabatan}</p>}
          </div>
        </div>
      </DialogHeader>
      <div className="space-y-2 text-sm">
        <DetailRow icon={<IdCard className="h-4 w-4" />} label="NIK" value={<span className="font-mono tabular-nums">{maskNIK(w.nik)}</span>} />
        {w.noKK && <DetailRow icon={<UsersRound className="h-4 w-4" />} label="No KK" value={<span className="font-mono tabular-nums">{maskNIK(w.noKK)}</span>} />}
        <DetailRow icon={<MapPin className="h-4 w-4" />} label="No Rumah" value={`${w.blok || "Mawar"} ${w.noRumah}`} />
        <DetailRow icon={<Phone className="h-4 w-4" />} label="Telepon" value={maskTelepon(w.telepon)} />
        <DetailRow icon={<User className="h-4 w-4" />} label="Pekerjaan" value={w.pekerjaan || "—"} />
        <DetailRow label="Jenis Kelamin" value={jkLabel(w.jenisKelamin)} />
        <DetailRow label="Bergabung" value={mounted ? `${formatTanggalID(w.tanggalBergabung)} · ${relativeTime(w.tanggalBergabung)}` : "\u00A0"} />
        {w.alamat && <DetailRow label="Alamat" value={w.alamat} />}
        {w.email && <DetailRow label="Email" value={w.email} />}
      </div>

      {/* Anggota Keluarga (KK) section */}
      <div className="mt-3 rounded-lg border bg-muted/30 p-3">
        <SectionTitle title="Anggota Keluarga (KK)" />
        {aggLoading ? (
          <p className="text-xs text-muted-foreground">Memuat anggota keluarga...</p>
        ) : agg && agg.count > 0 ? (
          <>
            <p className="mb-2 text-xs font-medium text-primary">Jumlah Keluarga: {agg.count} anggota</p>
            <div className="space-y-1.5">
              {agg.items.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border bg-card p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.nama}</p>
                    <p className="text-xs text-muted-foreground">{jkLabel(a.jenisKelamin)} • NIK <span className="font-mono tabular-nums">{maskNIK(a.nik)}</span></p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{a.hubungan}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Belum ada anggota keluarga terdaftar.</p>
        )}
      </div>

      <DialogFooter className="flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="flex-1" disabled={!w.telepon} onClick={() => openWhatsApp(phoneDigits(w.telepon!), `Halo ${w.nama}, info dari RT 002 Mawar`)}>
          <Phone className="h-4 w-4" /> WhatsApp
        </Button>
        <Button variant="outline" className="flex-1" onClick={onEdit}><Edit className="h-4 w-4" /> Edit</Button>
        <Button variant="destructive" className="flex-1" onClick={onDelete}><Trash2 className="h-4 w-4" /> Hapus</Button>
      </DialogFooter>
    </>
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
