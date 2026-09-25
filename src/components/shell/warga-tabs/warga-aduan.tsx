"use client";

import { useState } from "react";
import { useFetch, postJSON } from "@/hooks/use-fetch";
import { formatTanggalID, relativeTime } from "@/lib/format";
import { EmptyState, CardSkeleton, StatusBadge, ErrorState } from "@/components/shared";
import { MessageSquareWarning, MapPin, Camera, Paperclip, Send } from "lucide-react";
import { KATEGORI_PENGADUAN } from "@/lib/constants";
import { toast } from "sonner";

interface Pengaduan { id: string; kode: string; judul: string; deskripsi: string; kategori: string; lokasi?: string | null; status: string; createdAt: string; tanggapan?: string | null }

export function WargaAduan({ data: existing, loading }: { data?: Pengaduan[]; loading: boolean }) {
  const [showForm, setShowForm] = useState(false);
  if (loading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}</div>;

  if (showForm) return <PengaduanForm onCancel={() => setShowForm(false)} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Aduan Saya</h2>
        <button onClick={() => setShowForm(true)} className="touch-target rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
          + Buat Aduan
        </button>
      </div>
      {!existing || existing.length === 0 ? (
        <EmptyState icon={<MessageSquareWarning className="h-6 w-6" />} title="Belum ada aduan" description="Sampaikan keluhan atau informasi ke pengurus RT." action={<button onClick={() => setShowForm(true)} className="touch-target rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Buat Aduan Pertama</button>} />
      ) : (
        <div className="space-y-2">
          {existing.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug">{p.judul}</p>
                  <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">{p.kode}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{p.deskripsi}</p>
              {p.lokasi && <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{p.lokasi}</p>}
              <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime(p.createdAt)}</p>
              {p.tanggapan && <div className="mt-2 rounded-lg bg-muted/40 p-2 text-xs"><p className="font-medium">Tanggapan pengurus:</p><p className="mt-0.5 text-muted-foreground">{p.tanggapan}</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PengaduanForm({ onCancel }: { onCancel: () => void }) {
  const [form, setForm] = useState({ judul: "", deskripsi: "", kategori: KATEGORI_PENGADUAN[0], lokasi: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.judul || !form.deskripsi) {
      toast.error("Judul dan deskripsi wajib diisi");
      return;
    }
    setSaving(true);
    const r = await postJSON("/api/pengaduan", { ...form, pelapor: "Warga RT 002" });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(`Aduan ${r.data.kode} berhasil dikirim`, { description: "Status: BARU" });
    onCancel();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Buat Aduan Baru</h2>
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Field label="Kategori">
          <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="touch-target w-full rounded-lg border bg-background px-3 text-sm">
            {KATEGORI_PENGADUAN.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Judul">
          <input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Judul singkat aduan" className="touch-target w-full rounded-lg border bg-background px-3 text-sm" />
        </Field>
        <Field label="Deskripsi">
          <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={4} placeholder="Jelaskan aduan secara detail" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </Field>
        <Field label="Lokasi (opsional)">
          <input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Lokasi kejadian" className="touch-target w-full rounded-lg border bg-background px-3 text-sm" />
        </Field>
        <div className="flex gap-2">
          <button onClick={() => toast.info("Fitur kamera/galeri akan tersedia")} className="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium"><Camera className="h-4 w-4" /> Foto</button>
          <button onClick={() => toast.info("Fitur lampiran akan tersedia")} className="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium"><Paperclip className="h-4 w-4" /> Lampiran</button>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="touch-target flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium">Batal</button>
          <button onClick={submit} disabled={saving} className="touch-target flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {saving ? "Mengirim..." : <><Send className="h-4 w-4" /> Kirim Aduan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
