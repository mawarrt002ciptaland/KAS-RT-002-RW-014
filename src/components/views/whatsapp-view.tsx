"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import {
  PageHeader, SectionTitle, EmptyState, ErrorState, CardSkeleton, Card, openWhatsApp,
} from "@/components/shared";
import { RT_INFO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, MessageCircle, Users, Check, Copy, Phone } from "lucide-react";

interface Warga {
  id: string;
  nama: string;
  noRumah: string;
  telepon?: string | null;
  role: "admin" | "pengurus" | "warga";
  jabatan?: string | null;
}

type Filter = "semua" | "pengurus" | "warga";

const TEMPLATES: Record<string, string> = {
  rapat: `Yth. Bapak/Ibu Warga RT 002 Blok Mawar,

Menginformasikan akan diadakan Pertemuan/Rapat Warga pada:
Hari/Tanggal :
Waktu     :
Tempat    : Pos RT 002 Blok Mawar

Mohon kehadiran Bapak/Ibu sekalian untuk membahas keperluan RT.

Terima kasih,
Ketua RT 002 Blok Mawar`,
  iuran: `Yth. Bapak/Ibu Warga RT 002 Blok Mawar,

Kami sampaikan pengingat pembayaran iuran bulanan RT:
- Iuran Bulanan  : Rp 25.000
- Iuran Keamanan : Rp 30.000
- Iuran Kebersihan : Rp 20.000

Pembayaran dapat ditransfer ke rekening Bendahara atau via QRIS RT 002.

Terima kasih atas perhatiannya.
Bendahara RT 002`,
  undangan: `Yth. Bapak/Ibu Warga RT 002 Blok Mawar,

Dengan hormat, kami mengundang Bapak/Ibu untuk hadir pada kegiatan:
Nama Kegiatan :
Hari/Tanggal   :
Waktu          :
Tempat         :

Mohon konfirmasi kehadiran. Sampai jumpa!

Salam hormat,
Pengurus RT 002`,
  tagihan: `Yth. Bapak/Ibu Warga RT 002 Blok Mawar,

Kami sampaikan pemberitahuan tagihan iuran RT periode bulan berjalan.
Mohon untuk segera melakukan pembayaran sebelum tanggal jatuh tempo.

Rincian tagihan dapat dilihat di aplikasi Sistem Informasi RT 002.

Terima kasih,
Bendahara RT 002`,
};

/** Display mask: keep first 2 + last 2 digits, hide middle with *. */
function maskPhone(phone?: string | null): string {
  if (!phone) return "—";
  const s = String(phone).replace(/\D/g, "");
  if (s.length <= 4) return s;
  return s.slice(0, 2) + "*".repeat(Math.min(s.length - 4, 6)) + s.slice(-2);
}

/** Normalize to international format for wa.me (62xxx). */
function waNumber(phone?: string | null): string {
  if (!phone) return "";
  let s = String(phone).replace(/\D/g, "");
  if (s.startsWith("0")) s = "62" + s.slice(1);
  else if (!s.startsWith("62") && s.length > 5) s = "62" + s;
  return s;
}

const FILTER_CHIPS: { v: Filter; l: string }[] = [
  { v: "semua", l: "Semua" },
  { v: "pengurus", l: "Pengurus" },
  { v: "warga", l: "Warga Biasa" },
];

