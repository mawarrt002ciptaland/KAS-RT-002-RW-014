"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Activity, Users, Globe, Eye, RefreshCw, ShieldAlert } from "lucide-react";

export default function TrafficPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>({ logs: [], summary: { totalVisits: 0, uniqueSessions: 0, wargaVisits: 0, umumVisits: 0, topPages: [] } });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/traffic", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData({ logs: [], summary: { totalVisits: 0, uniqueSessions: 0, wargaVisits: 0, umumVisits: 0, topPages: [] } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (user?.role === "warga") {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h1 className="text-xl font-black text-slate-800">Akses Ditolak</h1>
        <p className="text-sm text-slate-500 mt-1">Halaman trafik kunjungan hanya untuk Admin, Ketua RT, atau Bendahara.</p>
      </div>
    );
  }

  const summary = data.summary || { totalVisits: 0, uniqueSessions: 0, wargaVisits: 0, umumVisits: 0, topPages: [] };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Trafik Kunjungan Website</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring jumlah kunjungan warga maupun pengunjung umum pada website KAS RT</p>
        </div>
        <button onClick={load} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-200 transition-all self-start md:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>Muat Ulang Trafik</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><Eye className="w-4 h-4 text-indigo-600" /><span>Total Kunjungan</span></div><p className="text-3xl font-black text-slate-900 mt-2">{summary.totalVisits}</p></div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><Activity className="w-4 h-4 text-emerald-600" /><span>Sesi Unik</span></div><p className="text-3xl font-black text-slate-900 mt-2">{summary.uniqueSessions}</p></div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><Users className="w-4 h-4 text-blue-600" /><span>Kunjungan Warga</span></div><p className="text-3xl font-black text-slate-900 mt-2">{summary.wargaVisits}</p></div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><Globe className="w-4 h-4 text-amber-600" /><span>Kunjungan Umum</span></div><p className="text-3xl font-black text-slate-900 mt-2">{summary.umumVisits}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-black text-slate-800 mb-4">Halaman Paling Sering Dikunjungi</h2>
          <div className="space-y-3">
            {(summary.topPages || []).map((page: any, index: number) => (
              <div key={page.path + index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{page.path}</p>
                  <p className="text-[11px] text-slate-400">Urutan #{index + 1}</p>
                </div>
                <span className="text-sm font-black text-indigo-600">{page.visits}x</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <h2 className="text-base font-black text-slate-800 mb-4">Riwayat Trafik Terbaru</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Path</th>
                <th className="pb-3">Tipe Pengunjung</th>
                <th className="pb-3">Username</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Rumah</th>
                <th className="pb-3">Sesi</th>
                <th className="pb-3">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(data.logs || []).slice(0, 25).map((row: any, index: number) => (
                <tr key={row.id || `${row.sessionId}-${index}`} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 text-slate-800 font-bold">{row.path}</td>
                  <td className="py-3"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.visitorType === "warga" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{row.visitorType}</span></td>
                  <td className="py-3 text-slate-700">{row.username || "Pengunjung umum"}</td>
                  <td className="py-3 text-slate-500">{row.role || "-"}</td>
                  <td className="py-3 text-slate-500">{row.houseNumber || "-"}</td>
                  <td className="py-3 text-slate-500 font-mono">{String(row.sessionId).slice(0, 12)}...</td>
                  <td className="py-3 text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleString("id-ID") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
