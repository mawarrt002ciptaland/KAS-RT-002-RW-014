"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ArrowDownLeft, Plus, Search, Receipt, Calendar, Download } from "lucide-react";
import { ModalCatatTransaksi } from "@/components/ModalCatatTransaksi";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default function PemasukanPage() {
  const { user } = useAuth();
  const isWarga = user?.role === "warga";

  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [filterYear, setFilterYear] = useState("Semua");
  const [filterMonth, setFilterMonth] = useState("Semua");
  const [filterDate, setFilterDate] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const fetchPemasukan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transaksi?jenis=pemasukan", { cache: "no-store" });
      const data = await res.json();
      if (data.transaksi) setTransaksi(data.transaksi);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPemasukan();
  }, []);

  const years = Array.from(new Set(transaksi.map((t) => String(t.tanggal).slice(0, 4)))).filter(Boolean).sort();
  const months = Array.from(new Set(transaksi.map((t) => getMonthLabel(t.tanggal)))).filter(Boolean);

  const filtered = transaksi.filter((t) => {
    const year = String(t.tanggal).slice(0, 4);
    const monthLabel = getMonthLabel(t.tanggal);
    const matchCat = kategori === "Semua" || t.kategori === kategori;
    const matchYear = filterYear === "Semua" || year === filterYear;
    const matchMonth = filterMonth === "Semua" || monthLabel === filterMonth;
    const matchDate = !filterDate || t.tanggal === filterDate;
    const matchSearch = !search || t.keterangan.toLowerCase().includes(search.toLowerCase()) || t.kodeTransaksi.toLowerCase().includes(search.toLowerCase()) || (t.namaPihak && t.namaPihak.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchYear && matchMonth && matchDate && matchSearch;
  });

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of filtered) {
      const key = getMonthLabel(item.tanggal);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const total = filtered.reduce((acc, t) => acc + Number(t.nominal || 0), 0);
  const currentMonthTotal = grouped[0]?.[1]?.reduce((acc: number, t: any) => acc + Number(t.nominal || 0), 0) || 0;

  const exportCsv = () => {
    const headers = ["Tanggal,Bulan,Tahun,Kode,Keterangan,Kategori,Penyetor,Metode,Nominal\n"];
    const rows = filtered.map((t) => `"${t.tanggal}","${getMonthLabel(t.tanggal)}","${String(t.tanggal).slice(0, 4)}","${t.kodeTransaksi}","${t.keterangan}","${t.kategori}","${t.namaPihak || "Warga Blok Mawar"}","${t.metodePembayaran}","${t.nominal}"`);
    const blob = new Blob([headers.concat(rows.join("\n")).join("")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pemasukan-kas.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pemasukan Kas</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pencatatan seluruh uang masuk, iuran bulanan warga, donasi dan pendapatan RT</p>
        </div>
        {!isWarga && (
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm transition-all"><Download className="w-4 h-4" /><span>Export CSV</span></button>
            <button onClick={() => setOpenModal(true)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-emerald-200 transition-all self-start md:self-auto"><Plus className="w-4 h-4" /><span>Catat Pemasukan Baru</span></button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"><ArrowDownLeft className="w-4 h-4 text-emerald-600" /><span>Total Pemasukan Tersaring</span></div><p className="text-2xl font-black text-emerald-600">Rp {total.toLocaleString("id-ID")}</p><p className="text-[11px] text-slate-400 mt-1">Akumulasi dari filter aktif</p></div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"><Calendar className="w-4 h-4 text-indigo-600" /><span>Pemasukan Periode Teratas</span></div><p className="text-2xl font-black text-slate-900">Rp {currentMonthTotal.toLocaleString("id-ID")}</p><p className="text-[11px] text-slate-400 mt-1">{grouped[0]?.[0] || "Belum ada data"}</p></div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"><Receipt className="w-4 h-4 text-purple-600" /><span>Jumlah Transaksi Masuk</span></div><p className="text-2xl font-black text-slate-900">{filtered.length} Transaksi</p><p className="text-[11px] text-slate-400 mt-1">Tercatat rapi di buku kas</p></div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Cari transaksi pemasukan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
          <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"><option value="Semua">Semua Kategori</option><option value="Iuran Bulanan">Iuran Bulanan</option><option value="Iuran Sampah">Iuran Sampah</option><option value="Donasi Warga">Donasi Warga</option><option value="Kas Lingkungan">Kas Lingkungan</option></select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"><option value="Semua">Semua Tahun</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"><option value="Semua">Semua Bulan</option>{months.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </div>
        <div className="flex items-center gap-3"><label className="text-xs font-bold text-slate-500">Filter Tanggal:</label><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800" />{filterDate && <button onClick={() => setFilterDate("")} className="text-xs font-bold text-indigo-600">Reset tanggal</button>}</div>

        {grouped.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">Belum ada data pemasukan. Silakan input manual secara realtime.</div>
        ) : (
          grouped.map(([groupLabel, rows]) => (
            <div key={groupLabel} className="rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200"><div><h3 className="text-sm font-black text-slate-800">{groupLabel}</h3><p className="text-[11px] text-slate-500">{rows.length} transaksi pemasukan</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total</p><p className="text-sm font-black text-emerald-600">Rp {rows.reduce((acc, t) => acc + Number(t.nominal || 0), 0).toLocaleString("id-ID")}</p></div></div>
              <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="pb-3 pt-3 pl-4">Tanggal</th><th className="pb-3 pt-3">Kode & Keterangan</th><th className="pb-3 pt-3">Kategori</th><th className="pb-3 pt-3">Penyetor / Pihak</th><th className="pb-3 pt-3">Metode</th><th className="pb-3 pt-3 text-right">Nominal</th><th className="pb-3 pt-3 text-center pr-4">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100 font-medium">{rows.map((t) => <tr key={t.id} className="hover:bg-slate-50/60 transition-colors"><td className="py-3.5 pl-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{t.tanggal}</td><td className="py-3.5 max-w-xs"><p className="font-bold text-slate-800 leading-tight">{t.keterangan}</p><span className="text-[10px] text-slate-400 font-mono">{t.kodeTransaksi}</span></td><td className="py-3.5"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">{t.kategori}</span></td><td className="py-3.5 text-slate-700 font-semibold">{t.namaPihak || "Warga Blok Mawar"}</td><td className="py-3.5 text-slate-500 text-[11px]">{t.metodePembayaran}</td><td className="py-3.5 text-right font-black text-emerald-600 whitespace-nowrap">+ Rp {Number(t.nominal).toLocaleString("id-ID")}</td><td className="py-3.5 text-center pr-4"><Link href={`/kwitansi?kode=${t.kodeTransaksi}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold transition-colors"><Receipt className="w-3 h-3" /><span>Kwitansi</span></Link></td></tr>)}</tbody></table></div>
            </div>
          ))
        )}
      </div>

      <ModalCatatTransaksi isOpen={openModal} onClose={() => setOpenModal(false)} onSuccess={fetchPemasukan} defaultJenis="pemasukan" />
    </div>
  );
}
