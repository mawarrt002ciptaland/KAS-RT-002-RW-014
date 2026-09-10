"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Wallet,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

const DEFAULT_TRANSAKSI = [
  { id: 10, kodeTransaksi: "TRX-00010", jenis: "pemasukan", kategori: "Iuran Bulanan", tanggal: "2026-04-06", nominal: 450000, keterangan: "Pembayaran awal April (Sebagian warga lunas iuran)", metodePembayaran: "Transfer / QRIS", namaPihak: "Warga Blok Mawar" },
  { id: 9, kodeTransaksi: "TRX-00009", jenis: "pengeluaran", kategori: "Fasilitas", tanggal: "2026-03-25", nominal: 375000, keterangan: "Penggantian lampu penerangan jalan gang Blok Mawar (5 titik LED)", metodePembayaran: "Transfer / QRIS", namaPihak: "Toko Listrik Terang" },
  { id: 8, kodeTransaksi: "TRX-00008", jenis: "pengeluaran", kategori: "Keamanan", tanggal: "2026-03-16", nominal: 240000, keterangan: "Perawatan portal keamanan, oli hidrolik & remote RFID", metodePembayaran: "Transfer / QRIS", namaPihak: "Teknisi Gate Security" },
  { id: 7, kodeTransaksi: "TRX-00007", jenis: "pemasukan", kategori: "Iuran Sampah", tanggal: "2026-03-10", nominal: 275000, keterangan: "Iuran sampah tambahan & retribusi kebersihan Maret", metodePembayaran: "Transfer / QRIS", namaPihak: "Koordinator Lingkungan" },
  { id: 6, kodeTransaksi: "TRX-00006", jenis: "pemasukan", kategori: "Iuran Bulanan", tanggal: "2026-03-08", nominal: 750000, keterangan: "Pembayaran iuran warga Maret (termin 1)", metodePembayaran: "Transfer / QRIS", namaPihak: "Warga Blok Mawar" },
  { id: 5, kodeTransaksi: "TRX-00005", jenis: "pengeluaran", kategori: "Sosial", tanggal: "2026-02-27", nominal: 300000, keterangan: "Konsumsi rapat warga RT triwulan 1 & snack", metodePembayaran: "Tunai", namaPihak: "Katering Bu Ani" },
  { id: 4, kodeTransaksi: "TRX-00004", jenis: "pengeluaran", kategori: "Fasilitas", tanggal: "2026-02-22", nominal: 185000, keterangan: "Peralatan kerja bakti dan peremajaan cat marka jalan", metodePembayaran: "Transfer / QRIS", namaPihak: "Toko Besi Berkah" },
  { id: 3, kodeTransaksi: "TRX-00003", jenis: "pemasukan", kategori: "Iuran Bulanan", tanggal: "2026-02-12", nominal: 1125000, keterangan: "Iuran kas dan sampah warga bulan Februari 2026", metodePembayaran: "Transfer / QRIS", namaPihak: "Warga Blok Mawar" },
  { id: 2, kodeTransaksi: "TRX-00002", jenis: "pengeluaran", kategori: "Kebersihan", tanggal: "2026-01-28", nominal: 450000, keterangan: "Gaji petugas kebersihan & angkut sampah bulan Januari", metodePembayaran: "Tunai", namaPihak: "Pak Mamat" },
  { id: 1, kodeTransaksi: "TRX-00001", jenis: "pemasukan", kategori: "Iuran Bulanan", tanggal: "2026-01-15", nominal: 1120000, keterangan: "Iuran kas dan sampah warga bulan Januari 2026 (12 KK)", metodePembayaran: "Transfer / QRIS", namaPihak: "Warga Blok Mawar" }
];

