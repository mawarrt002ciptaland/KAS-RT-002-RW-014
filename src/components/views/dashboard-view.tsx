"use client";

import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/lib/store";
import { formatRupiah, formatRupiahCompact, formatTanggalID, relativeTime } from "@/lib/format";
import { StatCard, SectionTitle, CardSkeleton, ErrorState, TrendBadge, StatusBadge, RupiahText, EmptyState } from "@/components/shared";
import { Icon } from "@/components/shared/icon";
import { Wallet, TrendingUp, TrendingDown, ReceiptText, ArrowRight, Plus, Megaphone, MessageSquareWarning, Users } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { toast } from "sonner";

// Lazy load charts for performance
const CashFlowChart = dynamic(() => import("./charts/cash-flow-chart").then((m) => m.CashFlowChart), { ssr: false, loading: () => <ChartSkeleton /> });
const ExpenseDonut = dynamic(() => import("./charts/expense-donut").then((m) => m.ExpenseDonut), { ssr: false, loading: () => <ChartSkeleton /> });

interface DashboardData {
  saldo: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  tagihanBelumLunas: number;
  tagihanTelat: number;
  recentTransaksi: Array<{ id: string; kode: string; jenis: string; tanggal: string; kategori: string; keterangan: string; nominal: number; penerima?: string | null; sumber?: string | null }>;
  cashFlow: Array<{ label: string; pemasukan: number; pengeluaran: number }>;
  expenseByCategory: Array<{ kategori: string; nominal: number; percent: number }>;
}

export function DashboardView() {
  const { data, loading, error, refetch } = useFetch<DashboardData>("/api/dashboard");
  const { setActiveView, setQuickOpen } = useAppStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <CardSkeleton className="h-80 lg:col-span-2" />
          <CardSkeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error || !data) return <ErrorState message={error || undefined} onRetry={refetch} />;

  const quickActions = [
    { icon: "TrendingUp", label: "Pemasukan", view: "pemasukan" as const, tone: "bg-success/15 text-success" },
    { icon: "TrendingDown", label: "Pengeluaran", view: "pengeluaran" as const, tone: "bg-destructive/10 text-destructive" },
    { icon: "Users", label: "Warga", view: "warga" as const, tone: "bg-primary/10 text-primary" },
    { icon: "ReceiptText", label: "Tagihan", view: "tagihan" as const, tone: "bg-info/15 text-info" },
    { icon: "Megaphone", label: "Pengumuman", view: "pengumuman" as const, tone: "bg-primary/10 text-primary" },
    { icon: "MessageSquareWarning", label: "Aduan", view: "pengaduan" as const, tone: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary-foreground/80">Selamat datang kembali</p>
            <h2 className="text-fluid-h3 mt-0.5 font-bold">Admin RT 002 Mawar</h2>
            <p className="mt-1 text-xs text-primary-foreground/80">Per {formatTanggalID(new Date())}</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/20 sm:flex">
            <Wallet className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Quick actions - mobile reachable */}
      <div>
        <SectionTitle title="Aksi Cepat" action={
          <button onClick={() => setQuickOpen(true)} className="text-xs font-medium text-primary lg:hidden">Lihat semua</button>
        } />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => setActiveView(a.view)}
              className="card-hover flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center hover:border-primary/40"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${a.tone}`}>
                <Icon name={a.icon} className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Financial cards - mobile 1 col */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Saldo Kas RT" tone="default" value={<RupiahText value={data.saldo} />} icon={<Wallet className="h-5 w-5" />} hint="Saldo saat ini" />
        <StatCard title="Total Pemasukan" tone="income" value={<RupiahText value={data.totalPemasukan} />} icon={<TrendingUp className="h-5 w-5" />} hint="Kumulatif tahun berjalan" />
        <StatCard title="Total Pengeluaran" tone="expense" value={<RupiahText value={data.totalPengeluaran} />} icon={<TrendingDown className="h-5 w-5" />} hint="Kumulatif tahun berjalan" />
        <StatCard title="Tagihan Tertunda" tone="warning" value={data.tagihanBelumLunas} icon={<ReceiptText className="h-5 w-5" />} hint={`${data.tagihanTelat} tagihan telat`} action={
          <button onClick={() => setActiveView("tagihan")} className="text-xs font-medium text-primary">Lihat detail →</button>
        } />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title="Arus Kas Bulanan" action={
            <span className="text-xs text-muted-foreground">12 bulan terakhir</span>
          } />
          <div className="rounded-xl border bg-card p-3 sm:p-4">
            <CashFlowChart data={data.cashFlow} isDark={isDark} />
          </div>
        </div>
        <div>
          <SectionTitle title="Pengeluaran per Kategori" />
          <div className="rounded-xl border bg-card p-3 sm:p-4">
            <ExpenseDonut data={data.expenseByCategory} isDark={isDark} total={data.totalPengeluaran} />
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <SectionTitle title="Transaksi Terbaru" action={
          <button onClick={() => setActiveView("pemasukan")} className="text-xs font-medium text-primary">Lihat semua</button>
        } />
        {data.recentTransaksi.length === 0 ? (
          <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="Belum ada transaksi" description="Mulai catat pemasukan atau pengeluaran kas RT." />
        ) : (
          <div className="grid gap-2">
            {data.recentTransaksi.map((t) => (
              <TransactionRow key={t.id} trx={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ trx }: { trx: DashboardData["recentTransaksi"][number] }) {
  const isPemasukan = trx.jenis === "pemasukan";
  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isPemasukan ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
        <Icon name={isPemasukan ? "TrendingUp" : "TrendingDown"} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{trx.keterangan}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate font-mono">{trx.kode}</span>
          <span className="shrink-0">•</span>
          <span className="shrink-0">{relativeTime(trx.tanggal)}</span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:hidden">{trx.kategori}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold tabular-nums ${isPemasukan ? "text-success" : "text-destructive"}`}>
          {isPemasukan ? "+" : "−"}{formatRupiah(trx.nominal)}
        </p>
        <p className="hidden truncate text-[11px] text-muted-foreground sm:block">{trx.kategori}</p>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="shimmer h-72 rounded-lg bg-muted" />;
}
