"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useFetch, postJSON, deleteJSON } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMounted } from "@/hooks/use-mounted";
import {
  PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, CardSkeleton,
  SectionTitle, Card, openWhatsApp,
} from "@/components/shared";
import {
  formatRupiah, parseRupiahInput, toThousandInput, relativeTime, formatTanggalID,
} from "@/lib/format";
import { KATEGORI_MARKETPLACE } from "@/lib/constants";
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
import {
  ShoppingBag, Plus, Search, MessageCircle, Trash2, Eye, Edit, Upload, Link2, X,
  Camera, Image as ImageIcon, Loader2, Package,
} from "lucide-react";

type Kondisi = "baru" | "bekas";
interface Marketplace {
  id: string; nama: string; kategori: string; harga: number; deskripsi: string;
  fotoUrl?: string | null; penjual: string; telepon: string; kondisi: Kondisi;
  status: "tersedia" | "terjual"; createdAt: string;
}

const KATEGORI_BG: Record<string, string> = {
  Makanan: "bg-success/15",
  Jasa: "bg-info/15",
  Barang: "bg-primary/10",
  Kuliner: "bg-warning/20",
  Otomotif: "bg-destructive/10",
  Lainnya: "bg-muted",
};
const kategoriBg = (k: string) => KATEGORI_BG[k] || "bg-muted";
const buildWaMessage = (it: Marketplace) =>
  "Halo " + it.penjual + ", saya tertarik dengan " + it.nama;
const firstLetter = (s: string) => (s.trim()[0] || "?").toUpperCase();

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  if (!p[0]) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** POST /api/upload with FormData field "file" → returns the URL or null. */
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

