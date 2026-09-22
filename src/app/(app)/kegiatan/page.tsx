"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  X,
  Search,
  Link2,
  ExternalLink,
  Copy,
  Check,
  Upload,
  MessageCircle,
  Trash2,
  Pencil,
} from "lucide-react";

const KATEGORI_LIST = ["Gotong Royong", "Keagamaan", "Perayaan & Perlombaan", "Rapat Warga", "Sosial", "Lingkungan", "Dokumentasi", "Agenda"];

function formatRp(n: any) {
  const v = Number(n || 0);
  return "Rp " + v.toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  if (!t) return "-";
  const d = new Date(t);
  if (isNaN(d.getTime())) return t;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function normalizeUrl(u: string) {
  if (!u) return "";
  const s = u.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return "https://" + s;
}

export default function KegiatanPage() {
  const { user } = useAuth();
  const isWarga = user?.role === "warga";
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState("Semua");
  const [selected, setSelected] = useState<any | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState<string>("");

  const [form, setForm] = useState({
    judul: "",
    kategori: "Gotong Royong",
    tanggal: "",
    waktu: "07.00 - 10.00 WIB",
    lokasi: "Blok Mawar",
    peserta: "Warga RT 002 RW 014",
    penanggungJawab: "",
    pjFoto: "",
    pjNoHp: "",
    deskripsi: "",
    daftarKebutuhan: "",
    anggaran: "",
    realisasi: "",
    dokumentasi: "",
    pengumuman: "",
    linkUrl: "",
    linkLabel: "",
    status: "Akan Datang",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kegiatan", { cache: "no-store" });
      const j = await res.json();
      setList(Array.isArray(j.kegiatan) ? j.kegiatan : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return list.filter((k) => {
      const okKat = filterKat === "Semua" || k.kategori === filterKat;
      const q = search.toLowerCase();
      const okQ = !q || (k.judul || "").toLowerCase().includes(q) || (k.lokasi || "").toLowerCase().includes(q) || (k.penanggungJawab || "").toLowerCase().includes(q);
      return okKat && okQ;
    });
  }, [list, search, filterKat]);

  const upcoming = filtered.filter((k) => k.status !== "Selesai");

  const openAdd = () => {
    setEditing(null);
    setForm({
      judul: "",
      kategori: "Gotong Royong",
      tanggal: "",
      waktu: "07.00 - 10.00 WIB",
      lokasi: "Blok Mawar",
      peserta: "Warga RT 002 RW 014",
      penanggungJawab: "",
      pjFoto: "",
      pjNoHp: "",
      deskripsi: "",
      daftarKebutuhan: "",
      anggaran: "",
      realisasi: "",
      dokumentasi: "",
      pengumuman: "",
      linkUrl: "",
      linkLabel: "",
      status: "Akan Datang",
    });
    setOpenForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      judul: item.judul || "",
      kategori: item.kategori || "Gotong Royong",
      tanggal: (item.tanggal || "").slice(0, 10),
      waktu: item.waktu || "",
      lokasi: item.lokasi || "",
      peserta: item.peserta || "",
      penanggungJawab: item.penanggungJawab || "",
      pjFoto: item.pjFoto || "",
      pjNoHp: item.pjNoHp || "",
      deskripsi: item.deskripsi || "",
      daftarKebutuhan: item.daftarKebutuhan || "",
      anggaran: String(item.anggaran ?? ""),
      realisasi: String(item.realisasi ?? ""),
      dokumentasi: item.dokumentasi || "",
      pengumuman: item.pengumuman || "",
      linkUrl: item.linkUrl || "",
      linkLabel: item.linkLabel || "",
      status: item.status || "Akan Datang",
    });
    setOpenForm(true);
  };

  const uploadImage = async (file: File, target: "pjFoto" | "dokumentasi") => {
    try {
      setUploading(target);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Upload gagal");
      const url = j.url || j.fileUrl || "";
      setForm((p) => ({ ...p, [target]: target === "dokumentasi" && p.dokumentasi ? p.dokumentasi + "," + url : url }));
    } catch (e: any) {
      alert(e.message || "Upload gagal");
    } finally {
      setUploading("");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...form,
        anggaran: Number(form.anggaran || 0),
        realisasi: Number(form.realisasi || 0),
      };
      let res;
      if (editing) {
        res = await fetch("/api/kegiatan", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
      } else {
        res = await fetch("/api/kegiatan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Gagal simpan");
      setOpenForm(false);
      setSelected(j.kegiatan || null);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const hapus = async (id: number) => {
    if (!confirm("Hapus kegiatan ini?")) return;
    await fetch(`/api/kegiatan?id=${id}`, { method: "DELETE" });
    setSelected(null);
    fetchData();
  };

  const waLink = (item: any) => {
    const phone = (item.pjNoHp || "").replace(/[^0-9]/g, "");
    const intl = phone.startsWith("0") ? "62" + phone.slice(1) : phone;
    const text = encodeURIComponent(`Halo ${item.penanggungJawab}, saya ingin bertanya tentang kegiatan "${item.judul}" tanggal ${formatTanggal(item.tanggal)}.`);
    if (!intl) return `https://wa.me/?text=${text}`;
    return `https://wa.me/${intl}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest">SISTEM INFORMASI RT 002 • BLOK MAWAR · CIPTALAND</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kegiatan Warga</h1>
          <p className="text-xs text-slate-500 mt-0.5">Agenda • Gotong Royong • Keagamaan • Perayaan & Perlombaan • Rapat • Sosial • Lingkungan • Dokumentasi</p>
        </div>
        {!isWarga && (
          <button onClick={openAdd} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md">
            <Plus className="w-4 h-4" /> Tambah Kegiatan
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kegiatan, lokasi, penanggung jawab..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
        </div>
        <select value={filterKat} onChange={(e) => setFilterKat(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
          <option value="Semua">Semua Kategori</option>
          {KATEGORI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-sm font-black text-slate-800 mb-4">Kegiatan Mendatang</h2>
        {loading ? <p className="text-xs text-slate-400">Memuat...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="pb-3">Kegiatan</th><th className="pb-3">Tanggal</th><th className="pb-3">Lokasi</th><th className="pb-3">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(k)}>
                    <td className="py-3"><p className="font-bold text-slate-800">{k.judul}</p><p className="text-[10px] text-indigo-600 font-bold uppercase">{k.kategori}</p></td>
                    <td className="py-3">{formatTanggal(k.tanggal)}</td>
                    <td className="py-3">{k.lokasi}</td>
                    <td className="py-3"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border">{k.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((k) => (
          <div key={k.id} onClick={() => setSelected(k)} className="cursor-pointer bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700">{k.kategori}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${k.status === "Selesai" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{k.status}</span>
              </div>
              <h3 className="font-black text-slate-800 text-sm leading-snug">{k.judul}</h3>
              <p className="text-[11px] text-slate-500 mt-1">{formatTanggal(k.tanggal)} • {k.lokasi}</p>
              {k.linkUrl && <p className="text-[11px] text-indigo-600 font-semibold mt-2 truncate flex items-center gap-1"><Link2 className="w-3 h-3" />{k.linkLabel || k.linkUrl}</p>}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
            <div className="p-6 pb-0 flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700">{selected.kategori}</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 leading-snug">{selected.judul}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${selected.status === "Selesai" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{selected.status}</span>
                <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs">
                <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-indigo-600" /><span className="font-semibold">{formatTanggal(selected.tanggal)}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /><span className="font-semibold">{selected.waktu}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500" /><span className="font-semibold">{selected.lokasi}</span></div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600" /><span className="font-semibold">{selected.peserta}</span></div>
              </div>

              <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  {selected.pjFoto ? <img src={selected.pjFoto} alt="PJ" className="w-11 h-11 rounded-full object-cover border" /> : <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">{(selected.penanggungJawab || "?").slice(0, 1)}</div>}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penanggung Jawab</p>
                    <p className="text-xs font-black text-slate-800">{selected.penanggungJawab}</p>
                    {selected.pjNoHp && <p className="text-[11px] text-slate-500">{selected.pjNoHp}</p>}
                  </div>
                </div>
                <a href={waLink(selected)} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 border border-emerald-100"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
              </div>

              {selected.deskripsi && <div className="text-xs text-slate-600 leading-relaxed"><span className="font-bold text-slate-800">Deskripsi: </span>{selected.deskripsi}</div>}
              {selected.daftarKebutuhan && <div className="text-xs bg-amber-50 border border-amber-100 rounded-2xl p-3"><span className="font-bold">📋 Daftar Kebutuhan: </span>{selected.daftarKebutuhan}</div>}

              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Koneksi Anggaran Kas RT</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-xl p-2"><p className="text-[10px] text-slate-400">Anggaran</p><p className="text-xs font-black">{formatRp(selected.anggaran)}</p></div>
                  <div className="bg-white rounded-xl p-2"><p className="text-[10px] text-rose-500">Pengeluaran</p><p className="text-xs font-black text-rose-600">{formatRp(selected.realisasi)}</p></div>
                  <div className="bg-white rounded-xl p-2"><p className="text-[10px] text-emerald-600">Sisa</p><p className="text-xs font-black text-emerald-600">{formatRp(Number(selected.anggaran || 0) - Number(selected.realisasi || 0))}</p></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Tautan & Media Sosial</p>
                </div>
                {selected.linkUrl ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 font-semibold truncate">{selected.linkLabel || "Tautan kegiatan"}</p>
                    <p className="text-[11px] text-slate-400 truncate">{normalizeUrl(selected.linkUrl)}</p>
                    <div className="flex gap-2">
                      <a href={normalizeUrl(selected.linkUrl)} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> Buka Tautan</a>
                      <button onClick={() => { navigator.clipboard.writeText(normalizeUrl(selected.linkUrl)); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1">{copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Disalin" : "Salin"}</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">Belum ada tautan / media sosial untuk kegiatan ini.</p>
                )}
              </div>

              {selected.dokumentasi && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Dokumentasi</p>
                  <div className="grid grid-cols-2 gap-2">
                    {String(selected.dokumentasi).split(",").map((u: string, i: number) => u.trim() && <img key={i} src={u.trim()} alt="dok" className="w-full h-28 object-cover rounded-xl border" />)}
                  </div>
                </div>
              )}

              {!isWarga && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setSelected(null); openEdit(selected); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => hapus(selected.id)} className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <form onSubmit={submit} className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-3 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="text-base font-black">{editing ? "Edit Kegiatan" : "Tambah Kegiatan"}</h3><button type="button" onClick={() => setOpenForm(false)} className="p-2 rounded-full hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <div><label className="text-xs font-bold">Judul *</label><input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">Kategori</label><select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs">{KATEGORI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
              <div><label className="text-xs font-bold">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs"><option>Akan Datang</option><option>Terjadwal</option><option>Berlangsung</option><option>Selesai</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">Tanggal *</label><input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" required /></div>
              <div><label className="text-xs font-bold">Waktu</label><input value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">Lokasi</label><input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
              <div><label className="text-xs font-bold">Peserta</label><input value={form.peserta} onChange={(e) => setForm({ ...form, peserta: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">Penanggung Jawab *</label><input value={form.penanggungJawab} onChange={(e) => setForm({ ...form, penanggungJawab: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" required /></div>
              <div><label className="text-xs font-bold">No HP PJ</label><input value={form.pjNoHp} onChange={(e) => setForm({ ...form, pjNoHp: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            </div>
            <div className="p-3 bg-slate-50 border rounded-2xl">
              <label className="text-xs font-bold">Foto Profile Penanggung Jawab</label>
              <div className="flex items-center gap-3 mt-2">
                {form.pjFoto ? <img src={form.pjFoto} className="w-12 h-12 rounded-full object-cover border" alt="pj" /> : <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black">?</div>}
                <label className="px-3 py-2 rounded-xl bg-white border text-xs font-bold cursor-pointer flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> {uploading === "pjFoto" ? "Upload..." : "Tambah / Ubah Foto"}<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "pjFoto"); }} /></label>
              </div>
            </div>
            <div><label className="text-xs font-bold">Deskripsi</label><textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            <div><label className="text-xs font-bold">Daftar Kebutuhan</label><textarea value={form.daftarKebutuhan} onChange={(e) => setForm({ ...form, daftarKebutuhan: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">Anggaran (Rp)</label><input type="number" value={form.anggaran} onChange={(e) => setForm({ ...form, anggaran: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
              <div><label className="text-xs font-bold">Realisasi (Rp)</label><input type="number" value={form.realisasi} onChange={(e) => setForm({ ...form, realisasi: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            </div>
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
              <label className="text-xs font-black uppercase tracking-wider text-indigo-700">Link URL / Media Sosial</label>
              <input value={form.linkLabel} onChange={(e) => setForm({ ...form, linkLabel: e.target.value })} placeholder="Judul tautan, mis. Instagram RT / Grup WA / YouTube" className="w-full mt-2 px-3 py-2 bg-white border rounded-xl text-xs" />
              <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." className="w-full mt-2 px-3 py-2 bg-white border rounded-xl text-xs" />
              <p className="text-[10px] text-slate-500 mt-1">Bisa link Instagram, TikTok, YouTube, Facebook, WhatsApp, Google Form, dsb.</p>
            </div>
            <div className="p-3 bg-slate-50 border rounded-2xl">
              <label className="text-xs font-bold">Dokumentasi (URL gambar, pisahkan koma)</label>
              <input value={form.dokumentasi} onChange={(e) => setForm({ ...form, dokumentasi: e.target.value })} placeholder="https://..." className="w-full mt-2 px-3 py-2 bg-white border rounded-xl text-xs" />
              <label className="mt-2 inline-flex px-3 py-2 rounded-xl bg-white border text-xs font-bold cursor-pointer items-center gap-1"><Upload className="w-3.5 h-3.5" /> Upload dokumentasi<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "dokumentasi"); }} /></label>
            </div>
            <div><label className="text-xs font-bold">Pengumuman</label><textarea value={form.pengumuman} onChange={(e) => setForm({ ...form, pengumuman: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            <div className="flex gap-2 pt-2"><button type="button" onClick={() => setOpenForm(false)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold">Batal</button><button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">Simpan</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
