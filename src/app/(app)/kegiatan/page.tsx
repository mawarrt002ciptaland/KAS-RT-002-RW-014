"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Plus,
  Search,
  Upload,
  Image as ImageIcon,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Sparkles,
  Camera,
  X,
  Edit,
  Trash2,
  Video,
  Film,
  Play,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { resolveMediaUrl } from "@/lib/media";
import { compressImage } from "@/lib/image-compress";

export default function KegiatanPage() {
  const { user } = useAuth();
  const isWarga = user?.role === "warga";

  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFotoPj, setUploadingFotoPj] = useState(false);
  const [uploadingDokumentasi, setUploadingDokumentasi] = useState(false);
  const [selectedKegiatan, setSelectedKegiatan] = useState<any>(null);

  // Modal Khusus Input Dokumentasi (Gambar / Video) - Hanya Admin
  const [openDokModal, setOpenDokModal] = useState(false);
  const [dokKegiatan, setDokKegiatan] = useState<any>(null);
  const [dokType, setDokType] = useState<"image" | "video">("image");
  const [dokUrlInput, setDokUrlInput] = useState("");
  const [savingDok, setSavingDok] = useState(false);

  const [form, setForm] = useState({
    id: null as number | null,
    judul: "",
    kategori: "Gotong Royong",
    tanggal: "",
    waktu: "07.00 - 10.00 WIB",
    lokasi: "Lingkungan Blok Mawar",
    peserta: "Warga RT 002 RW 014",
    penanggungJawab: "",
    kontakPj: "",
    fotoPj: "",
    deskripsi: "",
    daftarKebutuhan: "",
    anggaran: "500000",
    pengeluaran: "0",
    dokumentasiUrl: "",
    linkUrl: "",
    socialLink: "",
    pengumuman: "",
    status: "Akan Datang",
  });

  const fetchKegiatan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kegiatan", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.kegiatan)) {
        setKegiatanList(data.kegiatan);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const handleUploadImage = async (file: File, targetKey: "fotoPj" | "dokumentasiUrl", setUploading: (v: boolean) => void) => {
    try {
      setUploading(true);
      // Automatically compress image before sending (max 600px, 75% quality, converts heavy camera RAW/PNG/AVIF to light ~70KB JPEG)
      const compressed = await compressImage(file, 600, 0.75);

      const body = new FormData();
      body.append("file", compressed);
      body.append("folder", targetKey === "fotoPj" ? "profile-pj" : "dokumentasi-kegiatan");

      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("Gagal mengupload gambar (ukuran file terlalu besar untuk diproses server). Harap gunakan foto dengan ukuran lebih kecil.");
      }

      if (!res.ok) throw new Error(data?.error || "Gagal upload gambar");

      setForm((prev) => ({ ...prev, [targetKey]: data.url }));
    } catch (err: any) {
      alert(err.message || "Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEdit = (item: any) => {
    setForm({
      id: item.id,
      judul: item.judul,
      kategori: item.kategori,
      tanggal: item.tanggal,
      waktu: item.waktu || "07.00 - 10.00 WIB",
      lokasi: item.lokasi,
      peserta: item.peserta || "Warga RT 002",
      penanggungJawab: item.penanggungJawab,
      kontakPj: item.kontakPj || "",
      fotoPj: item.fotoPj || "",
      deskripsi: item.deskripsi || "",
      daftarKebutuhan: item.daftarKebutuhan || "",
      anggaran: String(item.anggaran || 0),
      pengeluaran: String(item.pengeluaran || 0),
      dokumentasiUrl: item.dokumentasiUrl || "",
      linkUrl: item.linkUrl || "",
      socialLink: item.socialLink || "",
      pengumuman: item.pengumuman || "",
      status: item.status || "Akan Datang",
    });
    setOpenModal(true);
  };

  const handleDelete = async (id: number) => {
    if (isWarga) return;
    if (!confirm("Hapus kegiatan ini?")) return;
    try {
      await fetch(`/api/kegiatan?id=${id}`, { method: "DELETE" });
      fetchKegiatan();
    } catch {
      alert("Gagal menghapus kegiatan");
    }
  };

  const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.includes("youtube.com") ||
      lower.includes("youtu.be") ||
      lower.includes("vimeo.com") ||
      lower.includes(".mp4") ||
      lower.includes(".webm") ||
      lower.includes(".mov") ||
      lower.startsWith("data:video")
    );
  };

  const getYoutubeEmbed = (url: string) => {
    try {
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes("watch?v=")) {
        const id = url.split("watch?v=")[1]?.split("&")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes("youtube.com/embed/")) {
        return url;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleOpenDokModal = (item: any) => {
    if (isWarga) return;
    setDokKegiatan(item);
    setDokUrlInput(item.dokumentasiUrl || "");
    setDokType(isVideoUrl(item.dokumentasiUrl) ? "video" : "image");
    setOpenDokModal(true);
  };

  const handleSaveDokumentasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWarga || !dokKegiatan) return;

    setSavingDok(true);
    try {
      const res = await fetch("/api/kegiatan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: dokKegiatan.id,
          dokumentasiUrl: dokUrlInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan dokumentasi");

      setOpenDokModal(false);
      setDokKegiatan(null);
      setDokUrlInput("");
      fetchKegiatan();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan dokumentasi");
    } finally {
      setSavingDok(false);
    }
  };

  const handleUploadDokFile = async (file: File) => {
    if (isWarga) return;
    try {
      setUploadingDokumentasi(true);
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, 900, 0.75);
        const body = new FormData();
        body.append("file", compressed);
        body.append("folder", "dokumentasi-kegiatan");

        const res = await fetch("/api/upload", {
          method: "POST",
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal upload gambar dokumentasi");

        setDokUrlInput(data.url);
      } else {
        alert("Untuk video dokumentasi, gunakan link URL (YouTube, Google Drive, MP4) agar tidak melebihi batas upload server.");
      }
    } catch (err: any) {
      alert(err.message || "Gagal upload file");
    } finally {
      setUploadingDokumentasi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul || !form.tanggal || !form.lokasi || !form.penanggungJawab) {
      alert("Harap lengkapi judul, tanggal, lokasi, dan penanggung jawab.");
      return;
    }

    setSubmitting(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/kegiatan", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kegiatan");

      setOpenModal(false);
      setForm({
        id: null,
        judul: "",
        kategori: "Gotong Royong",
        tanggal: "",
        waktu: "07.00 - 10.00 WIB",
        lokasi: "Lingkungan Blok Mawar",
        peserta: "Warga RT 002 RW 014",
        penanggungJawab: "",
        kontakPj: "",
        fotoPj: "",
        deskripsi: "",
        daftarKebutuhan: "",
        anggaran: "500000",
        pengeluaran: "0",
        dokumentasiUrl: "",
        linkUrl: "",
        socialLink: "",
        pengumuman: "",
        status: "Akan Datang",
      });
      fetchKegiatan();
    } catch (e: any) {
      alert(e.message || "Gagal memproses kegiatan");
    } finally {
      setSubmitting(false);
    }
  };

  const kategoriList = [
    { label: "Semua", icon: Sparkles },
    { label: "Gotong Royong", icon: Users },
    { label: "Keagamaan", icon: Sparkles },
    { label: "Perayaan & Perlombaan", icon: Calendar },
    { label: "Rapat Warga", icon: FileText },
    { label: "Sosial", icon: Users },
    { label: "Lingkungan", icon: MapPin },
  ];

  const filtered = kegiatanList.filter((k) => {
    const matchCat = filterKategori === "Semua" || k.kategori === filterKategori;
    const matchStatus = filterStatus === "Semua" || k.status === filterStatus;
    const matchSearch =
      !search ||
      k.judul.toLowerCase().includes(search.toLowerCase()) ||
      k.lokasi.toLowerCase().includes(search.toLowerCase()) ||
      k.penanggungJawab.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
            Kehidupan Warga · Pusat Kegiatan RT 002
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Kegiatan Warga
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Agenda kerja bakti, rapat warga, perayaan HUT RI, pengajian, posyandu, dan dokumentasi kebersamaan
          </p>
        </div>

        {!isWarga && (
          <button
            onClick={() => {
              setForm({
                id: null,
                judul: "",
                kategori: "Gotong Royong",
                tanggal: "",
                waktu: "07.00 - 10.00 WIB",
                lokasi: "Lingkungan Blok Mawar",
                peserta: "Warga RT 002 RW 014",
                penanggungJawab: "",
                kontakPj: "",
                fotoPj: "",
                deskripsi: "",
                daftarKebutuhan: "",
                anggaran: "500000",
                pengeluaran: "0",
                dokumentasiUrl: "",
                linkUrl: "",
                socialLink: "",
                pengumuman: "",
                status: "Akan Datang",
              });
              setOpenModal(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Kegiatan</span>
          </button>
        )}
      </div>

      {/* Kategori Quick Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {kategoriList.map((item) => {
          const isActive = filterKategori === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setFilterKategori(item.label)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kegiatan, lokasi, atau penanggung jawab..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="Semua">Semua Status</option>
            <option value="Akan Datang">Akan Datang</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Kegiatan Mendatang Overview Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Kegiatan Mendatang & Terjadwal</h2>
            <p className="text-xs text-slate-400">Daftar agenda kegiatan warga RT 002 RW 014</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {filtered.length} Agenda
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Kegiatan</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Tanggal & Waktu</th>
                <th className="pb-3">Lokasi</th>
                <th className="pb-3">Penanggung Jawab</th>
                <th className="pb-3">Status</th>
                {!isWarga && <th className="pb-3 text-right pr-2">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((item) => {
                const fotoPj = item.fotoPj ? resolveMediaUrl(item.fotoPj) : null;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pl-2 max-w-xs">
                      <p className="font-bold text-slate-800 leading-tight">{item.judul}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.deskripsi || "Kegiatan kebersamaan warga"}</p>
                    </td>

                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.kategori}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-600 whitespace-nowrap">
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.tanggal}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">{item.waktu}</p>
                    </td>

                    <td className="py-3.5 text-slate-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{item.lokasi}</span>
                      </div>
                    </td>

                    {/* Penanggung Jawab with Profile Photo */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="relative h-7 w-7 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                          {fotoPj ? (
                            <img src={fotoPj} alt={item.penanggungJawab} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-bold text-[10px] text-indigo-600 bg-indigo-50">
                              {item.penanggungJawab.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{item.penanggungJawab}</p>
                          {item.kontakPj && <p className="text-[10px] text-slate-400">{item.kontakPj}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.status === "Akan Datang"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : item.status === "Terjadwal"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {!isWarga && (
                      <td className="py-3.5 text-right pr-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Kegiatan"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Kegiatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Cards with Budget Connection (Anggaran -> Pengeluaran -> Sisa) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((k) => {
          const fotoPj = k.fotoPj ? resolveMediaUrl(k.fotoPj) : null;
          const dok = k.dokumentasiUrl ? resolveMediaUrl(k.dokumentasiUrl) : null;
          const sisa = Number(k.anggaran || 0) - Number(k.pengeluaran || 0);

          return (
            <div
              key={k.id}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 border border-indigo-100 mb-1.5">
                    {k.kategori}
                  </span>
                  <h3 className="text-base font-black text-slate-900">{k.judul}</h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    k.status === "Akan Datang"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : k.status === "Terjadwal"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {k.status}
                </span>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold">{k.tanggal}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{k.waktu}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{k.lokasi}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{k.peserta}</span>
                </div>
              </div>

              {/* Penanggung Jawab with Profile Photo */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-inner">
                    {fotoPj ? (
                      <img src={fotoPj} alt={k.penanggungJawab} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-black text-sm text-indigo-600 bg-indigo-50">
                        {k.penanggungJawab.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penanggung Jawab</span>
                    <p className="font-bold text-xs text-slate-900">{k.penanggungJawab}</p>
                    {k.kontakPj && <p className="text-[10px] text-slate-500">{k.kontakPj}</p>}
                  </div>
                </div>

                {k.kontakPj && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${k.kontakPj.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Deskripsi & Kebutuhan */}
              <div className="space-y-2 text-xs">
                {k.deskripsi && (
                  <p className="text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">Deskripsi: </span>
                    {k.deskripsi}
                  </p>
                )}
                {k.daftarKebutuhan && (
                  <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70 text-amber-900">
                    <span className="font-bold block mb-0.5">📋 Daftar Kebutuhan:</span>
                    <span>{k.daftarKebutuhan}</span>
                  </div>
                )}
              </div>

              {/* Modul Anggaran Kas RT Terhubung */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                  Koneksi Anggaran Kas RT
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-indigo-100">
                    <span className="text-[9px] text-slate-400 block font-semibold">Anggaran</span>
                    <span className="text-xs font-black text-slate-900">
                      Rp {Number(k.anggaran || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-rose-100">
                    <span className="text-[9px] text-rose-500 block font-semibold">Pengeluaran</span>
                    <span className="text-xs font-black text-rose-600">
                      Rp {Number(k.pengeluaran || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100">
                    <span className="text-[9px] text-emerald-600 block font-semibold">Sisa</span>
                    <span className="text-xs font-black text-emerald-600">
                      Rp {sisa.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* External Links / Social Media */}
              {(k.linkUrl || k.socialLink) && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Link Terkait</span>
                  <div className="flex flex-wrap gap-2">
                    {k.linkUrl && (
                      <a
                        href={k.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
                      >
                        <span>🔗 Link URL</span>
                      </a>
                    )}
                    {k.socialLink && (
                      <a
                        href={k.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2 text-xs font-bold text-pink-700 border border-pink-100 hover:bg-pink-100"
                      >
                        <span>📱 Link Media Sosial</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Dokumentasi Foto & Video */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dokumentasi Kegiatan</span>
                  </span>

                  {/* Tombol Input/Kelola Dokumentasi HANYA BISA DIAKSES OLEH ADMIN/PENGURUS (Tidak untuk akun Warga) */}
                  {!isWarga && (
                    <button
                      type="button"
                      onClick={() => handleOpenDokModal(k)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      <Film className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{k.dokumentasiUrl ? "Ubah Dokumentasi" : "+ Input Gambar / Video"}</span>
                    </button>
                  )}
                </div>

                {dok ? (
                  <div className="space-y-2">
                    {isVideoUrl(k.dokumentasiUrl) ? (
                      getYoutubeEmbed(k.dokumentasiUrl) ? (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                          <iframe
                            src={getYoutubeEmbed(k.dokumentasiUrl)!}
                            title={k.judul}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                          <video
                            src={dok}
                            controls
                            className="w-full max-h-60 rounded-2xl"
                            preload="metadata"
                          >
                            Browser Anda tidak mendukung tag video.
                          </video>
                        </div>
                      )
                    ) : (
                      <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
                        <img
                          src={dok}
                          alt="Dokumentasi kegiatan"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p className="text-xs text-slate-400">Belum ada foto atau video dokumentasi.</p>
                    {!isWarga && (
                      <button
                        type="button"
                        onClick={() => handleOpenDokModal(k)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload foto atau masukkan link video sekarang</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Kegiatan */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {form.id ? "Edit Kegiatan Warga" : "Tambah Kegiatan Warga"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi agenda, penanggung jawab, foto profile, dan koneksi anggaran kas
                </p>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama / Judul Kegiatan *</label>
                <input
                  type="text"
                  placeholder="Contoh: Gotong Royong Lingkungan Blok Mawar"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Gotong Royong">Gotong Royong</option>
                    <option value="Keagamaan">Keagamaan</option>
                    <option value="Perayaan & Perlombaan">Perayaan & Perlombaan</option>
                    <option value="Rapat Warga">Rapat Warga</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Lingkungan">Lingkungan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kegiatan</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Akan Datang">Akan Datang</option>
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="text"
                    placeholder="Contoh: 27 Sep 2026"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    placeholder="Contoh: 07.00 - 10.00 WIB"
                    value={form.waktu}
                    onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Kegiatan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Balai Warga / Fasum"
                    value={form.lokasi}
                    onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peserta</label>
                  <input
                    type="text"
                    placeholder="Contoh: Seluruh Warga RT 002"
                    value={form.peserta}
                    onChange={(e) => setForm({ ...form, peserta: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Penanggung Jawab & Foto Profile PJ (Screenshot_16) */}
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                <span className="font-black text-indigo-900 block">
                  👤 Penanggung Jawab & Foto Profile
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Penanggung Jawab *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pak Surya / Sie Pembangunan"
                      value={form.penanggungJawab}
                      onChange={(e) => setForm({ ...form, penanggungJawab: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kontak WhatsApp PJ</label>
                    <input
                      type="text"
                      placeholder="Contoh: 081288880076"
                      value={form.kontakPj}
                      onChange={(e) => setForm({ ...form, kontakPj: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                {/* Upload Foto Profile PJ */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden border border-slate-300 bg-white shrink-0 flex items-center justify-center">
                    {form.fotoPj ? (
                      <img src={resolveMediaUrl(form.fotoPj)} alt="Foto PJ" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50">
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{uploadingFotoPj ? "Uploading..." : "Pilih / Rubah Foto Profile PJ"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(file, "fotoPj", setUploadingFotoPj);
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">Format foto JPG/PNG untuk penanggung jawab kegiatan.</p>
                  </div>
                </div>
              </div>

              {/* Anggaran dan Biaya */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Anggaran Kas RT (Rp)</label>
                  <input
                    type="number"
                    value={form.anggaran}
                    onChange={(e) => setForm({ ...form, anggaran: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Realisasi Pengeluaran (Rp)</label>
                  <input
                    type="number"
                    value={form.pengeluaran}
                    onChange={(e) => setForm({ ...form, pengeluaran: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Daftar Kebutuhan</label>
                <input
                  type="text"
                  placeholder="Contoh: Sapu lidi, karung sampah, kopi & gorengan..."
                  value={form.daftarKebutuhan}
                  onChange={(e) => setForm({ ...form, daftarKebutuhan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link URL Terkait</label>
                  <input
                    type="url"
                    placeholder="https://contoh-link-kegiatan.com"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link Media Sosial</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/... atau https://facebook.com/..."
                    value={form.socialLink}
                    onChange={(e) => setForm({ ...form, socialLink: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi & Pengumuman</label>
                <textarea
                  rows={3}
                  placeholder="Detail rencana kegiatan warga dan arahan untuk kehadiran..."
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                >
                  <span>{submitting ? "Menyimpan..." : "Simpan Kegiatan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Khusus Input Dokumentasi (Gambar / Video) - HANYA ADMIN / PENGURUS (Tidak untuk akun Warga) */}
      {!isWarga && openDokModal && dokKegiatan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 border border-indigo-100 mb-1">
                  Khusus Admin / Pengurus
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Input Dokumentasi Kegiatan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                  {dokKegiatan.judul}
                </p>
              </div>
              <button
                onClick={() => {
                  setOpenDokModal(false);
                  setDokKegiatan(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDokumentasi} className="space-y-4 text-xs">
              {/* Pilihan Tipe Media: Gambar atau Video */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Pilih Tipe Media Dokumentasi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDokType("image")}
                    className={`flex items-center justify-center gap-2 rounded-2xl p-3 font-bold border transition-all ${
                      dokType === "image"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Foto / Gambar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDokType("video")}
                    className={`flex items-center justify-center gap-2 rounded-2xl p-3 font-bold border transition-all ${
                      dokType === "video"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Dokumentasi</span>
                  </button>
                </div>
              </div>

              {dokType === "image" ? (
                <div className="space-y-3">
                  {/* Upload File Foto dengan auto-compress */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <span className="font-bold text-slate-800 block">1. Upload File Gambar Langsung</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 shadow-sm">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>{uploadingDokumentasi ? "Mengompres & Upload..." : "Pilih File Foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDokFile(file);
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Foto otomatis dikompres ke resolusi optimal (~70 KB) sehingga aman dan cepat disimpan.
                    </p>
                  </div>

                  {/* Atau Input Link URL Foto */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      2. Atau Tempel Link URL Gambar
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... atau https://..."
                      value={dokUrlInput}
                      onChange={(e) => setDokUrlInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Link URL Video (YouTube / MP4 / Google Drive / Vimeo)
                    </label>
                    <input
                      type="url"
                      placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://domain.com/video.mp4"
                      value={dokUrlInput}
                      onChange={(e) => setDokUrlInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                      Mendukung link YouTube (akan otomatis ditampilkan sebagai pemutar video responsif), file video MP4/WebM, atau link video dokumentasi lainnya.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Media */}
              {dokUrlInput && (
                <div className="space-y-1.5 pt-2">
                  <span className="font-bold text-slate-700 block">Pratinjau Dokumentasi:</span>
                  {isVideoUrl(dokUrlInput) ? (
                    getYoutubeEmbed(dokUrlInput) ? (
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-black">
                        <iframe
                          src={getYoutubeEmbed(dokUrlInput)!}
                          title="Preview Video"
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black">
                        <video src={dokUrlInput} controls className="w-full max-h-48 rounded-2xl">
                          Browser tidak mendukung video.
                        </video>
                      </div>
                    )
                  ) : (
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={resolveMediaUrl(dokUrlInput)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpenDokModal(false);
                    setDokKegiatan(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingDok}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                >
                  <span>{savingDok ? "Menyimpan..." : "Simpan Dokumentasi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