export function WhatsappView() {
  const { data, loading, error, refetch } = useFetch<{ items: Warga[] }>("/api/warga");
  const [filter, setFilter] = useState<Filter>("semua");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<Warga[]>([]);

  const warga = data?.items || [];
  const filtered = useMemo(() => {
    if (filter === "pengurus") return warga.filter((w) => w.role === "pengurus" || w.role === "admin");
    if (filter === "warga") return warga.filter((w) => w.role === "warga");
    return warga;
  }, [warga, filter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(filtered.map((w) => w.id)));
  }

  function clearAll() {
    setSelected(new Set());
    setSent([]);
  }

  function applyTemplate(key: string) {
    if (key === "kosong") {
      setMessage("");
      return;
    }
    if (key && TEMPLATES[key]) setMessage(TEMPLATES[key]);
  }

  async function copyMessage() {
    if (!message.trim()) return toast.error("Pesan masih kosong");
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Pesan disalin ke clipboard");
    } catch {
      toast.error("Gagal menyalin pesan");
    }
  }

  function prepareBroadcast() {
    const list = filtered.filter((w) => selected.has(w.id) && w.telepon);
    if (list.length === 0) return toast.error("Pilih minimal 1 penerima dengan nomor telepon");
    if (!message.trim()) return toast.error("Pesan masih kosong");
    setSent(list);
    // Browsers usually allow the first window.open; rest require user click.
    openWhatsApp(waNumber(list[0].telepon), message);
    toast.success(`${list.length} penerima siap dikirimi. Klik Buka untuk tiap penerima di bawah.`);
  }

  function openSingle(w: Warga) {
    if (!w.telepon) return toast.error("Nomor telepon tidak tersedia");
    openWhatsApp(waNumber(w.telepon), message);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="WhatsApp Broadcast"
        description="Kirim broadcast & hubungi warga via WhatsApp"
        icon={<Send className="h-5 w-5" />}
      />

      {/* WhatsApp Admin card */}
      <Card className="border-primary/30 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">WhatsApp Admin RT 002</p>
            <p className="truncate text-xs text-muted-foreground">
              +{RT_INFO.whatsappAdmin} · {RT_INFO.namaLengkap}
            </p>
          </div>
        </div>
        <Button
          className="mt-3 w-full touch-target"
          size="lg"
          onClick={() =>
            openWhatsApp(
              RT_INFO.whatsappAdmin,
              "Halo Admin RT 002, saya ingin menyampaikan aduan/informasi."
            )
          }
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp Admin RT
        </Button>
      </Card>

      {/* Compose card */}
      <Card className="p-4 sm:p-5">
        <SectionTitle
          title="Kirim Broadcast"
          action={<Badge variant="secondary">{selected.size} dipilih</Badge>}
        />

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter penerima">
          {FILTER_CHIPS.map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              aria-pressed={filter === f.v}
              className={`touch-target rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === f.v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {/* Select all / clear */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <Label className="text-sm font-medium">Pilih Penerima</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllVisible} disabled={loading || filtered.length === 0}>
              <Check className="h-3.5 w-3.5" /> Pilih Semua
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={selected.size === 0 && sent.length === 0}>
              Kosongkan
            </Button>
          </div>
        </div>

        {/* Recipients list */}
        <div className="mt-2 max-h-64 overflow-y-auto scrollbar-thin rounded-lg border">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <CardSkeleton key={i} className="h-14" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="Tidak ada warga"
              description="Coba ubah filter atau tambahkan data warga terlebih dahulu."
            />
          ) : (
            <ul className="divide-y">
              {filtered.map((w) => {
                const checked = selected.has(w.id);
                return (
                  <li key={w.id}>
                    <label className="flex cursor-pointer items-center gap-3 p-2.5 hover:bg-muted/60">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(w.id)}
                        aria-label={`Pilih ${w.nama}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{w.nama}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {w.noRumah} · {maskPhone(w.telepon)}
                          {w.jabatan ? ` · ${w.jabatan}` : ""}
                        </p>
                      </div>
                      {w.role !== "warga" && (
                        <Badge variant="secondary" className="hidden sm:inline-flex">
                          {w.role}
                        </Badge>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Template select */}
        <div className="mt-3 grid gap-1.5">
          <Label htmlFor="wa-template">Gunakan Template</Label>
          <Select onValueChange={applyTemplate}>
            <SelectTrigger id="wa-template" className="w-full">
              <SelectValue placeholder="— Pilih Template —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rapat">Pengumuman Rapat Warga</SelectItem>
              <SelectItem value="iuran">Pengingat Iuran Bulanan</SelectItem>
              <SelectItem value="undangan">Undangan Kegiatan</SelectItem>
              <SelectItem value="tagihan">Pemberitahuan Tagihan</SelectItem>
              <SelectItem value="kosong">— Kosongkan Pesan —</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Message */}
        <div className="mt-3 grid gap-1.5">
          <Label htmlFor="wa-pesan">Pesan</Label>
          <Textarea
            id="wa-pesan"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesan broadcast untuk warga..."
            className="resize-y"
          />
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" onClick={copyMessage} className="touch-target">
            <Copy className="h-4 w-4" /> Salin Pesan
          </Button>
          <Button
            className="touch-target"
            onClick={prepareBroadcast}
            disabled={loading || selected.size === 0}
          >
            <Send className="h-4 w-4" /> Kirim Broadcast ({selected.size})
          </Button>
        </div>

        {/* Broadcast results */}
        {sent.length > 0 && (
          <div className="mt-4 rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Daftar Kirim ({sent.length})</p>
              <Button variant="ghost" size="sm" onClick={() => setSent([])}>
                Tutup
              </Button>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              Browser memblok pembukaan banyak jendela otomatis. Klik <strong>Buka</strong> untuk tiap
              penerima secara berurutan.
            </p>
            <ul className="max-h-72 divide-y overflow-y-auto scrollbar-thin">
              {sent.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{w.nama}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {w.noRumah} · {maskPhone(w.telepon)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => openSingle(w)} disabled={!w.telepon} className="touch-target">
                    <Phone className="h-3.5 w-3.5" /> Buka
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
