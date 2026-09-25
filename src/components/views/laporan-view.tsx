"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PageHeader,
  SectionTitle,
  StatCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  CardSkeleton,
  RupiahText,
  Card,
} from "@/components/shared";
import {
  formatRupiah,
  formatRupiahCompact,
  formatTanggalID,
  toISODate,
  shortMonthLabel,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Printer,
  Filter,
  Calendar,
  ReceiptText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";

interface Transaksi {
  id: string;
  kode: string;
  jenis: string;
  tanggal: string;
  kategori: string;
  keterangan: string;
  nominal: number;
  penerima?: string | null;
  sumber?: string | null;
}
interface PerKategori {
  kategori: string;
  pemasukan: number;
  pengeluaran: number;
  count: number;
}
interface PerBulan {
  periode: string;
  pemasukan: number;
  pengeluaran: number;
}
interface TagihanStat {
  status: string;
  _count: number;
  _sum: { jumlah: number | null };
}
interface LaporanData {
  periode: { dari: string | null; sampai: string | null };
  transaksi: Transaksi[];
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  jumlahTransaksi: number;
  perKategori: PerKategori[];
  perBulan: PerBulan[];
  tagihanStats: TagihanStat[];
}

const CAT_COLORS = [
  "oklch(0.55 0.13 160)",
  "oklch(0.65 0.14 145)",
  "oklch(0.75 0.15 70)",
  "oklch(0.6 0.18 30)",
  "oklch(0.55 0.15 300)",
  "oklch(0.6 0.1 230)",
  "oklch(0.7 0.12 200)",
  "oklch(0.5 0.16 80)",
];

export function LaporanView() {
  const isMobile = useIsMobile();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Default period: first day of current year to today
  const now = new Date();
  const startDefault = useMemo(
    () => toISODate(new Date(new Date().getFullYear(), 0, 1)),
    []
  );
  const endDefault = useMemo(() => toISODate(new Date()), []);

  const [dari, setDari] = useState(startDefault);
  const [sampai, setSampai] = useState(endDefault);
  const [jenis, setJenis] = useState<string>("all");
  const [applied, setApplied] = useState({
    dari: startDefault,
    sampai: endDefault,
    jenis: "all",
  });

  const query = new URLSearchParams();
  query.set("dari", applied.dari);
  query.set("sampai", applied.sampai);
  if (applied.jenis !== "all") query.set("jenis", applied.jenis);

  const { data, loading, error, refetch } = useFetch<LaporanData>(
    `/api/laporan?${query.toString()}`
  );

  function applyFilter() {
    if (!dari || !sampai) return toast.error("Rentang tanggal tidak valid");
    if (new Date(dari) > new Date(sampai))
      return toast.error("Tanggal mulai harus sebelum tanggal akhir");
    setApplied({ dari, sampai, jenis });
    toast.success("Filter diterapkan");
  }

  function exportCSV() {
    if (!data || data.transaksi.length === 0)
      return toast.error("Tidak ada data untuk diekspor");
    const rows = [
      ["Kode", "Tanggal", "Jenis", "Kategori", "Keterangan", "Nominal", "Penerima"],
      ...data.transaksi.map((t) => [
        t.kode,
        toISODate(t.tanggal),
        t.jenis,
        t.kategori,
        `"${(t.keterangan || "").replace(/"/g, '""')}"`,
        String(t.nominal),
        t.penerima || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => String(c)).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-rt002-${applied.dari}-${applied.sampai}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil diunduh");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan"
        description="Laporan keuangan & statistik RT 002"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="touch-target"
            >
              <Printer className="h-4 w-4" /> Cetak
            </Button>
            <Button
              onClick={exportCSV}
              disabled={!data || data.transaksi.length === 0}
              className="touch-target"
            >
              <Download className="h-4 w-4" /> Unduh CSV
            </Button>
          </div>
        }
      />

      {/* Filter bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5 sm:min-w-[160px]">
            <Label htmlFor="lap-dari" className="text-xs">
              <Calendar className="mr-1 inline h-3 w-3" /> Dari
            </Label>
            <Input
              id="lap-dari"
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              className="touch-target"
            />
          </div>
          <div className="space-y-1.5 sm:min-w-[160px]">
            <Label htmlFor="lap-sampai" className="text-xs">
              <Calendar className="mr-1 inline h-3 w-3" /> Sampai
            </Label>
            <Input
              id="lap-sampai"
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              className="touch-target"
            />
          </div>
          <div className="space-y-1.5 sm:min-w-[160px]">
            <Label className="text-xs">
              <Filter className="mr-1 inline h-3 w-3" /> Jenis
            </Label>
            <Select value={jenis} onValueChange={setJenis}>
              <SelectTrigger className="touch-target w-full">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="pemasukan">Pemasukan</SelectItem>
                <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={applyFilter} className="touch-target sm:ml-auto">
            <Filter className="h-4 w-4" /> Terapkan
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CardSkeleton className="h-80" />
            <CardSkeleton className="h-80" />
          </div>
        </div>
      ) : error || !data ? (
        <ErrorState message={error || undefined} onRetry={refetch} />
      ) : (
        <LaporanBody data={data} isMobile={isMobile} isDark={isDark} />
      )}
    </div>
  );
}

function LaporanBody({
  data,
  isMobile,
  isDark,
}: {
  data: LaporanData;
  isMobile: boolean;
  isDark: boolean;
}) {
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
  const axisColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  const bulanData = data.perBulan.map((b) => ({
    label: shortMonthLabel(b.periode + "-01"),
    pemasukan: b.pemasukan,
    pengeluaran: b.pengeluaran,
  }));
  const katData = data.perKategori
    .map((k) => ({
      kategori: k.kategori,
      nominal: Math.max(k.pemasukan, k.pengeluaran),
      pemasukan: k.pemasukan,
      pengeluaran: k.pengeluaran,
      count: k.count,
    }))
    .sort((a, b) => b.nominal - a.nominal);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Pemasukan"
          tone="income"
          value={<RupiahText value={data.totalPemasukan} />}
          icon={<TrendingUp className="h-5 w-5" />}
          hint="Periode terpilih"
        />
        <StatCard
          title="Total Pengeluaran"
          tone="expense"
          value={<RupiahText value={data.totalPengeluaran} />}
          icon={<TrendingDown className="h-5 w-5" />}
          hint="Periode terpilih"
        />
        <StatCard
          title="Saldo"
          tone="default"
          value={<RupiahText value={data.saldo} />}
          icon={<Wallet className="h-5 w-5" />}
          hint="Pemasukan − Pengeluaran"
        />
        <StatCard
          title="Jumlah Transaksi"
          tone="neutral"
          value={data.jumlahTransaksi}
          icon={<ReceiptText className="h-5 w-5" />}
          hint={`${data.perBulan.length} bulan`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <SectionTitle title="Arus Kas per Bulan" />
          <Card className="p-3 sm:p-4">
            {bulanData.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bulanData}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: axisColor }}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                      interval={0}
                    />
                    <YAxis
                      tickFormatter={(v) => formatRupiahCompact(Number(v))}
                      tick={{ fontSize: 10, fill: axisColor }}
                      tickLine={false}
                      axisLine={false}
                      width={64}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatRupiah(Number(value)),
                        name === "pemasukan" ? "Pemasukan" : "Pengeluaran",
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid",
                        fontSize: 12,
                        padding: "8px 10px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(v) =>
                        v === "pemasukan" ? "Pemasukan" : "Pengeluaran"
                      }
                    />
                    <Bar
                      dataKey="pemasukan"
                      fill="oklch(0.6 0.13 150)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="pengeluaran"
                      fill="oklch(0.6 0.2 25)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <div>
          <SectionTitle title="Pengeluaran per Kategori" />
          <Card className="p-3 sm:p-4">
            {katData.length === 0 ? (
              <EmptyChart />
            ) : isMobile ? (
              <div className="space-y-2">
                {katData.map((k, i) => (
                  <div
                    key={k.kategori}
                    className="flex items-center gap-2.5 rounded-lg border bg-card/50 p-2"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {k.kategori}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {k.count} transaksi
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatRupiah(k.nominal)}
                      </p>
                      {k.pemasukan > 0 && k.pengeluaran > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          +{formatRupiahCompact(k.pemasukan)} / −
                          {formatRupiahCompact(k.pengeluaran)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={katData}
                    layout="vertical"
                    margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatRupiahCompact(Number(v))}
                      tick={{ fontSize: 10, fill: axisColor }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="kategori"
                      tick={{ fontSize: 11, fill: axisColor }}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                      tickFormatter={(v: string) =>
                        v.length > 16 ? v.slice(0, 15) + "…" : v
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => formatRupiah(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid",
                        fontSize: 12,
                        padding: "8px 10px",
                      }}
                    />
                    <Bar dataKey="nominal" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {katData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CAT_COLORS[i % CAT_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Tagihan stats */}
      <div>
        <SectionTitle title="Statistik Tagihan" />
        <Card className="p-3 sm:p-4">
          {data.tagihanStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada tagihan.</p>
          ) : isMobile ? (
            <div className="grid grid-cols-3 gap-2">
              {data.tagihanStats.map((s) => (
                <TagihanStatItem key={s.status} stat={s} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.tagihanStats.map((s) => (
                <TagihanStatItem key={s.status} stat={s} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Transaksi list */}
      <div>
        <SectionTitle
          title="Transaksi Periode"
          action={
            <span className="text-xs text-muted-foreground">
              {data.transaksi.length} entri
            </span>
          }
        />
        {data.transaksi.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title="Tidak ada transaksi"
            description="Tidak ada transaksi pada rentang tanggal & filter ini."
          />
        ) : isMobile ? (
          <div className="grid gap-2">
            {data.transaksi.map((t) => (
              <TransaksiCard key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transaksi.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">
                      {t.kode}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatTanggalID(t.tanggal)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.jenis === "pemasukan" ? "lunas" : "telat"} />
                      <span className="sr-only">{t.jenis}</span>
                    </TableCell>
                    <TableCell className="text-sm">{t.kategori}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
                      {t.keterangan}
                    </TableCell>
                    <TableCell
                      className={
                        "text-right font-semibold tabular-nums " +
                        (t.jenis === "pemasukan"
                          ? "text-success"
                          : "text-destructive")
                      }
                    >
                      {t.jenis === "pemasukan" ? "+" : "−"}
                      {formatRupiah(t.nominal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

function TagihanStatItem({ stat }: { stat: TagihanStat }) {
  const sum = stat._sum?.jumlah ?? 0;
  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <StatusBadge status={stat.status} />
        <span className="text-lg font-bold tabular-nums">{stat._count}</span>
      </div>
      <p className="text-xs text-muted-foreground">Total nilai</p>
      <p className="text-sm font-semibold tabular-nums">{formatRupiah(sum)}</p>
    </div>
  );
}

function TransaksiCard({ t }: { t: Transaksi }) {
  const isIn = t.jenis === "pemasukan";
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <span
          className={
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
            (isIn
              ? "bg-success/15 text-success"
              : "bg-destructive/10 text-destructive")
          }
        >
          {isIn ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{t.keterangan}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono">{t.kode}</span>
            <span>•</span>
            <span>{formatTanggalID(t.tanggal)}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {t.kategori}
          </p>
        </div>
        <p
          className={
            "shrink-0 text-right text-sm font-bold tabular-nums " +
            (isIn ? "text-success" : "text-destructive")
          }
        >
          {isIn ? "+" : "−"}
          {formatRupiah(t.nominal)}
        </p>
      </div>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      Belum ada data
    </div>
  );
}
