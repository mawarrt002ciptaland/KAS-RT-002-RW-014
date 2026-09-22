"use client";

import React, { useEffect, useState } from "react";
import { Plus, X, Upload, Trash2, Pencil } from "lucide-react";

export function PengurusManager() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ nama: "", jabatan: "Ketua RT", periode: "2026 - 2031", isCurrent: "true", noHp: "", noRumah: "", fotoUrl: "", catatan: "", urutan: "1" });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/pengurus", { cache: "no-store" });
      const j = await res.json();
      setList(Array.isArray(j.pengurus) ? j.pengurus : []);
    } catch { setList([]); }
  };

  useEffect(() => { fetchData(); }, []);

  const uploadFoto = async (file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Upload gagal");
      setForm((p) => ({ ...p, fotoUrl: j.url || j.fileUrl || "" }));
    } catch (e: any) { alert(e.message); } finally { setUploading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ nama: "", jabatan: "Ketua RT", periode: "2026 - 2031", isCurrent: "true", noHp: "", noRumah: "", fotoUrl: "", catatan: "", urutan: String(list.length + 1) });
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ nama: item.nama || "", jabatan: item.jabatan || "Ketua RT", periode: item.periode || "2026 - 2031", isCurrent: String(item.isCurrent || "true"), noHp: item.noHp || "", noRumah: item.noRumah || "", fotoUrl: item.fotoUrl || "", catatan: item.catatan || "", urutan: String(item.urutan ?? 1) });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form, urutan: Number(form.urutan || 1) };
    let res;
    if (editing) res = await fetch("/api/pengurus", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
    else res = await fetch("/api/pengurus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (!res.ok) { alert(j.error || "Gagal simpan"); return; }
    setOpen(false);
    fetchData();
  };

  const hapus = async (id: number) => {
    if (!confirm("Hapus pengurus ini?")) return;
    await fetch(`/api/pengurus?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black text-slate-800">Struktur Pengurus RT 002</h2>
          <p className="text-xs text-slate-400">Kelola pengurus aktif masa tugas 5 tahun + mantan ketua RT • dengan foto profile</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-2xl flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah Pengurus</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
              {p.fotoUrl ? <img src={p.fotoUrl} alt={p.nama} className="w-full h-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">{(p.nama || "?").slice(0, 1)}</div>}
            </div>
            <div className="p-3">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">{p.jabatan}</span>
              <p className="text-sm font-bold mt-1">{p.nama}</p>
              <p className="text-[11px] text-slate-500">Periode {p.periode} • {String(p.isCurrent) === "true" ? "Aktif" : "Mantan"}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => openEdit(p)} className="flex-1 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                <button onClick={() => hapus(p.id)} className="flex-1 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-bold flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <form onSubmit={submit} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="font-black">{editing ? "Edit Pengurus" : "Tambah Struktur Pengurus RT"}</h3><button type="button" onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <div><label className="text-xs font-bold">Nama *</label><input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">Jabatan</label><select value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs"><option>Ketua RT</option><option>Sekretaris</option><option>Bendahara</option><option>Koordinator Lapangan</option><option>Seksi Keamanan</option><option>Seksi Humas</option><option>Mantan Ketua RT</option></select></div>
              <div><label className="text-xs font-bold">Status</label><select value={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs"><option value="true">Pengurus Aktif (5 Tahun)</option><option value="false">Mantan / Sebelumnya</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">Periode</label><input value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} placeholder="2026 - 2031" className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
              <div><label className="text-xs font-bold">Urutan</label><input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">No HP</label><input value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
              <div><label className="text-xs font-bold">No Rumah</label><input value={form.noRumah} onChange={(e) => setForm({ ...form, noRumah: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            </div>
            <div className="p-3 bg-slate-50 border rounded-2xl">
              <label className="text-xs font-bold">Foto Profile</label>
              <div className="flex items-center gap-3 mt-2">
                {form.fotoUrl ? <img src={form.fotoUrl} className="w-14 h-14 rounded-full object-cover border" alt="foto" /> : <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black">?</div>}
                <label className="px-3 py-2 rounded-xl bg-white border text-xs font-bold cursor-pointer flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> {uploading ? "Upload..." : "Tambah / Ubah Foto"}<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFoto(f); }} /></label>
              </div>
            </div>
            <div><label className="text-xs font-bold">Catatan</label><input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            <div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold">Batal</button><button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">Simpan</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
