"use client";

import { useRef, useState } from "react";
import { useFetch, postJSON, patchJSON, deleteJSON } from "@/hooks/use-fetch";
import { useMounted } from "@/hooks/use-mounted";
import { useBrandStore } from "@/lib/brand-store";
import { useAppStore } from "@/lib/store";
import {
  PageHeader, SectionTitle, ErrorState, CardSkeleton, Card, EmptyState,
} from "@/components/shared";
import {
  formatRupiah, parseRupiahInput, toThousandInput, relativeTime,
} from "@/lib/format";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Settings, Upload, Link2, Trash2, Edit, Plus, User, Users, Shield, Sun, Moon,
  Save, RefreshCw, Eye, EyeOff, Image as ImageIcon, QrCode, Wallet, Building2, KeyRound,
} from "lucide-react";

interface PengaturanResponse {
  settings: Record<string, string>;
  items: { key: string; value: string; kategori?: string | null }[];
}

type Role = "admin" | "ketua" | "bendahara" | "pengurus" | "warga";
interface UserItem {
  id: string; email: string; nama: string; role: Role;
  wargaId?: string | null; telepon?: string | null; foto?: string | null;
  status?: string | null; lastLogin?: string | null; createdAt: string;
}

const PROFIL_KEYS = ["nama_rt", "rw", "perumahan", "kota", "periode_pengurus", "alamat"] as const;
const KEUANGAN_KEYS = [
  "iuran_bulanan", "iuran_keamanan", "iuran_kebersihan",
  "bank_nama", "bank_rekening", "bank_pemilik", "qris_url",
] as const;

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "ketua", label: "Ketua RT" },
  { value: "bendahara", label: "Bendahara" },
  { value: "pengurus", label: "Pengurus" },
  { value: "warga", label: "Warga" },
];

function roleBadgeClass(role: string) {
  switch (role) {
    case "admin": return "bg-primary/15 text-primary";
    case "ketua": return "bg-success/15 text-success";
    case "bendahara": return "bg-warning/20 text-warning";
    case "pengurus": return "bg-info/15 text-info";
    default: return "bg-muted text-muted-foreground";
  }
}
function roleLabel(role: string) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label || role;
}
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** POST /api/upload with FormData field "file". Returns the URL or null on error. */
async function uploadImage(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await res.json();
    if (!res.ok) { toast.error(j?.error || "Gagal mengunggah"); return null; }
    return j.url as string;
  } catch {
    toast.error("Gagal terhubung ke server");
    return null;
  }
}

function isImageUrl(u: string) {
  return /^https?:\/\//.test(u) || u.startsWith("/uploads/");
}

