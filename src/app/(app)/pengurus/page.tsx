"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Phone,
  MessageCircle,
  Calendar,
  Building,
  Award,
  Users,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Wrench,
  Sparkles,
  MapPin,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { CiptalandLogo } from "@/components/CiptalandLogo";
import { resolveMediaUrl } from "@/lib/media";
import { useAuth } from "@/context/AuthContext";

export default function PengurusPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>({
    namaRt: "RT 002 RW 014",
    perumahan: "Perumahan Ciptaland",
    blok: "Blok Mawar",
    ketuaRt: "Eka Rista Yudhistira, ST.",
    noHpKetua: "+62 821-7129-9984",
    bendahara: "Neny Melsya, S.Sp.",
    noHpBendahara: "082173735449",
    namaBank: "Bank Nasional Indonesia (BNI)",
    noRekening: "0799703264",
    atasNama: "Neny Melsya",
  });

  useEffect(() => {
    fetch("/api/pengaturan")
      .then((res) => res.json())
      .then((data) => {
        if (data?.pengaturan) setSettings(data.pengaturan);
      })
      .catch(() => {});
  }, []);

  const cleanPhone = (phoneStr: string) => {
    const digits = (phoneStr || "").replace(/[^0-9]/g, "");
    return digits.startsWith("0") ? "62" + digits.slice(1) : digits;
  };

  // Struktur Pengurus Masa Tugas 5 Tahun ke Depan (2026 - 2031)
  const pengurusAktif = [
    {
      jabatan: "Ketua RT 002",
      nama: settings.ketuaRt || "Eka Rista Yudhistira, ST.",
      periode: "2026 – 2031 (Masa Tugas 5 Tahun)",
      noRumah: "Blok Mawar M-01",
      noHp: settings.noHpKetua || "+62 821-7129-9984",
      tupoksi: "Memimpin pelaksanaan tugas RT, memelihara kerukunan hidup warga, menjembatani hubungan antarwarga dengan RW/Kelurahan, dan menetapkan kebijakan lingkungan.",
      foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
      badgeColor: "bg-indigo-600 text-white",
      status: "Aktif Menjabat",
    },
    {
      jabatan: "Sekretaris RT 002",
      nama: "Asrizal",
      periode: "2026 – 2031 (Masa Tugas 5 Tahun)",
      noRumah: "Blok Mawar M-03",
      noHp: "082274449963",
      tupoksi: "Menyelenggarakan administrasi ketatausahaan, pendataan warga, pembuatan surat pengantar, dokumentasi rapat warga, dan arsip kelembagaan RT.",
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
      badgeColor: "bg-blue-600 text-white",
      status: "Aktif Menjabat",
    },
    {
      jabatan: "Bendahara RT 002",
      nama: settings.bendahara || "Neny Melsya, S.Sp.",
      periode: "2026 – 2031 (Masa Tugas 5 Tahun)",
      noRumah: "Blok Mawar M-02",
      noHp: settings.noHpBendahara || "082173735449",
      tupoksi: "Mengelola keuangan kas RT, penagihan iuran bulanan dan sampah, pencatatan transaksi masuk/keluar, penerbitan kwitansi sah, dan penyusunan laporan keuangan transparan.",
      foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
      badgeColor: "bg-emerald-600 text-white",
      status: "Aktif Menjabat",
    },
    {
      jabatan: "Koordinator Lapangan (Korlap) & Keamanan",
      nama: "Pak Eko & Pak Amad",
      periode: "2026 – 2031",
      noRumah: "Pos Jaga Keamanan",
      noHp: "081234567890",
      tupoksi: "Mengkoordinasikan pos keamanan gerbang, pengaturan portal RFID, patroli malam lingkungan, dan respon cepat ketertiban warga Blok Mawar.",
      foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
      badgeColor: "bg-amber-600 text-white",
      status: "Aktif Menjabat",
    },
    {
      jabatan: "Seksi Pembangunan & Fasilitas Umum (Fasum)",
      nama: "Surya & Tim Perlengkapan",
      periode: "2026 – 2031",
      noRumah: "Blok Mawar M-04",
      noHp: "081288880076",
      tupoksi: "Perawatan jalan lingkungan, pemeliharaan lampu jalan/fasum, pengadaan inventaris perlengkapan RT, dan penanganan sarana fisik.",
      foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80",
      badgeColor: "bg-purple-600 text-white",
      status: "Aktif Menjabat",
    },
    {
      jabatan: "Seksi Sosial, Humas & Kerohanian",
      nama: "Bayu Sodik Permana",
      periode: "2026 – 2031",
      noRumah: "Blok Mawar M-02",
      noHp: "081288395550",
      tupoksi: "Penyaluran dana sosial (dansos sakit/kemalangan), koordinasi pengajian warga, penyampaian informasi/edukasi digital, dan kerukunan tetangga.",
      foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80",
      badgeColor: "bg-rose-600 text-white",
      status: "Aktif Menjabat",
    },
  ];

  // Rekam Jejak Ketua RT Periode Sebelumnya
  const mantanKetuaRt = [
    {
      nama: "Bambang Sudik Pamarto",
      masaJabatan: "Periode 2021 – 2026",
      status: "Demisioner",
      prestasi: "Inisiasi portal otomatis gerbang perumahan, penataan awal jalan paving Blok Mawar, dan pembentukan sistem administrasi kas berkala.",
      foto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=80",
      noRumah: "Blok Mawar M-01",
    },
    {
      nama: "Bpk. Hendro Wijaya",
      masaJabatan: "Periode 2016 – 2021",
      status: "Demisioner",
      prestasi: "Pembangunan pos jaga keamanan RT 002, pemasangan instalasi listrik penerangan jalan umum pertama, dan pembentukan rukun kematian warga.",
      foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
      noRumah: "Blok Mawar M-04",
    },
    {
      nama: "Bpk. Dedi Kurniawan",
      masaJabatan: "Periode 2011 – 2016",
      status: "Demisioner",
      prestasi: "Perintisan pembentukan RT 002 RW 014 Perumahan Ciptaland masa awal penyerahan developer ke warga dan perapihan tapal batas lingkungan.",
      foto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80",
      noRumah: "Blok Mawar M-06",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <CiptalandLogo size={68} className="shadow-lg border-2 border-white/20 bg-white" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>LEMBAGA RUKUN TETANGGA RESMI</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Struktur Pengurus RT 002 RW 014
              </h1>
              <p className="text-xs md:text-sm text-indigo-200 mt-1">
                Blok Mawar · Perumahan Ciptaland · Masa Tugas 5 Tahun ke Depan (Periode 2026 – 2031)
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-xs space-y-1.5 self-start md:self-auto min-w-[240px]">
            <div className="flex items-center justify-between text-indigo-200">
              <span>Status Kepengurusan:</span>
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aktif Sah
              </span>
            </div>
            <div className="flex items-center justify-between text-indigo-200">
              <span>Masa Bakti:</span>
              <span className="font-bold text-white">2026 – 2031 (5 Th)</span>
            </div>
            <div className="flex items-center justify-between text-indigo-200">
              <span>Dasar Hukum:</span>
              <span className="font-bold text-white">SK RW 014 Ciptaland</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian 1: Pengurus Aktif (Masa Tugas 5 Tahun) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Pengurus Aktif Periode 2026 – 2031</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jajaran amanah pengurus RT 002 Blok Mawar yang siap melayani seluruh warga 24 jam
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start md:self-auto">
            Masa Tugas 5 Tahun ke Depan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pengurusAktif.map((p, idx) => {
            const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone(p.noHp)}&text=${encodeURIComponent(
              `Halo ${p.jabatan} (${p.nama}), saya warga Blok Mawar RT 002 ingin berkonsultasi / menyampaikan hal terkait lingkungan.`
            )}`;

            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header */}
                  <div className="p-5 flex items-center gap-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-100">
                    <div className="relative">
                      <img
                        src={p.foto}
                        alt={p.nama}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-slate-200"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mb-1 ${p.badgeColor}`}>
                        {p.jabatan}
                      </span>
                      <h3 className="text-sm font-black text-slate-800 leading-snug truncate">
                        {p.nama}
                      </h3>
                      <p className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span>{p.noRumah}</span>
                      </p>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Tugas Pokok & Fungsi (Tupoksi):
                      </span>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {p.tupoksi}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Masa Khidmat:</span>
                      <span className="font-bold text-slate-700">{p.periode}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hubungi via WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bagian 2: Rekam Jejak Ketua RT Yang Pernah Menjabat Sebelumnya */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Daftar Ketua RT yang Pernah Menjabat Sebelumnya</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Apresiasi dan rekam jejak dedikasi para mantan Ketua RT 002 Blok Mawar dari masa ke masa
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start md:self-auto">
            Rekam Jejak Kepemimpinan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mantanKetuaRt.map((m, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 hover:border-amber-300 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={m.foto}
                  alt={m.nama}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 grayscale contrast-125"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block mb-0.5">
                    {m.status}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">
                    {m.nama}
                  </h3>
                  <p className="text-[11px] font-black text-amber-600 mt-0.5">
                    {m.masaJabatan}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Kontribusi & Pencapaian Penting:
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {m.prestasi}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>Alamat Domisili:</span>
                <span className="font-semibold text-slate-600">{m.noRumah}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nilai Kepengurusan & Pelayanan */}
      <div className="bg-slate-100/80 rounded-3xl p-6 border border-slate-200/80 text-xs space-y-2 text-slate-600">
        <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Komitmen Pelayanan Pengurus RT 002 RW 014 Blok Mawar (2026 – 2031)</span>
        </h4>
        <p className="leading-relaxed">
          Seluruh pengurus berkomitmen menjaga transparansi keuangan secara realtime melalui Sistem Informasi RT 002,
          mengutamakan gotong royong musyawarah mufakat, menjaga kenyamanan serta keamanan warga, dan melayani urusan administrasi secara cepat dan tanpa dipungut biaya liar.
        </p>
      </div>
    </div>
  );
}
