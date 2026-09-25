"use client";

import { useAppStore } from "@/lib/store";
import { RT_INFO } from "@/lib/constants";
import { Icon } from "@/components/shared/icon";
import { openWhatsApp } from "@/components/shared";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Home, ReceiptText, Megaphone, MessageSquareWarning, User, Menu, Bell, Sparkles, Wallet, MapPin, Clock, Calendar } from "lucide-react";
import { formatRupiah, formatTanggalID, formatTanggalLengkapID, relativeTime } from "@/lib/format";
import { StatusBadge, StatCard, CardSkeleton, ErrorState, EmptyState, RupiahText } from "@/components/shared";
import { useState } from "react";
import { toast } from "sonner";

const WargaTagihan = dynamic(() => import("./warga-tabs/warga-tagihan").then((m) => m.WargaTagihan), { ssr: false });
const WargaPengumuman = dynamic(() => import("./warga-tabs/warga-pengumuman").then((m) => m.WargaPengumuman), { ssr: false });
const WargaAduan = dynamic(() => import("./warga-tabs/warga-aduan").then((m) => m.WargaAduan), { ssr: false });

interface WargaData {
  pengumuman: Array<{ id: string; judul: string; konten: string; kategori: string; prioritas: string; tanggal: string }>;
  kegiatan: Array<{ id: string; judul: string; kategori: string; tanggalMulai: string; lokasi?: string | null; status: string }>;
  pengaduan: Array<{ id: string; kode: string; judul: string; kategori: string; status: string; createdAt: string }>;
  tagihanSaya: Array<{ id: string; kode: string; jenis: string; periode: string; jumlah: number; denda: number; status: string; tanggalJatuhTempo: string }>;
  totalTunggakan: number;
  totalLunas: number;
  totalBelum: number;
  totalWarga: number;
  saldoRT: number;
}

export function WargaApp() {
  const { wargaTab, setWargaTab, setRole } = useAppStore();
  const { data, loading, error, refetch } = useFetch<WargaData>("/api/warga-dashboard");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 pt-safe backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">RT 002 Blok Mawar</p>
            <p className="truncate text-[11px] text-muted-foreground">Ciptaland Batam</p>
          </div>
          <button className="touch-target relative flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted" aria-label="Notifikasi">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-3 py-4 pb-24 sm:px-4">
        <div className="mx-auto w-full max-w-3xl">
          {wargaTab === "home" && <WargaHome data={data} loading={loading} error={error} refetch={refetch} />}
          {wargaTab === "tagihan" && <WargaTagihan data={data?.tagihanSaya} loading={loading} />}
          {wargaTab === "pengumuman" && <WargaPengumuman data={data?.pengumuman} loading={loading} />}
          {wargaTab === "aduan" && <WargaAduan data={data?.pengaduan} loading={loading} />}
          {wargaTab === "profil" && <WargaProfile data={data} onSwitchAdmin={() => setRole("admin")} />}
        </div>
      </main>

      {/* WhatsApp float button - above bottom nav */}
      <button
        onClick={() => openWhatsApp(RT_INFO.whatsappAdmin, "Halo Admin RT 002, saya ingin menyampaikan aduan/informasi.")}
        className="fixed right-3 bottom-20 z-30 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-[#1da851] sm:bottom-6"
        aria-label="WhatsApp Aduan Warga"
      >
        <MessageSquareWarning className="h-5 w-5" />
        <span className="hidden sm:inline">WhatsApp Aduan</span>
      </button>

      {/* Bottom Navigation - max 5 items */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background pb-safe-nav">
        <div className="mx-auto flex max-w-3xl items-stretch">
          <BottomTab tab="home" icon="Home" label="Home" />
          <BottomTab tab="tagihan" icon="ReceiptText" label="Tagihan" badge={data?.totalBelum} />
          <BottomTab tab="pengumuman" icon="Megaphone" label="Info" />
          <BottomTab tab="aduan" icon="MessageSquareWarning" label="Aduan" />
          <BottomTab tab="profil" icon="User" label="Profil" />
        </div>
      </nav>
    </div>
  );
}

