"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMounted } from "@/hooks/use-mounted";
import {
  PageHeader, StatCard, SectionTitle, EmptyState, ErrorState, CardSkeleton, Card,
} from "@/components/shared";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import {
  Globe, Eye, Users, TrendingUp, Smartphone, Monitor, Tablet,
} from "lucide-react";

interface TrafikData {
  totalViews: number;
  totalVisitors: number;
  totalSessions: number;
  daily: Array<{ date: string; label: string; views: number; visitors: number; sessions: number }>;
  deviceBreakdown: Array<{ device: string; views: number; visitors: number }>;
  topReferrers: Array<{ name: string; visitors: number }>;
  topPages: Array<{ page: string; views: number }>;
}

const PERIODS = [
  { value: 7, label: "7 hari" },
  { value: 30, label: "30 hari" },
  { value: 90, label: "90 hari" },
] as const;

const DEVICE_COLORS: Record<string, string> = {
  mobile: "oklch(0.55 0.13 160)",
  desktop: "oklch(0.6 0.16 70)",
  tablet: "oklch(0.55 0.15 300)",
};
const FALLBACK_COLORS = ["oklch(0.55 0.13 160)", "oklch(0.6 0.16 70)", "oklch(0.55 0.15 300)", "oklch(0.65 0.14 145)"];

function formatNum(n: number) {
  return Number(n || 0).toLocaleString("id-ID");
}

function deviceMeta(device: string) {
  const d = device.toLowerCase();
  if (d.includes("mobile") || d.includes("phone")) return { icon: Smartphone, label: "Mobile" };
  if (d.includes("tablet") || d.includes("ipad")) return { icon: Tablet, label: "Tablet" };
  return { icon: Monitor, label: "Desktop" };
}

export function TrafikView() {
  const isMobile = useIsMobile();
  const [days, setDays] = useState<number>(30);
  const url = useMemo(() => `/api/trafik?days=${days}`, [days]);
  const { data, loading, error, refetch } = useFetch<TrafikData>(url);
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
  const axisColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Trafik Website" description="Statistik pengunjung website" icon={<Globe className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}
        </div>
        <CardSkeleton className="h-56 sm:h-72" />
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton className="h-56 sm:h-72" />
          <CardSkeleton className="h-56 sm:h-72" />
        </div>
      </div>
    );
  }

  if (error || !data) return <ErrorState message={error || undefined} onRetry={refetch} />;

  const avgPerDay = days > 0 ? Math.round(data.totalViews / days) : 0;
  const hasData = data.totalViews > 0 || data.daily.length > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Trafik Website"
        description="Statistik pengunjung website RT 002"
        icon={<Globe className="h-5 w-5" />}
        actions={
          <div className="flex gap-1 rounded-lg border bg-card p-1" role="tablist" aria-label="Pilih periode">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                role="tab"
                aria-selected={days === p.value}
                className={`touch-target rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  days === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Views" value={formatNum(data.totalViews)} icon={<Eye className="h-5 w-5" />} tone="default" hint={`${days} hari terakhir`} />
        <StatCard title="Total Visitors" value={formatNum(data.totalVisitors)} icon={<Users className="h-5 w-5" />} tone="income" hint="Pengunjung unik" />
        <StatCard title="Total Sessions" value={formatNum(data.totalSessions)} icon={<TrendingUp className="h-5 w-5" />} tone="warning" hint="Total sesi" />
        <StatCard title="Rata-rata/Hari" value={formatNum(avgPerDay)} icon={<Globe className="h-5 w-5" />} tone="neutral" hint="Views per hari" />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<Globe className="h-6 w-6" />}
          title="Belum ada data trafik"
          description="Data pengunjung website belum tersedia untuk periode ini."
        />
      ) : (
        <>
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Trafik Harian" />
            <div className="h-56 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trafikViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.6 0.13 160)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="oklch(0.6 0.13 160)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={{ stroke: gridColor }} minTickGap={16} />
                  <YAxis tickFormatter={(v) => formatNum(Number(v))} tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatNum(Number(value)), name === "views" ? "Views" : name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid", fontSize: 12, padding: "8px 10px" }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="views" stroke="oklch(0.6 0.13 160)" strokeWidth={2} fill="url(#trafikViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <SectionTitle title="Perangkat" />
              <DeviceDonut devices={data.deviceBreakdown} isMobile={isMobile} />
            </Card>

            <Card className="p-4 sm:p-5">
              <SectionTitle title="Sumber Trafik" />
              {data.topReferrers.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-muted-foreground sm:h-72">
                  Belum ada sumber trafik
                </div>
              ) : (
                <div className="h-56 w-full sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.topReferrers} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => formatNum(Number(v))} tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} width={88} />
                      <Tooltip
                        formatter={(value: number) => [formatNum(Number(value)), "Visitors"]}
                        contentStyle={{ borderRadius: 12, border: "1px solid", fontSize: 12, padding: "8px 10px" }}
                      />
                      <Bar dataKey="visitors" fill="oklch(0.6 0.16 70)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <Card className="p-4 sm:p-5">
            <SectionTitle title="Halaman Terpopuler" />
            {data.topPages.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data halaman.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.topPages.slice(0, 10).map((p, i) => (
                  <div key={p.page + i} className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="truncate text-sm font-medium">{p.page}</span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatNum(p.views)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function DeviceDonut({
  devices,
  isMobile,
}: {
  devices: Array<{ device: string; views: number; visitors: number }>;
  isMobile: boolean;
}) {
  const total = devices.reduce((s, d) => s + d.visitors, 0);
  if (devices.length === 0 || total === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground sm:h-72">Belum ada data perangkat</div>;
  }
  const donutH = isMobile ? "h-44" : "h-52";
  return (
    <div className="flex flex-col">
      <div className={`relative ${donutH} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={devices} dataKey="visitors" nameKey="device" cx="50%" cy="50%" innerRadius="62%" outerRadius="85%" paddingAngle={2} stroke="none">
              {devices.map((d, i) => (
                <Cell key={i} fill={DEVICE_COLORS[d.device.toLowerCase()] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [formatNum(Number(value)) + " visitors", name]}
              contentStyle={{ borderRadius: 12, border: "1px solid", fontSize: 12, padding: "8px 10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-sm font-bold tabular-nums">{formatNum(total)}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {devices.map((d, i) => {
          const meta = deviceMeta(d.device);
          const Icon = meta.icon;
          const percent = total > 0 ? Math.round((d.visitors / total) * 100) : 0;
          return (
            <div key={d.device} className="flex items-center gap-2.5 rounded-lg border bg-card/50 p-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: (DEVICE_COLORS[d.device.toLowerCase()] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]) + "22" }}
              >
                <Icon className="h-3.5 w-3.5 text-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="text-[11px] text-muted-foreground">{percent}% • {formatNum(d.views)} views</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatNum(d.visitors)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
