"use client";

import React, { useEffect, useState } from "react";
import { Phone, Home, Clock } from "lucide-react";

export default function PengurusPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pengurus", { cache: "no-store" });
        const j = await res.json();
        setList(Array.isArray(j.pengurus) ? j.pengurus : []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = list.filter((p) => String(p.isCurrent) === "true").sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  const past = list.filter((p) => String(p.isCurrent) !== "true").sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold text-slate-400 tracking-widest">SISTEM INFORMASI RT 002 • BLOK MAWAR · CIPTALAND</p>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Struktur Pengurus RT 002</h1>
        <p className="text-xs text-slate-500 mt-0.5">Masa tugas 5 tahun ke depan • Periode 2026 - 2031 • Dapat dilihat oleh warga</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-black text-slate-800">Pengurus Aktif • Periode 2026 - 2031 (5 Tahun)</h2>
        </div>
        {loading ? <p className="text-xs text-slate-400">Memuat...</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {current.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                <div className="h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {p.fotoUrl ? <img src={p.fotoUrl} alt={p.nama} className="w-full h-full object-cover" /> : <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-black">{(p.nama || "?").slice(0, 1)}</div>}
                </div>
                <div className="p-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white">{p.jabatan}</span>
                  <p className="text-sm font-black text-slate-800 mt-2">{p.nama}</p>
                  <p className="text-[11px] text-slate-500">Periode {p.periode}</p>
                  <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                    {p.noHp && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{p.noHp}</p>}
                    {p.noRumah && <p className="flex items-center gap-1.5"><Home className="w-3 h-3" />{p.noRumah}</p>}
                    {p.catatan && <p className="text-slate-500">{p.catatan}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-sm font-black text-slate-800 mb-1">Ketua RT Sebelumnya</h2>
        <p className="text-[11px] text-slate-500 mb-4">Riwayat ketua RT yang pernah menjabat</p>
        <div className="space-y-3">
          {past.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/60">
              {p.fotoUrl ? <img src={p.fotoUrl} alt={p.nama} className="w-12 h-12 rounded-full object-cover border" /> : <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">{(p.nama || "?").slice(0, 1)}</div>}
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{p.nama}</p>
                <p className="text-[11px] text-slate-500">{p.jabatan} • Periode {p.periode}</p>
              </div>
            </div>
          ))}
          {past.length === 0 && <p className="text-xs text-slate-400">Belum ada data mantan ketua.</p>}
        </div>
      </div>
    </div>
  );
}
