"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Send, Plus, CreditCard, Search, Receipt, Download, Info, RefreshCw } from "lucide-react";
import { ModalBayarIuran } from "@/components/ModalBayarIuran";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function TagihanPage() {
  const { user } = useAuth();
  const isWarga = user?.role === "warga";

  const [tagihan, setTagihan] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalTarget: 0, totalTerkumpul: 0, totalTertunda: 0, countLunas: 0, countBelumLunas: 0, persentase: 0 });
  const [bulan, setBulan] = useState("April 2026");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({ namaRt: "RT 002 RW 014", blok: "Blok Mawar", namaBank: "Bank Nasional Indonesia (BNI)", noRekening: "0799703264", atasNama: "Neny Melsya" });
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [openBayarModal, setOpenBayarModal] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);

  const computeStats = (rows: any[]) => {
    const totalTarget = rows.reduce((a, b) => a + Number(b.totalTagihan || 0), 0);
    const totalTerkumpul = rows.filter((r) => r.status === "lunas").reduce((a, b) => a + Number(b.totalTagihan || 0), 0);
    const totalTertunda = totalTarget - totalTerkumpul;
    const countLunas = rows.filter((r) => r.status === "lunas").length;
    const countBelumLunas = rows.filter((r) => r.status !== "lunas").length;
    return { totalTarget, totalTerkumpul, totalTertunda, countLunas, countBelumLunas, persentase: totalTarget ? Math.round((totalTerkumpul / totalTarget) * 100) : 0 };
  };

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tagihan?bulan=${encodeURIComponent(bulan)}`, { cache: "no-store" });
      const data = await res.json();
      const rows = Array.isArray(data.tagihan) ? data.tagihan : [];
      setTagihan(rows);
      setStats(data.stats || computeStats(rows));
      setServerAvailable(true);
    } catch {
      setTagihan([]);
      setStats({ totalTarget: 0, totalTerkumpul: 0, totalTertunda: 0, countLunas: 0, countBelumLunas: 0, persentase: 0 });
      setServerAvailable(false);
    } finally {
      setLoading(false);
      localStorage.setItem("kas_rt_tagihan_refresh", String(Date.now()));
      window.dispatchEvent(new Event("storage"));
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/pengaturan");
      const data = await res.json();
      if (data.pengaturan) setSettings(data.pengaturan);
    } catch {}
  };

  useEffect(() => {
    fetchTagihan();
    fetchSettings();
  }, [bulan]);

  const visibleTagihan = tagihan.filter((item) => (!isWarga ? true : item.wargaNoRumah === user?.houseNumber || item.wargaNama === user?.name));
  const filtered = visibleTagihan.filter((item) => {
    const matchStatus = statusFilter === "Semua" || item.status === statusFilter;
    const matchSearch = !search || item.wargaNama?.toLowerCase().includes(search.toLowerCase()) || item.wargaNoRumah?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });
  const shownStats = isWarga ? computeStats(filtered) : computeStats(visibleTagihan);

  const exportCsv = () => {
    const headers = ["Nama,Rumah,Bulan,Kas RT,Sampah,Total,Status,Tanggal Bayar,Metode\n"];
    const rows = filtered.map((item) => `"${item.wargaNama}","${item.wargaNoRumah}","${item.bulan}","${item.nominalKas}","${item.nominalSampah}","${item.totalTagihan}","${item.status}","${item.tanggalBayar || ""}","${item.metode || ""}"`);
    const blob = new Blob([headers.concat(rows.join("\n")).join("")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tagihan-warga.csv";
    a.click();
  };

  const handleSendWaReminder = (item: any) => {
    const cleanPhone = (item.wargaNoHp || "").replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone;
    const msg = encodeURIComponent(`Yth. Bpk/Ibu ${item.wargaNama} (${item.wargaNoRumah}), menginfokan tagihan kas ${settings.namaRt} ${settings.blok} periode ${item.bulan} sebesar Rp ${item.totalTagihan.toLocaleString("id-ID")}. Pembayaran via transfer ${settings.namaBank} ${settings.noRekening} a.n ${settings.atasNama}. Terima kasih 🙏`);
    window.open(`https://api.whatsapp.com/send?phone=${waPhone}&text=${msg}`, "_blank");
  };

  const handleGenerateNextMonth = async () => {
    const nextBulan = prompt("Masukkan nama bulan tagihan baru (contoh: Mei 2026):", "Mei 2026");
    if (!nextBulan) return;
    try {
      const res = await fetch("/api/tagihan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bulan: nextBulan }) });
      const data = await res.json();
      alert(data.message || "Tagihan berhasil digenerate!");
      setBulan(nextBulan);
      fetchTagihan();
    } catch {
      alert("Gagal membuat tagihan");
    }
  };

  const handleSetStatus = async (item: any, nextStatus: "lunas" | "belum_lunas") => {
    try {
      const res = await fetch("/api/tagihan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: nextStatus, metode: nextStatus === "lunas" ? "Verifikasi Admin" : null, catatan: nextStatus === "lunas" ? "Diubah manual oleh admin menjadi lunas" : "Diubah manual oleh admin menjadi belum lunas" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status");
      fetchTagihan();
    } catch (e: any) {
      alert(e.message || "Gagal mengubah status tagihan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tagihan & Iuran Warga</h1>
          <p className="text-xs text-slate-500 mt-0.5">{isWarga ? "Riwayat dan status tagihan pribadi Anda" : `Manajemen tagihan rutin kas RT dan retribusi kebersihan warga ${settings.blok}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm transition-all"><Download className="w-4 h-4" /><span>Export CSV</span></button>
          {!isWarga && <button onClick={handleGenerateNextMonth} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"><Plus className="w-4 h-4" /><span>Generate Tagihan Baru</span></button>}
        </div>
      </div>

      {!isWarga && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-800 flex gap-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Cara input data warga yang sudah lunas dan belum lunas</p>
            <p className="mt-1">1) Klik <b>Generate Tagihan Baru</b> untuk membuat seluruh warga berstatus <b>belum lunas</b>. 2) Di kolom aksi tabel bawah gunakan tombol <b>Bayar</b> untuk memproses pembayaran, atau tombol <b>Set Lunas / Set Belum Lunas</b> untuk mengubah status secara manual oleh admin.</p>
          </div>
        </div>
      )}

      {!serverAvailable && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[12px] text-rose-700">
          Data tagihan real dari server/database tidak bisa dimuat saat ini. Pastikan endpoint API dan tabel tagihan di Neon sudah aktif.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target Penerimaan</span><p className="text-xl font-black text-slate-900 mt-1">Rp {shownStats.totalTarget?.toLocaleString("id-ID")}</p><p className="text-[11px] text-slate-400 mt-0.5">{isWarga ? "Akumulasi tagihan pribadi" : "Total tagihan warga"}</p></div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm"><div className="flex items-center justify-between"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dana Terkumpul</span><span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{shownStats.persentase}%</span></div><p className="text-xl font-black text-emerald-600 mt-1">Rp {shownStats.totalTerkumpul?.toLocaleString("id-ID")}</p><p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{shownStats.countLunas} tagihan lunas</p></div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tagihan Tertunda</span><p className="text-xl font-black text-rose-600 mt-1">Rp {shownStats.totalTertunda?.toLocaleString("id-ID")}</p><p className="text-[11px] text-rose-500 font-bold mt-0.5">{shownStats.countBelumLunas} tagihan belum lunas</p></div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Periode Bulan</span><select value={bulan} onChange={(e) => setBulan(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"><option value="Desember 2026">Desember 2026</option><option value="November 2026">November 2026</option><option value="Oktober 2026">Oktober 2026</option><option value="September 2026">September 2026</option><option value="Agustus 2026">Agustus 2026</option><option value="Juli 2026">Juli 2026</option><option value="Juni 2026">Juni 2026</option><option value="Mei 2026">Mei 2026</option><option value="April 2026">April 2026</option><option value="Maret 2026">Maret 2026</option><option value="Februari 2026">Februari 2026</option><option value="Januari 2026">Januari 2026</option></select></div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="text" placeholder={isWarga ? "Cari tagihan pribadi..." : "Cari nama warga, nomor rumah..."} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
          <div className="flex items-center gap-2 w-full md:w-auto"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"><option value="Semua">Semua Status</option><option value="lunas">Sudah Lunas</option><option value="belum_lunas">Belum Lunas</option></select></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="pb-3 pl-2">Warga & Rumah</th><th className="pb-3">Kas RT</th><th className="pb-3">Sampah</th><th className="pb-3">Total Tagihan</th><th className="pb-3">Status</th><th className="pb-3">Waktu Bayar / Metode</th><th className="pb-3 text-right pr-2">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Memuat data tagihan...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Tidak ada data tagihan real untuk periode ini. Klik <b>Generate Tagihan Baru</b> untuk membuat data baru di database.</td></tr>
              ) : filtered.map((item) => {
                const isLunas = item.status === "lunas";
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pl-2"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">{item.wargaNama ? item.wargaNama.substring(0, 2).toUpperCase() : "WR"}</div><div><p className="font-bold text-slate-800 leading-tight">{item.wargaNama}</p><span className="text-[11px] text-indigo-600 font-semibold">{item.wargaNoRumah}</span></div></div></td>
                    <td className="py-3.5 text-slate-600">Rp {item.nominalKas.toLocaleString("id-ID")}</td>
                    <td className="py-3.5 text-slate-600">Rp {item.nominalSampah.toLocaleString("id-ID")}</td>
                    <td className="py-3.5 font-black text-slate-900">Rp {item.totalTagihan.toLocaleString("id-ID")}</td>
                    <td className="py-3.5"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${isLunas ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>{isLunas ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-rose-600" />}<span>{isLunas ? "Lunas" : "Belum Lunas"}</span></span></td>
                    <td className="py-3.5 text-slate-500 text-[11px]">{isLunas ? <div><p className="font-semibold text-slate-700">{item.tanggalBayar || "Tercatat"}</p><p className="text-[10px] text-slate-400">{item.metode || "Transfer BCA"}</p></div> : <span className="text-slate-400 italic">Menunggu konfirmasi</span>}</td>
                    <td className="py-3.5 text-right pr-2"><div className="flex items-center justify-end gap-2 flex-wrap">{!isLunas ? <><button onClick={() => { setSelectedBill(item); setOpenBayarModal(true); }} className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-200 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /><span>Bayar</span></button>{!isWarga && <button onClick={() => handleSetStatus(item, "lunas")} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /><span>Set Lunas</span></button>}{!isWarga && <button onClick={() => handleSendWaReminder(item)} title="Kirim Pengingat WhatsApp" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors"><Send className="w-3.5 h-3.5" /></button>}</> : <><Link href={`/kwitansi?tagihanId=${item.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors"><Receipt className="w-3.5 h-3.5" /><span>Kwitansi</span></Link>{!isWarga && <button onClick={() => handleSetStatus(item, "belum_lunas")} className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs shadow-sm flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /><span>Set Belum Lunas</span></button>}</>}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalBayarIuran isOpen={openBayarModal} onClose={() => setOpenBayarModal(false)} onSuccess={fetchTagihan} item={selectedBill} />
    </div>
  );
}
