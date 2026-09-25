"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useFetch, postJSON, deleteJSON } from "@/hooks/use-fetch";
import {
  PageHeader, StatusBadge, EmptyState, ErrorState, CardSkeleton, Card,
  openWhatsApp,
} from "@/components/shared";
import { formatRupiah, formatTanggalID, relativeTime, parseRupiahInput, toThousandInput } from "@/lib/format";
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
import { ShoppingBag, Plus, Search, MessageCircle, Trash2 } from "lucide-react";

type Kondisi = "baru" | "bekas";
interface Marketplace {
  id: string; nama: string; kategori: string; harga: number; deskripsi: string;
  fotoUrl?: string | null; penjual: string; telepon: string; kondisi: Kondisi;
  status: "tersedia" | "terjual"; createdAt: string;
}

const KATEGORI_COLORS: Record<string, string> = {
  Makanan: "bg-success/15 text-success",
  Jasa: "bg-info/15 text-info",
  Barang: "bg-primary/10 text-primary",
  Kuliner: "bg-warning/20 text-warning",
  Otomotif: "bg-destructive/10 text-destructive",
  Lainnya: "bg-muted text-muted-foreground",
};
const kategoriColor = (k: string) => KATEGORI_COLORS[k] || "bg-muted text-muted-foreground";
const buildWaMessage = (item: Marketplace) =>
  "Halo " + item.penjual + ", saya tertarik dengan " + item.nama;

function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PhotoBox({ item, className }: { item: { fotoUrl?: string | null; nama: string; kategori: string }; className?: string }) {
  if (item.fotoUrl) {
    return <img src={item.fotoUrl} alt={item.nama} className={className || "h-full w-full object-cover"} />;
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <ShoppingBag className="h-10 w-10" />
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${kategoriColor(item.kategori)}`}>{item.kategori}</span>
    </div>
  );
}

export function MarketplaceView() {
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
  const [detail, setDetail] = useState<Marketplace | null>(null);
  const [hapus, setHapus] = useState<Marketplace | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    nama: "", kategori: KATEGORI_MARKETPLACE[0], harga: "", kondisi: "baru" as Kondisi,
    penjual: "", telepon: "", deskripsi: "", fotoUrl: "",
  });
  const items = data?.items || [];

  function resetForm() {
    setForm({
      nama: "", kategori: KATEGORI_MARKETPLACE[0], harga: "", kondisi: "baru",
      penjual: "", telepon: "", deskripsi: "", fotoUrl: "",
    });
  }

  async function handleSubmit() {
    if (!form.nama.trim() || !form.harga || !form.penjual.trim() || !form.telepon.trim()) {
      return toast.error("Nama, harga, penjual, dan telepon wajib diisi");
    }
    setSaving(true);
    const r = await postJSON("/api/marketplace", {
      nama: form.nama.trim(), kategori: form.kategori, harga: parseRupiahInput(form.harga),
      deskripsi: form.deskripsi.trim(), penjual: form.penjual.trim(), telepon: form.telepon.trim(),
      kondisi: form.kondisi, fotoUrl: form.fotoUrl.trim() || undefined,
    });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Barang berhasil ditayangkan");
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
        actions={<Button onClick={() => setCreateOpen(true)} className="touch-target"><Plus className="h-4 w-4" /> Jual Barang</Button>}
      />

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
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} className="h-56" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Belum ada dagangan"
          description="Jual barang pertamamu di marketplace warga RT 002."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Jual Barang</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => <ProductCard key={it.id} item={it} onDetail={() => setDetail(it)} />)}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Jual Barang</DialogTitle>
            <DialogDescription>Tambahkan dagangan baru untuk dijual ke warga RT.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
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
            <Field id="m-harga" label="Harga (Rp)" hint={formatRupiah(parseRupiahInput(form.harga))}>
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
            <Field id="m-foto" label="URL Foto (opsional)">
              <Input id="m-foto" type="url" value={form.fotoUrl} onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Menyimpan..." : "Jual"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">{detail?.nama}</DialogTitle>
            <DialogDescription>{detail?.kategori}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-3">
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted/30">
                <PhotoBox item={detail} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <Badge variant="secondary" className={kategoriColor(detail.kategori)}>{detail.kategori}</Badge>
                <Badge variant="outline">{detail.kondisi === "baru" ? "Baru" : "Bekas"}</Badge>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Harga</p>
                <p className="text-xl font-bold text-primary">{formatRupiah(detail.harga)}</p>
              </div>
              <div className="grid gap-1.5 text-sm">
                <div className="flex items-start gap-2">
                  <MessageCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium">{detail.penjual}</p>
                    <p className="text-muted-foreground">{detail.telepon}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Diposting {formatTanggalID(detail.createdAt)} • {relativeTime(detail.createdAt)}</p>
              </div>
              {detail.deskripsi && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{detail.deskripsi}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => setHapus(detail)} className="mr-auto"><Trash2 className="h-4 w-4" /> Hapus</Button>
            <Button onClick={() => detail && openWhatsApp(detail.telepon, buildWaMessage(detail))}><MessageCircle className="h-4 w-4" /> Hubungi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      <button onClick={onDetail} className="relative aspect-square w-full overflow-hidden bg-muted/30" aria-label={`Lihat detail ${item.nama}`}>
        <PhotoBox item={item} />
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <button onClick={onDetail} className="line-clamp-2 text-left text-sm font-semibold leading-tight hover:text-primary">
          {item.nama}
        </button>
        <p className="text-sm font-bold text-primary">{formatRupiah(item.harga)}</p>
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs text-muted-foreground">{item.penjual}</span>
          <Badge variant="outline" className="text-[10px]">{item.kondisi === "baru" ? "Baru" : "Bekas"}</Badge>
        </div>
        <Button size="sm" className="mt-1 w-full touch-target" onClick={() => openWhatsApp(item.telepon, buildWaMessage(item))}>
          <MessageCircle className="h-4 w-4" /> Hubungi
        </Button>
      </div>
    </Card>
  );
}