export function PengaturanView() {
  const mounted = useMounted();
  const { data, loading, error, refetch } = useFetch<PengaturanResponse>("/api/pengaturan");
  const { theme, setTheme } = useTheme();
  const { role, setRole } = useAppStore();
  const { logoUrl: brandLogo, setBrand } = useBrandStore();
  const [tab, setTab] = useState("profil");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Independent users fetch
  const usersFetch = useFetch<{ items: UserItem[]; count: number }>("/api/auth/users");

  // Dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userMode, setUserMode] = useState<"create" | "edit">("create");
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<UserItem | null>(null);

  const settings = data?.settings || {};
  const isDark = mounted && theme === "dark";

  // --- Draft-overlay helpers (no useEffect sync, avoids lint) ---
  function getValue(key: string): string {
    return key in draft ? draft[key] : settings[key] ?? "";
  }
  function setValue(key: string, v: string) {
    setDraft((p) => ({ ...p, [key]: v }));
  }
  function clearDraft(keys: readonly string[]) {
    setDraft((p) => {
      const n = { ...p };
      for (const k of keys) delete n[k];
      return n;
    });
  }

  // --- Save handlers ---
  async function saveProfil() {
    const changes: Record<string, string> = {};
    for (const k of PROFIL_KEYS) if (k in draft) changes[k] = draft[k];
    if (Object.keys(changes).length === 0) return toast.info("Tidak ada perubahan");
    setSaving(true);
    const r = await patchJSON("/api/pengaturan", changes);
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Profil RT disimpan");
    if ("nama_rt" in changes) setBrand({ namaRT: changes.nama_rt });
    clearDraft(PROFIL_KEYS);
    refetch();
  }
  async function saveKeuangan() {
    const changes: Record<string, string> = {};
    for (const k of KEUANGAN_KEYS) {
      if (!(k in draft)) continue;
      changes[k] = k.startsWith("iuran_") ? String(parseRupiahInput(draft[k] || "0")) : draft[k];
    }
    if (Object.keys(changes).length === 0) return toast.info("Tidak ada perubahan");
    setSaving(true);
    const r = await patchJSON("/api/pengaturan", changes);
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Pengaturan keuangan disimpan");
    clearDraft(KEUANGAN_KEYS);
    refetch();
  }

  // --- Logo helpers ---
  async function applyLogo(url: string) {
    if (!isImageUrl(url)) return toast.error("URL harus dimulai dengan http:// atau /uploads/");
    setSaving(true);
    const r = await patchJSON("/api/pengaturan", { logo_url: url });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    setBrand({ logoUrl: url });
    setValue("logo_url", url);
    toast.success("Logo diperbarui");
    refetch();
  }
  async function onLogoFile(file: File | undefined) {
    if (!file) return;
    const url = await uploadImage(file);
    if (!url) return;
    await applyLogo(url);
  }
  async function clearLogo() {
    setSaving(true);
    const r = await patchJSON("/api/pengaturan", { logo_url: "" });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    setBrand({ logoUrl: "" });
    setValue("logo_url", "");
    toast.success("Logo dihapus");
    refetch();
  }

  // --- QRIS helpers ---
  async function applyQris(url: string) {
    if (!isImageUrl(url)) return toast.error("URL harus dimulai dengan http:// atau /uploads/");
    setSaving(true);
    const r = await patchJSON("/api/pengaturan", { qris_image: url });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    setValue("qris_image", url);
    toast.success("QRIS diperbarui. Kwitansi akan menampilkan QRIS ini.");
    refetch();
  }
  async function onQrisFile(file: File | undefined) {
    if (!file) return;
    const url = await uploadImage(file);
    if (!url) return;
    await applyQris(url);
  }
  async function clearQris() {
    setSaving(true);
    const r = await patchJSON("/api/pengaturan", { qris_image: "" });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    setValue("qris_image", "");
    toast.success("QRIS dihapus");
    refetch();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Pengaturan" icon={<Settings className="h-5 w-5" />} />
        <CardSkeleton className="h-12" />
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Pengaturan" icon={<Settings className="h-5 w-5" />} />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const currentLogo = getValue("logo_url") || brandLogo || "";
  const currentQris = getValue("qris_image") || "";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil RT, keuangan, akun login, & tampilan"
        icon={<Settings className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={refetch} className="touch-target">
            <RefreshCw className="h-4 w-4" /> Muat Ulang
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="profil" className="flex-1"><Building2 className="h-3.5 w-3.5" /> Profil</TabsTrigger>
          <TabsTrigger value="keuangan" className="flex-1"><Wallet className="h-3.5 w-3.5" /> Keuangan</TabsTrigger>
          <TabsTrigger value="akun" className="flex-1"><Users className="h-3.5 w-3.5" /> Akun</TabsTrigger>
          <TabsTrigger value="tampilan" className="flex-1"><Sun className="h-3.5 w-3.5" /> Tampilan</TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: Profil RT ===== */}
        <TabsContent value="profil" className="mt-3 space-y-3">
          {/* LOGO UPLOAD */}
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Logo RT" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
                {currentLogo ? (
                  <Image src={currentLogo} alt="Logo RT" width={112} height={112} unoptimized className="object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-[10px]">Tanpa logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Logo tampil di header aplikasi & kwitansi. PNG/JPG/WebP/SVG, maks 4MB.
                </p>
                <ImageFileButton label="Upload dari Perangkat" onPick={onLogoFile} disabled={saving} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input inputMode="url" placeholder="https://... atau /uploads/..." value={getValue("logo_url")} onChange={(e) => setValue("logo_url", e.target.value)} className="touch-target" aria-label="URL logo" />
                  <Button variant="secondary" disabled={saving} onClick={() => { const u = getValue("logo_url").trim(); if (!u) return toast.info("Tempel URL logo terlebih dahulu"); applyLogo(u); }} className="touch-target">
                    <Link2 className="h-4 w-4" /> Terapkan
                  </Button>
                </div>
                {currentLogo && (
                  <Button variant="outline" size="sm" disabled={saving} onClick={clearLogo} className="text-destructive touch-target">
                    <Trash2 className="h-4 w-4" /> Hapus Logo
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* PROFIL FORM */}
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Profil RT" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama RT" value={getValue("nama_rt")} onChange={(v) => setValue("nama_rt", v)} placeholder="RT 002 Blok Mawar" />
              <Field label="RW" value={getValue("rw")} onChange={(v) => setValue("rw", v)} placeholder="014" />
              <Field label="Perumahan" value={getValue("perumahan")} onChange={(v) => setValue("perumahan", v)} placeholder="Ciptaland" />
              <Field label="Kota" value={getValue("kota")} onChange={(v) => setValue("kota", v)} placeholder="Batam" />
              <Field label="Periode Pengurus" value={getValue("periode_pengurus")} onChange={(v) => setValue("periode_pengurus", v)} placeholder="2024-2027" />
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="set-alamat">Alamat</Label>
                <Textarea id="set-alamat" rows={2} value={getValue("alamat")} onChange={(e) => setValue("alamat", e.target.value)} placeholder="Alamat lengkap RT" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveProfil} disabled={saving} className="touch-target">
                <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ===== TAB 2: Keuangan ===== */}
        <TabsContent value="keuangan" className="mt-3 space-y-3">
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Iuran & Bank" />
            <div className="grid gap-3 sm:grid-cols-2">
              <RupiahField label="Iuran Bulanan" value={getValue("iuran_bulanan")} onChange={(v) => setValue("iuran_bulanan", v)} />
              <RupiahField label="Iuran Keamanan" value={getValue("iuran_keamanan")} onChange={(v) => setValue("iuran_keamanan", v)} />
              <RupiahField label="Iuran Kebersihan" value={getValue("iuran_kebersihan")} onChange={(v) => setValue("iuran_kebersihan", v)} />
              <Field label="Nama Bank" value={getValue("bank_nama")} onChange={(v) => setValue("bank_nama", v)} placeholder="Bank BRI" />
              <Field label="No. Rekening" value={getValue("bank_rekening")} onChange={(v) => setValue("bank_rekening", v)} placeholder="1234-5678-9012-3" />
              <Field label="Atas Nama" value={getValue("bank_pemilik")} onChange={(v) => setValue("bank_pemilik", v)} placeholder="Endang Marliana" />
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="set-qris-url">URL QRIS (link)</Label>
                <Input id="set-qris-url" inputMode="url" value={getValue("qris_url")} onChange={(e) => setValue("qris_url", e.target.value)} placeholder="https://qris.id/..." className="touch-target" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveKeuangan} disabled={saving} className="touch-target">
                <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </Card>

          {/* QRIS UPLOAD */}
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Gambar QRIS" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
                {currentQris ? (
                  <Image src={currentQris} alt="QRIS" width={128} height={128} unoptimized className="object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <QrCode className="h-8 w-8" />
                    <span className="text-[10px]">Belum ada</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  QRIS ini akan otomatis tampil di setiap kwitansi yang dicetak.
                </p>
                <ImageFileButton label="Upload dari Perangkat" onPick={onQrisFile} disabled={saving} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input inputMode="url" placeholder="https://... atau /uploads/..." value={getValue("qris_image")} onChange={(e) => setValue("qris_image", e.target.value)} className="touch-target" aria-label="URL gambar QRIS" />
                  <Button variant="secondary" disabled={saving} onClick={() => { const u = getValue("qris_image").trim(); if (!u) return toast.info("Tempel URL gambar QRIS terlebih dahulu"); applyQris(u); }} className="touch-target">
                    <Link2 className="h-4 w-4" /> Terapkan
                  </Button>
                </div>
                {currentQris && (
                  <Button variant="outline" size="sm" disabled={saving} onClick={clearQris} className="text-destructive touch-target">
                    <Trash2 className="h-4 w-4" /> Hapus QRIS
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ===== TAB 3: Akun (User Management) ===== */}
        <TabsContent value="akun" className="mt-3 space-y-3">
          <Card className="bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Akun ini terintegrasi dengan database dan digunakan untuk login admin, Ketua RT, Bendahara, pengurus, maupun warga.
              </p>
            </div>
          </Card>

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold sm:text-lg">Manajemen Akun Login</h2>
            <Button
              size="sm"
              onClick={() => { setUserMode("create"); setEditUser(null); setUserDialogOpen(true); }}
              className="touch-target"
            >
              <Plus className="h-4 w-4" /> Tambah User
            </Button>
          </div>

          {usersFetch.loading ? (
            <div className="grid gap-2">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} className="h-20" />)}
            </div>
          ) : usersFetch.error ? (
            <ErrorState message={usersFetch.error} onRetry={usersFetch.refetch} />
          ) : !usersFetch.data?.items?.length ? (
            <EmptyState
              icon={<User className="h-6 w-6" />}
              title="Belum ada akun"
              description="Tambahkan akun untuk admin, ketua, bendahara, pengurus, dan warga."
            />
          ) : (
            <div className="grid gap-2">
              {usersFetch.data.items.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  mounted={mounted}
                  onEdit={() => { setUserMode("edit"); setEditUser(u); setUserDialogOpen(true); }}
                  onDelete={() => setDeleteUserId(u.id)}
                  onReset={() => setResetUser(u)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB 4: Tampilan ===== */}
        <TabsContent value="tampilan" className="mt-3 space-y-3">
          <Card className="divide-y p-0">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                {isDark ? <Moon className="mt-0.5 h-5 w-5 text-primary" /> : <Sun className="mt-0.5 h-5 w-5 text-primary" />}
                <div>
                  <p className="text-sm font-medium">Tema Gelap</p>
                  <p className="text-xs text-muted-foreground">Beralih antara mode terang & gelap</p>
                </div>
              </div>
              <Switch checked={!!isDark} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} aria-label="Tema gelap" disabled={!mounted} />
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Mode Tampilan Warga</p>
                  <p className="text-xs text-muted-foreground">Tampilan mobile sederhana untuk warga</p>
                </div>
              </div>
              <Switch checked={role === "warga"} onCheckedChange={(c) => setRole(c ? "warga" : "admin")} aria-label="Mode warga" />
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionTitle title="Pratinjau Tema" />
            <div className="rounded-xl border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">RT 002 Blok Mawar</p>
                  <p className="text-xs text-muted-foreground">
                    {mounted ? (isDark ? "Mode Gelap aktif" : "Mode Terang aktif") : "\u00A0"}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {mounted ? (isDark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />) : null}
                  <span className="ml-1">{mounted ? (isDark ? "Gelap" : "Terang") : "\u00A0"}</span>
                </Badge>
              </div>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground">
            Perubahan tampilan langsung tersimpan otomatis di perangkat ini.
          </p>
        </TabsContent>
      </Tabs>

      {/* USER CREATE/EDIT DIALOG */}
      <UserFormDialog
        open={userDialogOpen}
        mode={userMode}
        user={editUser}
        onOpenChange={setUserDialogOpen}
        onSubmitted={() => { setUserDialogOpen(false); usersFetch.refetch(); }}
      />

      {/* RESET PASSWORD DIALOG */}
      <ResetPasswordDialog
        user={resetUser}
        onClose={() => setResetUser(null)}
        onDone={() => { setResetUser(null); usersFetch.refetch(); }}
      />

      {/* DELETE USER ALERT */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(o) => !o && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa dibatalkan. Akun akan dihapus permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-target">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="touch-target bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!deleteUserId) return;
                const r = await deleteJSON(`/api/auth/users/${deleteUserId}`);
                if (!r.ok) return toast.error(r.error);
                toast.success("User dihapus");
                setDeleteUserId(null);
                usersFetch.refetch();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="touch-target" />
    </div>
  );
}

function RupiahField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const num = parseRupiahInput(value || "");
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input inputMode="numeric" value={value ? toThousandInput(num) : ""} onChange={(e) => onChange(e.target.value)} placeholder="0" className="touch-target" />
      <p className="text-xs text-muted-foreground">{formatRupiah(num)}</p>
    </div>
  );
}