function BottomTab({ tab, icon, label, badge }: { tab: "home" | "tagihan" | "pengumuman" | "aduan" | "profil"; icon: string; label: string; badge?: number }) {
  const { wargaTab, setWargaTab } = useAppStore();
  const active = wargaTab === tab;
  return (
    <button
      onClick={() => setWargaTab(tab)}
      className={cn("touch-target relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        <Icon name={icon} className="h-5 w-5" />
        {badge ? <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">{badge}</span> : null}
      </span>
      <span>{label}</span>
      {active && <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />}
    </button>
  );
}

function WargaHome({ data, loading, error, refetch }: { data: WargaData | null; loading: boolean; error: string | null; refetch: () => void }) {
  if (loading) return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><CardSkeleton className="h-28" /><CardSkeleton className="h-28" /></div>;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground">
        <p className="text-xs text-primary-foreground/80">Halo, Warga RT 002 👋</p>
        <h2 className="text-fluid-h3 mt-0.5 font-bold">Selamat datang di Sistem RT 002</h2>
        <p className="mt-1 text-xs text-primary-foreground/80">{formatTanggalLengkapID(new Date())}</p>
      </div>

      {/* My bills summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Tunggakan Saya" tone="warning" value={<RupiahText value={data.totalTunggakan} />} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Tagihan Lunas" tone="income" value={data.totalLunas} icon={<ReceiptText className="h-5 w-5" />} />
        <StatCard title="Belum Bayar" tone="expense" value={data.totalBelum} icon={<Clock className="h-5 w-5" />} />
      </div>

      {/* WhatsApp button full width */}
      <button
        onClick={() => openWhatsApp(RT_INFO.whatsappAdmin, "Halo Admin RT 002, saya ingin menyampaikan aduan/informasi.")}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#1da851]"
      >
        <MessageSquareWarning className="h-5 w-5" />
        WhatsApp Aduan Warga
      </button>

      {/* Announcements */}
      <div>
        <h3 className="mb-2 text-base font-semibold">Pengumuman Terbaru</h3>
        <div className="space-y-2">
          {data.pengumuman.slice(0, 3).map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug">{p.judul}</p>
                <StatusBadge status={p.prioritas === "mendesak" ? "telat" : p.prioritas === "penting" ? "proses" : "aktif"} />
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.konten}</p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{relativeTime(p.tanggal)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming activities */}
      <div>
        <h3 className="mb-2 text-base font-semibold">Kegiatan Mendatang</h3>
        <div className="space-y-2">
          {data.kegiatan.slice(0, 3).map((k) => (
            <div key={k.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{k.judul}</p>
                <p className="truncate text-xs text-muted-foreground">{formatTanggalID(k.tanggalMulai)} • {k.lokasi || "RT 002"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RT info card */}
      <div className="rounded-xl border bg-muted/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">RT 002 / RW 014 Blok Mawar</p>
        <p className="text-sm font-semibold">Perumahan Ciptaland Batam</p>
        <p className="mt-1 text-xs text-muted-foreground">{data.totalWarga} warga terdaftar • Saldo Kas RT {formatRupiah(data.saldoRT)}</p>
      </div>
    </div>
  );
}

function WargaProfile({ data, onSwitchAdmin }: { data: WargaData | null; onSwitchAdmin: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center rounded-xl border bg-card p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          <User className="h-10 w-10" />
        </div>
        <p className="mt-3 text-lg font-bold">Warga RT 002</p>
        <p className="text-sm text-muted-foreground">Blok Mawar, Ciptaland</p>
        <button className="mt-3 touch-target rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Edit Profil</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-success">{data?.totalLunas ?? 0}</p>
          <p className="text-xs text-muted-foreground">Tagihan Lunas</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-warning">{data?.totalBelum ?? 0}</p>
          <p className="text-xs text-muted-foreground">Belum Bayar</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-2 text-sm font-semibold">Kontak Pengurus RT</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Blok Mawar, Ciptaland, Batam</span></div>
          <button onClick={() => openWhatsApp(RT_INFO.whatsappAdmin, "Halo Admin RT 002")} className="flex w-full items-center gap-2 text-primary">
            <MessageSquareWarning className="h-4 w-4" /> WhatsApp Admin RT
          </button>
        </div>
      </div>

      <button onClick={onSwitchAdmin} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10">
        <Sparkles className="h-4 w-4" /> Beralih ke Mode Admin / Pengurus
      </button>
    </div>
  );
}
