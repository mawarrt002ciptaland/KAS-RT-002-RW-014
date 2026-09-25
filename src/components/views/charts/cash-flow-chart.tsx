"use client";

import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatRupiahCompact } from "@/lib/format";

export function CashFlowChart({ data, isDark }: { data: Array<{ label: string; pemasukan: number; pengeluaran: number }>; isDark?: boolean }) {
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
  const axisColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  return (
    <div className="w-full">
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={{ stroke: gridColor }} interval={0} />
            <YAxis tickFormatter={(v) => formatRupiahCompact(Number(v))} tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} width={64} />
            <Tooltip
              formatter={(value: number, name: string) => [formatRupiahCompact(Number(value)), name === "pemasukan" ? "Pemasukan" : "Pengeluaran"]}
              contentStyle={{ borderRadius: 12, border: "1px solid", fontSize: 12, padding: "8px 10px" }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(v) => (v === "pemasukan" ? "Pemasukan" : "Pengeluaran")} />
            <Bar dataKey="pemasukan" fill="oklch(0.6 0.13 150)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="pengeluaran" fill="oklch(0.6 0.2 25)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