export default function LaporanPage() {
  const [transaksiList, setTransaksiList] = useState<any[]>(DEFAULT_TRANSAKSI);
  const [loading, setLoading] = useState(false);
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState("Tahun 2026");

  const [ringkasan, setRingkasan] = useState({
    saldo: 2170000,
    totalPemasukan: 3720000,
    totalPengeluaran: 1550000,
  });

  const [rekapIuran, setRekapIuran] = useState({
    totalTagihan: 900000,
    totalTerkumpul: 600000,
    totalTertunda: 300000,
    countLunas: 8,
    countBelumLunas: 4,
    persentase: 67,
  });

  const fetchData = async () => {
    try {
      const [resTrx, resTagihan] = await Promise.all([
        fetch("/api/transaksi").catch(() => null),
        fetch(`/api/tagihan?bulan=${encodeURIComponent("April 2026")}`).catch(() => null),
      ]);

      if (resTrx && resTrx.ok) {
        const dataTrx = await resTrx.json().catch(() => null);
        if (dataTrx?.transaksi && Array.isArray(dataTrx.transaksi)) {
          setTransaksiList(dataTrx.transaksi);
        }
        if (dataTrx?.ringkasan) {
          setRingkasan({
            saldo: Number(dataTrx.ringkasan.saldo ?? 2170000),
            totalPemasukan: Number(dataTrx.ringkasan.totalPemasukan ?? 3720000),
            totalPengeluaran: Number(dataTrx.ringkasan.totalPengeluaran ?? 1550000),
          });
        }
      }

      if (resTagihan && resTagihan.ok) {
        const dataTagihan = await resTagihan.json().catch(() => null);
        if (dataTagihan?.stats) {
          setRekapIuran({
            totalTagihan: Number(dataTagihan.stats.totalTarget ?? 900000),
            totalTerkumpul: Number(dataTagihan.stats.totalTerkumpul ?? 600000),
            totalTertunda: Number(dataTagihan.stats.totalTertunda ?? 300000),
            countLunas: Number(dataTagihan.stats.countLunas ?? 8),
            countBelumLunas: Number(dataTagihan.stats.countBelumLunas ?? 4),
            persentase: Number(dataTagihan.stats.persentase ?? 67),
          });
        }
      }
    } catch (e) {
      console.warn("Could not refresh live transaction data:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const safeTransaksi = Array.isArray(transaksiList) ? transaksiList : DEFAULT_TRANSAKSI;

  const filteredTransaksi = safeTransaksi.filter((item) => {
    if (!item) return false;
    const matchJenis = filterJenis === "Semua" || item.jenis === filterJenis;
    const matchKategori = filterKategori === "Semua" || item.kategori === filterKategori;
    const itemKet = String(item.keterangan || "").toLowerCase();
    const itemKode = String(item.kodeTransaksi || "").toLowerCase();
    const itemPihak = String(item.namaPihak || "").toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !search || itemKet.includes(q) || itemKode.includes(q) || itemPihak.includes(q);

    return matchJenis && matchKategori && matchSearch;
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleExportCsv = () => {
    try {
      const headers = ["Kode,Jenis,Kategori,Tanggal,Nominal,Keterangan,Pihak\n"];
      const rows = filteredTransaksi.map(
        (t) =>
          `"${t.kodeTransaksi || ""}","${t.jenis || ""}","${t.kategori || ""}","${t.tanggal || ""}","${t.nominal || 0}","${(t.keterangan || "").replace(/"/g, '""')}","${(t.namaPihak || "").replace(/"/g, '""')}"`
      );
      const blob = new Blob([headers.concat(rows.join("\n")).join("")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Kas_RT002_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan pertanggungjawaban kas Blok Mawar RT 002 RW 014 Perumahan Ciptaland
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak Laporan</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* TWO TOP COLUMNS: Ringkasan Keuangan & Rekap Iuran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Ringkasan Keuangan */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Ringkasan Keuangan
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Posisi kas & akumulasi transaksi {periode}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {periode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Pemasukan
                </span>
                <span className="text-lg font-black text-emerald-600 mt-1 block">
                  Rp {(ringkasan?.totalPemasukan ?? 0).toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-slate-400">Iuran, donasi & kas masuk</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Pengeluaran
                </span>
                <span className="text-lg font-black text-rose-600 mt-1 block">
                  Rp {(ringkasan?.totalPengeluaran ?? 0).toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-slate-400">Kebersihan, keamanan, perbaikan</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
                  Saldo Kas Bersih Saat Ini
                </span>
                <span className="text-2xl font-black text-indigo-900 mt-0.5 block">
                  Rp {(ringkasan?.saldo ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
              <span className="px-3 py-1 bg-white text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shadow-sm">
                Surplus Kas Sehat
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 2: Rekap Iuran */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Rekap Iuran Warga
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Capaian kepatuhan iuran warga periode berjalan
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                April 2026
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Iuran Terkumpul
                  </span>
                  <span className="text-xs font-black text-emerald-700">
                    {rekapIuran?.persentase ?? 0}%
                  </span>
                </div>
                <span className="text-lg font-black text-emerald-700 mt-1 block">
                  Rp {(rekapIuran?.totalTerkumpul ?? 0).toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {rekapIuran?.countLunas ?? 0} warga telah melunasi
                </span>
              </div>

              <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                    Tagihan Tertunda
                  </span>
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <span className="text-lg font-black text-rose-600 mt-1 block">
                  Rp {(rekapIuran?.totalTertunda ?? 0).toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">
                  {rekapIuran?.countBelumLunas ?? 0} warga menunggu konfirmasi
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Target Penerimaan Iuran RT (12 KK)</span>
              <span className="font-bold text-slate-900">
                Rp {(rekapIuran?.totalTagihan ?? 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTE 2: Rincian Transaksi */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        {/* Header Rincian Transaksi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <span>Rincian Transaksi</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {filteredTransaksi.length} Catatan
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar kronologis seluruh arus kas masuk dan kas keluar RT 002 RW 014
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="pemasukan">Pemasukan (+)</option>
              <option value="pengeluaran">Pengeluaran (-)</option>
            </select>

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Iuran Bulanan">Iuran Bulanan</option>
              <option value="Iuran Sampah">Iuran Sampah</option>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Fasilitas">Fasilitas</option>
              <option value="Sosial">Sosial</option>
            </select>
          </div>
        </div>

        {/* Detailed Table matching "Rincian Transaksi.png" */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Tanggal</th>
                <th className="pb-3">Kode & Uraian Transaksi</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Metode / Pihak</th>
                <th className="pb-3 text-right">Nominal</th>
                <th className="pb-3 text-center">Kwitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredTransaksi.map((t) => {
                  const isPemasukan = t.jenis === "pemasukan";
                  const nom = Number(t.nominal || 0);

                  return (
                    <tr key={t.id || t.kodeTransaksi} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pl-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {t.tanggal || "-"}
                      </td>
                      <td className="py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              isPemasukan
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {isPemasukan ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {t.keterangan || "Transaksi Kas"}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {t.kodeTransaksi || "-"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {t.kategori || "-"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">
                        <p className="font-semibold">{t.namaPihak || "Warga RT 002"}</p>
                        <p className="text-[10px] text-slate-400">{t.metodePembayaran || "Transfer / QRIS"}</p>
                      </td>
                      <td className="py-3 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isPemasukan ? "text-emerald-600" : "text-rose-600"
                          }
                        >
                          {isPemasukan ? "+" : "-"} Rp {nom.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <Link
                          href={`/kwitansi?kode=${encodeURIComponent(t.kodeTransaksi || "")}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold transition-colors"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Kwitansi</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
