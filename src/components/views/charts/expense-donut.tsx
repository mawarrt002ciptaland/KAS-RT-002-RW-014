"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";

const COLORS = [
  "oklch(0.55 0.13 160)",
  "oklch(0.65 0.14 145)",
  "oklch(0.75 0.15 70)",
  "oklch(0.6 0.18 30)",
  "oklch(0.55 0.15 300)",
  "oklch(0.6 0.1 230)",
];

export function ExpenseDonut({
  data,
  total,
}: {
  data: Array<{ kategori: string; nominal: number; percent: number }>;
  isDark?: boolean;
  total: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Belum ada data pengeluaran
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-52 w-full sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="nominal" nameKey="kategori" cx="50%" cy="50%" innerRadius="62%" outerRadius="85%" paddingAngle={2} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [formatRupiah(Number(value)), name]}
              contentStyle={{ borderRadius: 12, border: "1px solid", fontSize: 12, padding: "8px 10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-sm font-bold tabular-nums">{formatRupiahCompact(total)}</p>
        </div>
      </div>

      <div className="mt-3 w-full space-y-2">
        {data.map((d, i) => (
          <div key={d.kategori} className="flex items-center gap-2.5 rounded-lg border bg-card/50 p-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.kategori}</span>
            <span className="text-right">
              <span className="block text-sm font-semibold tabular-nums">{formatRupiah(d.nominal)}</span>
              <span className="block text-[11px] text-muted-foreground">{d.percent}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
