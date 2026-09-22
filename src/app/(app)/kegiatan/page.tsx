"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Camera,
  Megaphone,
  X,
  Filter,
  Sparkles,
  ChevronRight,
  Handshake,
  Heart,
  PartyPopper,
  Flame,
  Leaf,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { resolveMediaUrl } from "@/lib/media";

export default function KegiatanWargaPage() {
  const { user } = useAuth();
  const isWarga = user?.role === "warga";

  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Modal Detail State
  const [selectedKegiatan, setSelectedKegiatan] = useState<any>(null);

  // Modal Tambah Kegiatan State
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    namaKegiatan: "",
    kategori: "Gotong Royong",
    tanggal: new Date().toISOString().split("T")[0],
    waktu: "07.00 - 10.00 WIB",
    lokasi: "Lingkungan Blok Mawar",
    peserta: "Seluruh Warga RT 002",
    penanggungJawab: user?.name || "Bpk. Eka Rista Yudhistira, ST.",
    status: "Akan Datang",
    deskripsi: "",
    daftarKebutuhan: "",
    anggaran: "",
    realisasiBiaya: "",
    dokumentasiUrl: "",
    pengumuman: "",
  });

  const fetchKegiatan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kegiatan");
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

  const handleCreateKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaKegiatan || !form.tanggal || !form.lokasi || !form.penanggungJawab) {
      alert("Nama kegiatan, tanggal, lokasi, dan penanggung jawab wajib diisi!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/kegiatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

      setOpenModalAdd(false);
      setForm({
        namaKegiatan: "",
        kategori: "Gotong Royong",
        tanggal: new Date().toISOString().split("T")[0],
        waktu: "07.00 - 10.00 WIB",
        lokasi: "Lingkungan Blok Mawar",
        peserta: "Seluruh Warga RT 002",
        penanggungJawab: user?.name || "Bpk. Eka Rista Yudhistira, ST.",
        status: "Akan Datang",
        deskripsi: "",
        daftarKebutuhan: "",
        anggaran: "",
        realisasiBiaya: "",
        dokumentasiUrl: "",
        pengumuman: "",
      });
      fetchKegiatan();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = kegiatanList.filter((k) => {
    const matchKat = filterKategori === "Semua" || k.kategori === filterKategori;
    const matchStat = filterStatus === "Semua" || k.status === filterStatus;
    const matchSearch =
      !search ||
      k.namaKegiatan.toLowerCase().includes(search.toLowerCase()) ||
      k.lokasi.toLowerCase().includes(search.toLowerCase()) ||
      k.penanggungJawab.toLowerCase().includes(search.toLowerCase());
    return matchKat && matchStat && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Akan Datang":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Terjadwal":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Berlangsung":
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case "Selesai":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getKategoriIcon = (kategori: string) => {
    switch (kategori) {
      case "Gotong Royong":
        return <Handshake className="w-3.5 h-3.5 text-emerald-600" />;
      case "Keagamaan":
        return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
      case "Perayaan & Perlombaan":
        return <PartyPopper className="w-3.5 h-3.5 text-rose-600" />;
      case "Rapat Warga":
        return <Users className="w-3.5 h-3.5 text-blue-600" />;
      case "Sosial":
        return <Heart className="w-3.5 h-3.5 text-pink-600" />;
      case "Lingkungan":
        return <Leaf className="w-3.5 h-3.5 text-teal-600" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-1">
            <span>🏘️ KEHIDUPAN & KOMUNITAS WARGA</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Kegiatan Warga RT 002 RW 014
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Agenda kerja bakti, rapat musyawarah, keagamaan, perayaan 17 Agustus, posyandu, dan dokumentasi lingkungan
          </p>
        </div>

        {!isWarga && (
          <button
            onClick={() => setOpenModalAdd(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kegiatan Baru</span>
          </button>
        )}
      </div>

      {/* Kategori Quick Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Semua", icon: Layers, val: "Semua" },
          { label: "Gotong Royong", icon: Handshake, val: "Gotong Royong" },
          { label: "Keagamaan", icon: Sparkles, val: "Keagamaan" },
          { label: "Perayaan/Lomba", icon: PartyPopper, val: "Perayaan & Perlombaan" },
          { label: "Rapat Warga", icon: Users, val: "Rapat Warga" },
          { label: "Sosial & Posyandu", icon: Heart, val: "Sosial" },
          { label: "Lingkungan", icon: Leaf, val: "Lingkungan" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filterKategori === tab.val;
          return (
            <button
              key={tab.val}
              onClick={() => setFilterKategori(tab.val)}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                  : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kegiatan, lokasi, atau PJ..."
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
            <option value="Berlangsung">Berlangsung</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Daftar Kegiatan Warga Table (Matches prompt table specification) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Daftar Kegiatan Mendatang & Riwayat</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik nama kegiatan untuk melihat rincian detail, anggaran, daftar kebutuhan, dan dokumentasi
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {filtered.length} Kegiatan Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3.5 pl-6">Kegiatan</th>
                <th className="py-3.5">Kategori</th>
                <th className="py-3.5">Tanggal & Waktu</th>
                <th className="py-3.5">Lokasi</th>
                <th className="py-3.5">Penanggung Jawab</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5 text-right pr-6">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Belum ada kegiatan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((k) => (
                  <tr
                    key={k.id}
                    onClick={() => setSelectedKegiatan(k)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 pl-6 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          {getKategoriIcon(k.kategori)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">
                            {k.namaKegiatan}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {k.peserta}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {k.kategori}
                      </span>
                    </td>

                    <td className="py-4">
                      <p className="font-bold text-slate-700">{k.tanggal}</p>
                      <p className="text-[10px] text-slate-400">{k.waktu}</p>
                    </td>

                    <td className="py-4 text-slate-600 max-w-[180px]">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{k.lokasi}</span>
                      </div>
                    </td>

                    <td className="py-4 text-slate-700 font-semibold">
                      {k.penanggungJawab}
                    </td>

                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(k.status)}`}>
                        {k.status}
                      </span>
                    </td>

                    <td className="py-4 text-right pr-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedKegiatan(k);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors"
                      >
                        <span>Lihat Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid Kartu Kegiatan Populer / Mendatang */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          Highlight Agenda Lingkungan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {kegiatanList.slice(0, 3).map((item) => {
            const sisaAnggaran = Math.max(0, Number(item.anggaran || 0) - Number(item.realisasiBiaya || 0));

            return (
              <div
                key={item.id}
                onClick={() => setSelectedKegiatan(item)}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
              >
                <div>
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={resolveMediaUrl(item.dokumentasiUrl) || "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80"}
                      alt={item.namaKegiatan}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                      {item.kategori}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.namaKegiatan}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.deskripsi || "Kegiatan rutin paguyuban warga Blok Mawar."}
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.tanggal} · {item.waktu}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{item.lokasi}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Anggaran vs Realisasi Kas */}
                <div className="p-4 pt-0">
                  <div className="p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Anggaran
                      </span>
                      <span className="font-bold text-slate-800">
                        Rp {Number(item.anggaran || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Sisa Kas
                      </span>
                      <span className="font-bold text-emerald-600">
                        Rp {sisaAnggaran.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DETAIL KEGIATAN (Sesuai spesifikasi prompt) */}
      {selectedKegiatan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header Banner */}
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              <img
                src={resolveMediaUrl(selectedKegiatan.dokumentasiUrl) || "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80"}
                alt={selectedKegiatan.namaKegiatan}
                className="w-full h-full object-cover opacity-60"
              />
              <button
                onClick={() => setSelectedKegiatan(null)}
                className="absolute top-4 right-4 p-2 text-white bg-slate-900/60 hover:bg-slate-900 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1.5 ${getStatusBadge(selectedKegiatan.status)}`}>
                  {selectedKegiatan.status}
                </span>
                <h3 className="text-xl font-black leading-tight drop-shadow-md">
                  {selectedKegiatan.namaKegiatan}
                </h3>
              </div>
            </div>

            {/* Modal Body Detail */}
            <div className="p-6 space-y-5 text-xs">
              {/* Row Jadwal & Lokasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>Jadwal Pelaksanaan</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{selectedKegiatan.tanggal}</p>
                  <p className="text-slate-500 font-medium">{selectedKegiatan.waktu}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-rose-600 font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>Lokasi & Tempat</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm truncate">{selectedKegiatan.lokasi}</p>
                  <p className="text-slate-500 font-medium">Titik kumpul warga Blok Mawar</p>
                </div>
              </div>

              {/* Hubungan ke Modul Keuangan / Anggaran */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-900 text-sm flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Koneksi Anggaran & Realisasi Kas Kegiatan</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                    Transparan
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Alokasi Anggaran</span>
                    <span className="font-black text-slate-900 text-sm">
                      Rp {Number(selectedKegiatan.anggaran || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Realisasi Pengeluaran</span>
                    <span className="font-black text-rose-600 text-sm">
                      Rp {Number(selectedKegiatan.realisasiBiaya || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Sisa Kas Dikembalikan</span>
                    <span className="font-black text-emerald-600 text-sm">
                      Rp {Math.max(0, Number(selectedKegiatan.anggaran || 0) - Number(selectedKegiatan.realisasiBiaya || 0)).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deskripsi & Kebutuhan */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Deskripsi Kegiatan
                  </h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {selectedKegiatan.deskripsi || "Belum ada deskripsi lengkap."}
                  </p>
                </div>

                {selectedKegiatan.daftarKebutuhan && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Daftar Kebutuhan & Perlengkapan
                    </h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {selectedKegiatan.daftarKebutuhan}
                    </p>
                  </div>
                )}

                {selectedKegiatan.pengumuman && (
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5 text-amber-700">
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Pengumuman Khusus Warga</span>
                    </h4>
                    <p className="text-amber-900 leading-relaxed bg-amber-50 p-3 rounded-2xl border border-amber-200 font-medium">
                      {selectedKegiatan.pengumuman}
                    </p>
                  </div>
                )}
              </div>

              {/* PJ & Peserta */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
                <div>
                  <span>Peserta: </span>
                  <span className="font-bold text-slate-700">{selectedKegiatan.peserta}</span>
                </div>
                <div>
                  <span>Penanggung Jawab: </span>
                  <span className="font-bold text-indigo-700">{selectedKegiatan.penanggungJawab}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setSelectedKegiatan(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KEGIATAN BARU (Khusus Admin / Pengurus) */}
      {!isWarga && openModalAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800">Tambah Kegiatan Warga Baru</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publikasikan gotong royong, rapat, pengajian, posyandu, atau perayaan ke seluruh warga
                </p>
              </div>
              <button
                onClick={() => setOpenModalAdd(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKegiatan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kegiatan *</label>
                <input
                  type="text"
                  placeholder="Contoh: Gotong Royong Saluran Air & Fogging"
                  value={form.namaKegiatan}
                  onChange={(e) => setForm({ ...form, namaKegiatan: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Kegiatan *</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Gotong Royong">Gotong Royong / Kerja Bakti</option>
                    <option value="Rapat Warga">Rapat Warga & Musyawarah</option>
                    <option value="Keagamaan">Keagamaan / Pengajian / Maulid</option>
                    <option value="Sosial">Sosial & Posyandu</option>
                    <option value="Perayaan & Perlombaan">Perayaan & 17 Agustus</option>
                    <option value="Lingkungan">Lingkungan & Kebersihan</option>
                    <option value="Kepemudaan">Kepemudaan / Karang Taruna</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kegiatan</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Akan Datang">Akan Datang</option>
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan *</label>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu / Jam Pelaksanaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: 07.00 - 10.00 WIB"
                    value={form.waktu}
                    onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Kegiatan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Balai Warga / Blok Mawar"
                    value={form.lokasi}
                    onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab (PJ) *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Eka Rista Yudhistira, ST."
                    value={form.penanggungJawab}
                    onChange={(e) => setForm({ ...form, penanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alokasi Anggaran Kas (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 750000"
                    value={form.anggaran}
                    onChange={(e) => setForm({ ...form, anggaran: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Realisasi Pengeluaran (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 625000"
                    value={form.realisasiBiaya}
                    onChange={(e) => setForm({ ...form, realisasiBiaya: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Kegiatan</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan tujuan dan susunan acara..."
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Daftar Kebutuhan / Alat</label>
                <input
                  type="text"
                  placeholder="Contoh: Cangkul, sapu, karung sampah, konsumsi"
                  value={form.daftarKebutuhan}
                  onChange={(e) => setForm({ ...form, daftarKebutuhan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pengumuman untuk Warga</label>
                <input
                  type="text"
                  placeholder="Pesan imbauan yang disampaikan ke warga..."
                  value={form.pengumuman}
                  onChange={(e) => setForm({ ...form, pengumuman: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenModalAdd(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? "Memproses..." : "Publikasikan Kegiatan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