function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Square photo area for product card. Uses next/image fill when fotoUrl exists. */
function CardPhoto({ item }: { item: Marketplace }) {
  if (item.fotoUrl) {
    return (
      <Image
        src={item.fotoUrl} alt={item.nama} fill unoptimized
        className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    );
  }
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-1 ${kategoriBg(item.kategori)}`}>
      <ShoppingBag className="h-7 w-7 text-muted-foreground" />
      <span className="text-4xl font-bold text-muted-foreground/70">{firstLetter(item.nama)}</span>
    </div>
  );
}

/** Image uploader: device upload + URL paste + clear, with live square preview. */
function ImageUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isMobile = useIsMobile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    const url = await uploadImage(f);
    setUploading(false);
    if (!url) return;
    onChange(url);
    toast.success("Gambar terunggah");
  }

  function applyUrl() {
    const u = urlInput.trim();
    if (!/^https?:\/\//.test(u)) return toast.error("URL harus diawali http:// atau https://");
    onChange(u);
    setUrlInput("");
    toast.success("Gambar diterapkan");
  }

  return (
    <div className="grid gap-2">
      <div className={`relative mx-auto aspect-square w-full overflow-hidden rounded-lg border bg-muted/30 ${isMobile ? "" : "max-w-[200px]"}`}>
        {value ? (
          <Image src={value} alt="Pratinjau" fill unoptimized className="object-cover" sizes="200px" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="px-2 text-center text-[11px]">Unggah atau tempel URL gambar</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button" variant="secondary" size="sm" className="flex-1"
          onClick={() => fileRef.current?.click()} disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload dari Perangkat
        </Button>
        {value && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange("")} disabled={uploading}>
            <X className="h-4 w-4" /> Hapus
          </Button>
        )}
      </div>
      <input
        ref={fileRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={onFile} aria-label="Unggah gambar dari perangkat"
      />
      <div className="flex gap-2">
        <Input
          type="url" inputMode="url" value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://... atau /uploads/..."
          className="flex-1" aria-label="URL gambar"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyUrl(); } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={applyUrl} disabled={uploading}>
          <Link2 className="h-4 w-4" /> Terapkan
        </Button>
      </div>
    </div>
  );
}

export function MarketplaceView() {
  const mounted = useMounted();
  const [kategori, setKategori] = useState("Semua");
  const [q, setQ] = useState("");
  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (kategori && kategori !== "Semua") p.set("kategori", kategori);
    if (q.trim()) p.set("q", q.trim());
    const s = p.toString();
    return "/api/marketplace" + (s ? "?" + s : "");
  }, [kategori, q]);
  const { data, loading, error, refetch } = useFetch<{ items: Marketplace[] }>(url);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Marketplace | null>(null);
  const [hapus, setHapus] = useState<Marketplace | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    nama: "", kategori: KATEGORI_MARKETPLACE[0], harga: "", kondisi: "baru" as Kondisi,
    penjual: "", telepon: "", deskripsi: "", fotoUrl: "",
  });

  const items = data?.items || [];
  const totalTersedia = items.filter((i) => i.status === "tersedia").length;
  const totalNilai = items.reduce((a, b) => a + (b.harga || 0), 0);
  const kategoriCount = new Set(items.map((i) => i.kategori)).size;

  function resetForm() {
    setForm({
      nama: "", kategori: KATEGORI_MARKETPLACE[0], harga: "", kondisi: "baru",
      penjual: "", telepon: "", deskripsi: "", fotoUrl: "",
    });
    setEditId(null);
  }

  function openCreate() { resetForm(); setCreateOpen(true); }

  function openEdit(it: Marketplace) {
    setForm({
      nama: it.nama, kategori: it.kategori,
      harga: it.harga ? toThousandInput(it.harga) : "",
      kondisi: it.kondisi, penjual: it.penjual, telepon: it.telepon,
      deskripsi: it.deskripsi, fotoUrl: it.fotoUrl || "",
    });
    setEditId(it.id);
    setDetail(null);
    setCreateOpen(true);
  }

  async function handleSubmit() {
    if (!form.nama.trim() || !form.harga || !form.penjual.trim() || !form.telepon.trim()) {
      return toast.error("Nama, harga, penjual, dan telepon wajib diisi");
    }
    setSaving(true);
    const payload = {
      nama: form.nama.trim(), kategori: form.kategori, harga: parseRupiahInput(form.harga),
      deskripsi: form.deskripsi.trim(), penjual: form.penjual.trim(), telepon: form.telepon.trim(),
      kondisi: form.kondisi, fotoUrl: form.fotoUrl.trim() || undefined,
    };
    // Edit = delete old + create new (no PATCH endpoint available)
    if (editId) await deleteJSON(`/api/marketplace/${editId}`);
    const r = await postJSON("/api/marketplace", payload);
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(editId ? "Barang diperbarui" : "Barang ditambahkan");
    setCreateOpen(false); resetForm(); refetch();
  }

  async function handleDelete() {
    if (!hapus) return;
    setDeleting(true);
    const r = await deleteJSON(`/api/marketplace/${hapus.id}`);
    setDeleting(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Barang dihapus");
    setHapus(null); setDetail(null); refetch();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Marketplace" description="Dagangan warga RT 002 Mawar"
        icon={<ShoppingBag className="h-5 w-5" />}
        actions={<Button onClick={openCreate} className="touch-target"><Plus className="h-4 w-4" /> Jual Barang</Button>}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Total Barang" value={items.length} icon={<Package className="h-5 w-5" />} tone="default" />
        <StatCard title="Tersedia" value={totalTersedia} icon={<ShoppingBag className="h-5 w-5" />} tone="income" />
        <StatCard title="Total Nilai" value={formatRupiah(totalNilai)} icon={<Eye className="h-5 w-5" />} tone="income" />
        <StatCard title="Kategori" value={kategoriCount} icon={<Package className="h-5 w-5" />} tone="neutral" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari barang / penjual..." className="pl-9" aria-label="Cari barang" />
        </div>
        <Select value={kategori} onValueChange={setKategori}>
          <SelectTrigger className="h-10 w-full sm:w-[200px]" aria-label="Filter kategori"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua">Semua Kategori</SelectItem>
            {KATEGORI_MARKETPLACE.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} className="h-60" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Belum ada dagangan"
          description="Jual barang pertamamu di marketplace warga RT 002."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Jual Barang</Button>}
        />
      ) : (
        <>
          <SectionTitle
            title="Daftar Barang"
            action={<span className="text-xs text-muted-foreground">{items.length} produk</span>}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => <ProductCard key={it.id} item={it} onDetail={() => setDetail(it)} />)}
          </div>
        </>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Barang" : "Jual Barang"}</DialogTitle>
            <DialogDescription>{editId ? "Perbarui detail dagangan." : "Tambahkan dagangan baru untuk dijual ke warga RT."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field id="m-foto" label="Foto Barang">
              <ImageUploader value={form.fotoUrl} onChange={(v) => setForm({ ...form, fotoUrl: v })} />
            </Field>
            <Field id="m-nama" label="Nama Barang">
              <Input id="m-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: Kue kering nastar" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="m-kategori" label="Kategori">
                <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                  <SelectTrigger id="m-kategori" className="w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {KATEGORI_MARKETPLACE.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="m-kondisi" label="Kondisi">
                <Select value={form.kondisi} onValueChange={(v) => setForm({ ...form, kondisi: v as Kondisi })}>
                  <SelectTrigger id="m-kondisi" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baru">Baru</SelectItem>
                    <SelectItem value="bekas">Bekas</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field id="m-harga" label="Harga (Rp)" hint={form.harga ? formatRupiah(parseRupiahInput(form.harga)) : undefined}>
              <Input
                id="m-harga" inputMode="numeric"
                value={form.harga ? toThousandInput(parseRupiahInput(form.harga)) : ""}
                onChange={(e) => setForm({ ...form, harga: e.target.value })}
                placeholder="0"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="m-penjual" label="Penjual">
                <Input id="m-penjual" value={form.penjual} onChange={(e) => setForm({ ...form, penjual: e.target.value })} placeholder="Nama lengkap" />
              </Field>
              <Field id="m-telepon" label="Telepon (WA)">
                <Input id="m-telepon" type="tel" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="628xxx" />
              </Field>
            </div>
            <Field id="m-deskripsi" label="Deskripsi">
              <Textarea id="m-deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={3} placeholder="Detail barang..." />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Jual"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">{detail?.nama}</DialogTitle>
            <DialogDescription>{detail?.kategori}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted/30">
                {detail.fotoUrl ? (
                  <Image src={detail.fotoUrl} alt={detail.nama} fill unoptimized className="object-cover" sizes="(max-width: 768px) 90vw, 400px" />
                ) : (
                  <div className={`flex h-full w-full flex-col items-center justify-center gap-2 ${kategoriBg(detail.kategori)}`}>
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    <span className="text-5xl font-bold text-muted-foreground/70">{firstLetter(detail.nama)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <Badge variant="outline" className={detail.kondisi === "baru" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}>
                  {detail.kondisi === "baru" ? "Baru" : "Bekas"}
                </Badge>
                <Badge variant="secondary">{detail.kategori}</Badge>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Harga</p>
                <p className="text-2xl font-bold text-success">{formatRupiah(detail.harga)}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(detail.penjual)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{detail.penjual}</p>
                  <p className="text-xs text-muted-foreground">{detail.telepon}</p>
                </div>
              </div>
              {detail.deskripsi && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{detail.deskripsi}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Diposting {mounted ? formatTanggalID(detail.createdAt) : "\u00A0"} • {mounted ? relativeTime(detail.createdAt) : "\u00A0"}
              </p>
            </div>
          )}
          <DialogFooter className="flex-row flex-wrap gap-2 sm:justify-end">
            <Button variant="destructive" onClick={() => setHapus(detail)} className="mr-auto"><Trash2 className="h-4 w-4" /> Hapus</Button>
            <Button variant="outline" onClick={() => detail && openEdit(detail)}><Edit className="h-4 w-4" /> Edit</Button>
            <Button onClick={() => detail && openWhatsApp(detail.telepon, buildWaMessage(detail))}><MessageCircle className="h-4 w-4" /> Hubungi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!hapus} onOpenChange={(o) => !o && setHapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dagangan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Dagangan &ldquo;{hapus?.nama}&rdquo; akan dihapus permanen.
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

function ProductCard({ item, onDetail }: { item: Marketplace; onDetail: () => void }) {
  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <button
        type="button" onClick={onDetail}
        className="relative aspect-square w-full overflow-hidden bg-muted/30"
        aria-label={`Lihat detail ${item.nama}`}
      >
        <CardPhoto item={item} />
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <button type="button" onClick={onDetail} className="line-clamp-2 text-left text-sm font-semibold leading-tight hover:text-primary">
          {item.nama}
        </button>
        <p className="text-sm font-bold text-success">{formatRupiah(item.harga)}</p>
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
            {initials(item.penjual)}
          </div>
          <span className="truncate text-xs text-muted-foreground">{item.penjual}</span>
        </div>
        <Badge variant="outline" className={`w-fit text-[10px] ${item.kondisi === "baru" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}>
          {item.kondisi === "baru" ? "Baru" : "Bekas"}
        </Badge>
        <Button
          size="sm" className="mt-1 w-full touch-target"
          onClick={(e) => { e.stopPropagation(); openWhatsApp(item.telepon, buildWaMessage(item)); }}
        >
          <MessageCircle className="h-4 w-4" /> Hubungi
        </Button>
      </div>
    </Card>
  );
}
