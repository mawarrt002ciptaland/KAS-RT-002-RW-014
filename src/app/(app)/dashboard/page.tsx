"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  FileClock,
  Plus,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Calendar,
  MoreVertical,
  ExternalLink,
  Globe,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import { useAuth } from "@/context/AuthContext";
import { ModalCatatTransaksi } from "@/components/ModalCatatTransaksi";
import { ModalTambahWarga } from "@/components/ModalTambahWarga";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    transaksi: any[];
    ringkasan: {
      saldo: number;
      totalPemasukan: number;
      totalPengeluaran: number;
      pengeluaranPerKategori: Record<string, number>;
      totalTransaksi: number;
    };
  } | null>(null);

  const [tagihanStats, setTagihanStats] = useState({
    totalTarget: 0,
    totalTerkumpul: 0,
    totalTertunda: 0,
    countLunas: 0,
    countBelumLunas: 0,
    persentase: 0,
  });

  const [openTrxModal, setOpenTrxModal] = useState(false);
  const [openWargaModal, setOpenWargaModal] = useState(false);
  const [linksConfig, setLinksConfig] = useState<any>({
    waAduanWarga: "081234567890",
    youtubeUrl: "https://www.youtube.com",
    websiteName1: "Portal Warga Ciptaland",
    websiteUrl1: "https://ciptaland.id",
    websiteLogo1: "",
    websiteName2: "Pemerintah Kota Batam",
    websiteUrl2: "https://batam.go.id",
    websiteLogo2: "",
  });

  const loadData = async () => {
    try {
      const [resTrx, resTagihan, resPengaturan] = await Promise.all([
        fetch("/api/transaksi", { cache: "no-store" }),
        fetch("/api/tagihan?bulan=April 2026", { cache: "no-store" }),
        fetch("/api/pengaturan", { cache: "no-store" }),
      ]);

      const dataTrx = await resTrx.json();
      const dataTagihan = await resTagihan.json();
      const dataPengaturan = await resPengaturan.json();

      setData(dataTrx);
      if (dataTagihan.stats) {
        setTagihanStats(dataTagihan.stats);
      }
      if (dataPengaturan?.pengaturan) {
        setLinksConfig(dataPengaturan.pengaturan);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saldo = Number(data?.ringkasan?.saldo ?? 0);
  const pemasukan = Number(data?.ringkasan?.totalPemasukan ?? 0);
  const pengeluaran = Number(data?.ringkasan?.totalPengeluaran ?? 0);
  const recentTransactions = data?.transaksi?.slice(0, 5) || [];
  const categoryTotals = Object.entries(data?.ringkasan?.pengeluaranPerKategori || {}) as [string, number][];
  const totalCategorySpend = categoryTotals.reduce((acc, [, value]) => acc + Number(value || 0), 0);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: monthNames[i], pemasukan: 0, pengeluaran: 0 }));
  (data?.transaksi || []).forEach((t: any) => {
    const monthIndex = Math.max(0, Math.min(11, Number(String(t.tanggal).slice(5, 7)) - 1));
    if (t.jenis === "pemasukan") monthly[monthIndex].pemasukan += Number(t.nominal || 0);
    if (t.jenis === "pengeluaran") monthly[monthIndex].pengeluaran += Number(t.nominal || 0);
  });

  const chartMax = Math.max(1, ...monthly.map((m) => Math.max(m.pemasukan, m.pengeluaran)));
  const chartLeft = 50;
  const chartRight = 590;
  const chartBottom = 180;
  const chartTop = 20;
  const chartHeight = chartBottom - chartTop;
  const stepX = (chartRight - chartLeft) / 11;
  const yFor = (value: number) => chartBottom - (value / chartMax) * chartHeight;
  const pemasukanPoints = monthly.map((m, i) => ({ x: chartLeft + i * stepX, y: yFor(m.pemasukan) }));
  const pengeluaranPoints = monthly.map((m, i) => ({ x: chartLeft + i * stepX, y: yFor(m.pengeluaran) }));

  const linePath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");

  const areaPath = `${linePath(pemasukanPoints)} L ${chartRight},${chartBottom} L ${chartLeft},${chartBottom} Z`;

  const formatShortRupiah = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1).replace('.0', '')} jt`;
    if (value >= 1000) return `Rp ${Math.round(value / 1000)} rb`;
    return `Rp ${value}`;
  };

  const yTickValues = [chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
            Selamat Datang, {user?.name ? user.name.split(" ")[0] : "Pak Ahmad"} 👋
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Ringkasan Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kondisi keuangan lingkungan dalam satu tampilan.
          </p>
        </div>

        {user?.role !== "warga" && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setOpenWargaModal(true)}
              className="px-4 py-2.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Tambah Warga</span>
            </button>
            <button
              onClick={() => setOpenTrxModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Metric Cards (Responsive 2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Saldo Kas */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full">
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>+12.5%</span>
            </span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Kas Saat Ini
            </p>
            <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
              Rp {saldo.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 mt-0.5 font-semibold truncate">
              Sisa kas per Agustus 2026
            </p>
          </div>
        </div>

        {/* Card 2: Pemasukan */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full">
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>+8.2%</span>
            </span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Pendapatan / Saldo (A)
            </p>
            <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
              Rp {pemasukan.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium">
              Periode Agustus 2026
            </p>
          </div>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Pengeluaran (B)
            </p>
            <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
              Rp {pengeluaran.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium">
              Periode Agustus 2026
            </p>
          </div>
        </div>

        {/* Card 4: Tagihan Tertunda */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <FileClock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Tagihan Tertunda
            </p>
            <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
              Rp {tagihanStats.totalTertunda.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] sm:text-[11px] text-rose-500 mt-0.5 font-bold truncate">
              {tagihanStats.countBelumLunas} warga belum lunas
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Arus Kas Bulanan Chart & Tagihan Bulan Ini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arus Kas Bulanan (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Arus Kas Bulanan</h2>
              <p className="text-xs text-slate-400">
                Perbandingan pemasukan dan pengeluaran tahun 2026
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tahun 2026</span>
            </div>
          </div>

          {/* SVG Cash Flow Graphic Chart (Responsive Scrollable on Mobile) */}
          <div className="relative mt-4 pt-2 overflow-x-auto">
            <div className="h-56 min-w-[500px] w-full flex flex-col justify-between">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="pemasukanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {yTickValues.map((tick, index) => {
                  const y = yFor(tick);
                  return (
                    <g key={index}>
                      <line x1="40" y1={y} x2="590" y2={y} stroke={index === yTickValues.length - 1 ? "#E2E8F0" : "#F1F5F9"} strokeWidth={index === yTickValues.length - 1 ? "1.5" : "1"} />
                      <text x="35" y={y + 4} fontSize="9" fill="#94A3B8" textAnchor="end">{formatShortRupiah(tick)}</text>
                    </g>
                  );
                })}

                <path d={areaPath} fill="url(#pemasukanGrad)" />
                <path d={linePath(pemasukanPoints)} fill="none" stroke="#4F46E5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={linePath(pengeluaranPoints)} fill="none" stroke="#FB923C" strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* X-axis months */}
              <div className="flex justify-between pl-10 pr-2 text-[10px] font-semibold text-slate-400">
                {monthly.map((m) => (
                  <span key={m.month}>{m.month}</span>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="text-indigo-900">Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                <span className="text-orange-900">Pengeluaran</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tagihan Bulan Ini (1 col) matching Screenshot 5 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Tagihan Bulan Ini</h2>
                <p className="text-xs text-slate-400">April 2026</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Donut Ring Chart */}
            <div className="relative flex justify-center items-center py-6">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke="#E2E8F0"
                  strokeWidth="14"
                  fill="transparent"
                />
                {/* Progress Ring (67% = 351 circumference * 0.67 = ~235) */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke="#4F46E5"
                  strokeWidth="14"
                  strokeDasharray="351"
                  strokeDashoffset={351 - (351 * tagihanStats.persentase) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center percentage text */}
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 block leading-tight">
                  {tagihanStats.persentase}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Terkumpul
                </span>
              </div>
            </div>

            {/* Status breakdown pills */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 bg-indigo-50/60 rounded-xl">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-indigo-700 font-bold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>Sudah lunas</span>
                </div>
                <span className="font-bold text-slate-800">{tagihanStats.countLunas} warga</span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Belum lunas</span>
                </div>
                <span className="font-bold text-slate-800">{tagihanStats.countBelumLunas} warga</span>
              </div>
            </div>

            {/* Dana terkumpul ratio bar */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Dana Terkumpul
              </span>
              <span className="text-sm font-black text-slate-900">
                Rp {tagihanStats.totalTerkumpul.toLocaleString("id-ID")} / Rp {tagihanStats.totalTarget.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <Link
            href="/tagihan"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 text-center"
          >
            <span>Lihat semua tagihan</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Kolom Khusus Link: WhatsApp Aduan Warga, YouTube, dan Website A/B */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Link Resmi & Layanan Digital Warga</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Akses cepat pengaduan warga via WhatsApp, saluran video YouTube, dan portal website resmi
            </p>
          </div>

          {user?.role !== "warga" && (
            <Link
              href="/pengaturan?tab=links"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 self-start sm:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Edit Link & Logo</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* 1. WhatsApp Aduan Warga */}
          <a
            href={`https://api.whatsapp.com/send?phone=${(linksConfig.waAduanWarga || "081234567890").replace(/[^0-9]/g, "").replace(/^0/, "62")}&text=Halo%20Pengurus%20RT%20002%20RW%20014,%20saya%20warga%20ingin%20menyampaikan%20aduan/aspirasi:%20`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/80 transition-all text-emerald-950 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Pengaduan</span>
                <p className="font-black text-xs text-slate-900 truncate">WhatsApp Aduan</p>
                <p className="text-[11px] text-emerald-700 font-mono truncate">{linksConfig.waAduanWarga || "081234567890"}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0 opacity-70 group-hover:opacity-100" />
          </a>

          {/* 2. YouTube RT 002 */}
          <a
            href={linksConfig.youtubeUrl || "https://www.youtube.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100/80 transition-all text-rose-950 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
                ▶
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Saluran Video</span>
                <p className="font-black text-xs text-slate-900 truncate">YouTube RT 002</p>
                <p className="text-[11px] text-rose-700 truncate">Dokumentasi & Siaran</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-rose-600 shrink-0 opacity-70 group-hover:opacity-100" />
          </a>

          {/* 3. Website A */}
          <a
            href={linksConfig.websiteUrl1 || "https://ciptaland.id"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all text-slate-900 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {linksConfig.websiteLogo1 ? (
                  <img
                    src={resolveMediaUrl(linksConfig.websiteLogo1)}
                    alt="Logo Website A"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Globe className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Website A</span>
                <p className="font-black text-xs text-slate-900 truncate">{linksConfig.websiteName1 || "Portal Warga"}</p>
                <p className="text-[11px] text-indigo-600 font-mono truncate">{(linksConfig.websiteUrl1 || "ciptaland.id").replace(/^https?:\/\//, "")}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 opacity-70 group-hover:opacity-100" />
          </a>

          {/* 4. Website B */}
          <a
            href={linksConfig.websiteUrl2 || "https://batam.go.id"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all text-slate-900 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {linksConfig.websiteLogo2 ? (
                  <img
                    src={resolveMediaUrl(linksConfig.websiteLogo2)}
                    alt="Logo Website B"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Globe className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Website B</span>
                <p className="font-black text-xs text-slate-900 truncate">{linksConfig.websiteName2 || "Pemko Batam"}</p>
                <p className="text-[11px] text-indigo-600 font-mono truncate">{(linksConfig.websiteUrl2 || "batam.go.id").replace(/^https?:\/\//, "")}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 opacity-70 group-hover:opacity-100" />
          </a>
        </div>
      </div>

      {/* Bottom Row: Transaksi Terbaru & Pengeluaran per Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaksi Terbaru (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Transaksi Terbaru</h2>
              <p className="text-xs text-slate-400">Aktivitas kas terbaru Blok Mawar</p>
            </div>
            <Link
              href="/laporan"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Lihat semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Transaksi</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Tanggal</th>
                  <th className="pb-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentTransactions.map((t) => {
                  const isPemasukan = t.jenis === "pemasukan";
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isPemasukan
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {isPemasukan ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {t.keterangan}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {t.kodeTransaksi}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {t.kategori}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-[11px]">
                        {t.tanggal}
                      </td>
                      <td className="py-3 text-right font-bold">
                        <span
                          className={
                            isPemasukan ? "text-emerald-600" : "text-rose-600"
                          }
                        >
                          {isPemasukan ? "+" : "-"} Rp {t.nominal.toLocaleString("id-ID")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pengeluaran per Kategori (1 col) matching Screenshot 5 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Pengeluaran per Kategori
                </h2>
                <p className="text-xs text-slate-400">
                  Distribusi penggunaan dana
                </p>
              </div>
            </div>

            {/* Donut chart for categories */}
            <div className="relative flex justify-center items-center py-4">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="50" stroke="#E2E8F0" strokeWidth="16" fill="transparent" />
                {/* Keamanan: 35% */}
                <circle
                  cx="72"
                  cy="72"
                  r="50"
                  stroke="#4F46E5"
                  strokeWidth="16"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * 0.35)}
                  fill="transparent"
                />
                {/* Kebersihan: 41% */}
                <circle
                  cx="72"
                  cy="72"
                  r="50"
                  stroke="#FB923C"
                  strokeWidth="16"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * 0.41)}
                  transform="rotate(126 72 72)"
                  fill="transparent"
                />
                {/* Fasilitas: 24% */}
                <circle
                  cx="72"
                  cy="72"
                  r="50"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * 0.24)}
                  transform="rotate(274 72 72)"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-400 font-bold block">Total</span>
                <span className="text-sm font-black text-slate-900">{formatShortRupiah(totalCategorySpend)}</span>
              </div>
            </div>

            <div className="space-y-2.5 mt-2">
              {categoryTotals.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada data pengeluaran kategori.</p>
              ) : (
                categoryTotals
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .map(([name, value], index) => {
                    const colors = ["bg-indigo-600", "bg-orange-400", "bg-emerald-500", "bg-rose-500", "bg-cyan-500"];
                    const pct = totalCategorySpend ? Math.round((Number(value) / totalCategorySpend) * 100) : 0;
                    return (
                      <div key={name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colors[index % colors.length]}`}></span>
                          <span className="font-semibold text-slate-700">{name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-medium">Rp {Number(value).toLocaleString("id-ID")}</span>
                          <span className="font-bold text-slate-900 w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 text-center">
            * Persentase dihitung dari total pengeluaran yang tercatat.
          </p>
        </div>
      </div>

      {/* Modals */}
      <ModalCatatTransaksi
        isOpen={openTrxModal}
        onClose={() => setOpenTrxModal(false)}
        onSuccess={loadData}
      />
      <ModalTambahWarga
        isOpen={openWargaModal}
        onClose={() => setOpenWargaModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
