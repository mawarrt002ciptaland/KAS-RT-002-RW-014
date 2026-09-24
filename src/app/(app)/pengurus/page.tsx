"use client";

import React, { useEffect, useState } from "react";
import { Users, Award, Phone, Home, Calendar, ShieldCheck, Plus, Sparkles, History, UserCheck, ArrowRight, HeartHandshake } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media";

export default function PengurusPage() {
  const { user } = useAuth();
  const isWarga = user?.role === "warga";

  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPengurus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pengurus", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.pengurus)) {
        setPengurusList(data.pengurus);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengurus();
  }, []);

  const pengurusAktif = pengurusList.filter((p) => p.kategori === "aktif");
  const mantanKetua = pengurusList.filter((p) => p.kategori === "mantan_ketua");

  return (
    <div className="space-y-8">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-indigo-200 backdrop-blur-md border border-white/10">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Masa Tugas 5 Tahun · Periode 2026 - 2031</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Struktur Pengurus RT 002
          </h1>
          <p className="text-xs text-indigo-100 sm:text-sm font-normal leading-relaxed">
            Sistem Informasi & Administrasi Warga RT 002 RW 014 Perumahan Ciptaland Blok Mawar. Amanah mengabdi untuk pelayanan lingkungan yang transparan, guyub, dan rukun.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-2 text-xs backdrop-blur-md border border-white/10">
            <span className="text-indigo-200 block text-[10px] uppercase font-bold tracking-wider">SK Kepengurusan</span>
            <span className="font-bold text-white">RW 014 / SK-RT002 / 2026</span>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-2 text-xs backdrop-blur-md border border-white/10">
            <span className="text-indigo-200 block text-[10px] uppercase font-bold tracking-wider">Sekretariat</span>
            <span className="font-bold text-white">Blok Mawar M-01 & M-02</span>
          </div>

          {!isWarga && (
            <Link
              href="/pengaturan?tab=pengurus"
              className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-900 shadow-md transition-all hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" />
              <span>Kelola di Pengaturan</span>
            </Link>
          )}
        </div>
      </div>

      {/* Pengurus Aktif 2026 - 2031 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              <span>Struktur Pengurus Aktif (2026 - 2031)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jajaran pengurus harian dan seksi pelayanan warga Blok Mawar RT 002 RW 014
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            Masa Tugas 5 Tahun
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pengurusAktif.map((p) => {
              const foto = p.fotoUrl ? resolveMediaUrl(p.fotoUrl) : null;

              return (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-indigo-100 bg-slate-100 shadow-inner">
                      {foto ? (
                        <img
                          src={foto}
                          alt={p.nama}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-black text-indigo-600 text-lg bg-indigo-50">
                          {p.nama.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 border border-indigo-100 mb-1">
                        {p.jabatan}
                      </span>
                      <h3 className="truncate text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {p.nama}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                        <Home className="h-3 w-3 text-slate-400" />
                        <span>{p.noRumah || "Blok Mawar"}</span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    {p.catatan || "Melayani warga RT 002 RW 014 Perumahan Ciptaland."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Masa Tugas: 2026 - 2031
                    </span>

                    {p.noHp && (
                      <a
                        href={`https://api.whatsapp.com/send?phone=${p.noHp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Hubungi</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mantan Ketua RT Yang Pernah Menjabat */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <History className="h-5 w-5 text-amber-600" />
              <span>Daftar Ketua RT Sebelumnya</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Penghargaan atas jasa dan dedikasi kepemimpinan Ketua RT 002 pada periode-periode sebelumnya
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            Apresiasi & Sejarah RT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mantanKetua.map((m) => {
            const foto = m.fotoUrl ? resolveMediaUrl(m.fotoUrl) : null;

            return (
              <div
                key={m.id}
                className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-100 bg-amber-50 shadow-inner">
                    {foto ? (
                      <img src={foto} alt={m.nama} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-black text-amber-700 text-lg">
                        {m.nama.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200 mb-1">
                      {m.masaJabatan || m.periode}
                    </span>
                    <h3 className="truncate text-sm font-black text-slate-900">{m.nama}</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                      <Home className="h-3 w-3 text-slate-400" />
                      <span>{m.noRumah || "Blok Mawar"}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jasa & Program Unggulan</span>
                  <p>{m.catatan || "Memajukan kerukunan warga Blok Mawar RT 002 RW 014."}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