function ImageFileButton({ label, onPick, disabled }: {
  label: string; onPick: (f: File | undefined) => Promise<void> | void; disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0];
        if (f) { setBusy(true); await onPick(f); setBusy(false); }
        if (ref.current) ref.current.value = "";
      }} />
      <Button size="sm" disabled={disabled || busy} onClick={() => ref.current?.click()} className="touch-target">
        <Upload className="h-4 w-4" /> {busy ? "Mengunggah..." : label}
      </Button>
    </>
  );
}

function UserRow({ user, mounted, onEdit, onDelete, onReset }: {
  user: UserItem; mounted: boolean;
  onEdit: () => void; onDelete: () => void; onReset: () => void;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          {user.foto ? <AvatarImage src={user.foto} alt={user.nama} /> : null}
          <AvatarFallback className={roleBadgeClass(user.role)}>{initialsOf(user.nama)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{user.nama}</p>
            <Badge variant="secondary" className={roleBadgeClass(user.role)}>{roleLabel(user.role)}</Badge>
            {user.status && user.status !== "aktif" && (
              <Badge variant="outline" className="text-muted-foreground">{user.status}</Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {user.telepon && <span>{user.telepon}</span>}
            {user.lastLogin && mounted ? (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>·</span> Login {relativeTime(user.lastLogin)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="touch-target h-9 w-9" onClick={onReset} aria-label="Reset password" title="Reset Password">
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="touch-target h-9 w-9" onClick={onEdit} aria-label="Edit user" title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="touch-target h-9 w-9 text-destructive" onClick={onDelete} aria-label="Hapus user" title="Hapus">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function UserFormDialog({ open, mode, user, onOpenChange, onSubmitted }: {
  open: boolean; mode: "create" | "edit"; user: UserItem | null;
  onOpenChange: (o: boolean) => void; onSubmitted: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah User" : "Edit User"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Isi data akun login baru" : `Perbarui data ${user?.nama || ""}`}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <UserFormInner
            key={mode === "edit" ? user?.id || "edit" : "new"}
            mode={mode}
            user={user}
            onSubmitted={onSubmitted}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserFormInner({ mode, user, onSubmitted, onCancel }: {
  mode: "create" | "edit"; user: UserItem | null;
  onSubmitted: () => void; onCancel: () => void;
}) {
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState(user?.nama || "");
  const [role, setRole] = useState<Role>((user?.role as Role) || "warga");
  const [telepon, setTelepon] = useState(user?.telepon || "");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (mode === "create") {
      if (!email) return toast.error("Email wajib diisi");
      if (!nama) return toast.error("Nama wajib diisi");
      if (!password) return toast.error("Password wajib diisi");
      if (password.length < 6) return toast.error("Password minimal 6 karakter");
      setSubmitting(true);
      const r = await postJSON("/api/auth/users", { email, password, nama, role, telepon });
      setSubmitting(false);
      if (!r.ok) return toast.error(r.error);
      toast.success(`User ${email} ditambahkan`);
      onSubmitted();
    } else {
      if (!user) return;
      if (!nama) return toast.error("Nama wajib diisi");
      const body: Record<string, string> = { nama, role, telepon };
      if (password) {
        if (password.length < 6) return toast.error("Password minimal 6 karakter");
        body.password = password;
      }
      setSubmitting(true);
      const r = await patchJSON(`/api/auth/users/${user.id}`, body);
      setSubmitting(false);
      if (!r.ok) return toast.error(r.error);
      toast.success(`User ${user.email} diperbarui`);
      onSubmitted();
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="u-email">Email *</Label>
        <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={mode === "edit"} placeholder="email@rt002mawar.id" className="touch-target" />
        {mode === "edit" && <p className="text-[11px] text-muted-foreground">Email tidak dapat diubah</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="u-nama">Nama Lengkap *</Label>
        <Input id="u-nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" className="touch-target" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="u-pw">{mode === "create" ? "Password *" : "Password"}</Label>
        <div className="relative">
          <Input id="u-pw" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "edit" ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"} className="touch-target pr-10" />
          <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}>
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="u-role">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger id="u-role" className="touch-target w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="u-telepon">Telepon</Label>
        <Input id="u-telepon" type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="0812xxxxxxx" className="touch-target" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} className="touch-target">Batal</Button>
        <Button onClick={submit} disabled={submitting} className="touch-target">
          <Save className="h-4 w-4" /> {submitting ? "Menyimpan..." : mode === "create" ? "Tambah" : "Simpan"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function ResetPasswordDialog({ user, onClose, onDone }: {
  user: UserItem | null; onClose: () => void; onDone: () => void;
}) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleClose(o: boolean) {
    if (!o) { setPw(""); setShow(false); onClose(); }
  }

  async function submit() {
    if (!user) return;
    if (pw.length < 6) return toast.error("Password minimal 6 karakter");
    setSubmitting(true);
    const r = await patchJSON(`/api/auth/users/${user.id}`, { password: pw });
    setSubmitting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(`Password ${user.email} diperbarui`);
    setPw("");
    onDone();
  }

  return (
    <Dialog open={!!user} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set password baru untuk <strong>{user?.email}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="rp-pw">Password Baru</Label>
            <div className="relative">
              <Input id="rp-pw" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min. 6 karakter" className="touch-target pr-10" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)} className="touch-target">Batal</Button>
            <Button onClick={submit} disabled={submitting} className="touch-target">
              <KeyRound className="h-4 w-4" /> {submitting ? "Menyimpan..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
