"use client";

import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

/** Rupiah text that wraps gracefully instead of overflowing */
export function RupiahText({
  value,
  className,
  sign,
}: {
  value: number;
  className?: string;
  sign?: "pos" | "neg";
}) {
  const prefix = sign === "pos" ? "+" : sign === "neg" ? "−" : "";
  return (
    <span className={cn("tabular-nums ruiah-break", className)}>
      {prefix}
      {formatRupiah(value)}
    </span>
  );
}

/** Stat card for dashboard financial metrics */
export function StatCard({
  title,
  value,
  icon,
  tone = "default",
  hint,
  action,
  className,
}: {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "income" | "expense" | "warning" | "neutral";
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const toneClass = {
    default: "text-foreground",
    income: "text-success",
    expense: "text-destructive",
    warning: "text-warning",
    neutral: "text-muted-foreground",
  }[tone];
  const bgClass = {
    default: "bg-primary/10 text-primary",
    income: "bg-success/15 text-success",
    expense: "bg-destructive/10 text-destructive",
    warning: "bg-warning/20 text-warning",
    neutral: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <div className={cn("card-hover rounded-xl border bg-card p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{title}</p>
          <p className={cn("mt-1.5 text-lg font-bold leading-tight sm:text-2xl", toneClass)}>{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bgClass)}>
            {icon}
          </div>
        )}
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Page header with title, description, and actions */
export function PageHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-fluid-h3 font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Empty state with icon, message, and optional action */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-6 text-center sm:p-10">
      {icon && <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>}
      <p className="text-sm font-semibold sm:text-base">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground sm:text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Error state with retry */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
      <p className="text-sm font-semibold text-destructive">{message || "Data belum dapat dimuat."}</p>
      {onRetry && (
        <button onClick={onRetry} className="touch-target mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Coba Lagi
        </button>
      )}
    </div>
  );
}

/** Section title */
export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
      {action}
    </div>
  );
}

/** Income/Expense badge */
export function TrendBadge({ jenis }: { jenis: "pemasukan" | "pengeluaran" }) {
  return jenis === "pemasukan" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
      <TrendingUp className="h-3 w-3" /> Pemasukan
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
      <TrendingDown className="h-3 w-3" /> Pengeluaran
    </span>
  );
}

/** Status badge with color mapping */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    selesai: "bg-success/15 text-success",
    belum_bayar: "bg-warning/20 text-warning",
    telat: "bg-destructive/10 text-destructive",
    lunas: "bg-success/15 text-success",
    aktif: "bg-success/15 text-success",
    arsip: "bg-muted text-muted-foreground",
    baru: "bg-info/15 text-info",
    proses: "bg-warning/20 text-warning",
    ditolak: "bg-destructive/10 text-destructive",
    akan_datang: "bg-info/15 text-info",
    berlangsung: "bg-success/15 text-success",
    dibatalkan: "bg-destructive/10 text-destructive",
    tersedia: "bg-success/15 text-success",
    terjual: "bg-muted text-muted-foreground",
  };
  const label: Record<string, string> = {
    selesai: "Selesai",
    belum_bayar: "Belum Bayar",
    telat: "Telat",
    lunas: "Lunas",
    aktif: "Aktif",
    arsip: "Arsip",
    baru: "Baru",
    proses: "Diproses",
    ditolak: "Ditolak",
    akan_datang: "Akan Datang",
    berlangsung: "Berlangsung",
    dibatalkan: "Dibatalkan",
    tersedia: "Tersedia",
    terjual: "Terjual",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", map[status] || "bg-muted text-muted-foreground")}>
      {label[status] || status}
    </span>
  );
}

/** Skeleton card */
export function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl border bg-card p-4", className)} />;
}

/** Generic card wrapper */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border bg-card shadow-sm", className)} {...props} />;
}

/** WhatsApp helper - opens app/web with prefilled message */
export function openWhatsApp(number: string, message: string) {
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
