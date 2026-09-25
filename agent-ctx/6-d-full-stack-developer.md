# Task 6-d — Transaksi View Restructure (Monthly Ledger)

**Agent:** full-stack-developer
**Task:** Restructure Pemasukan/Pengeluaran views to group transactions per bulan (Januari…Desember) with year selector and collapse/expand.

## What I read first
- `/home/z/my-project/CONTEXT-FOR-AGENTS.md` (original + UPDATE ROUND 2) — conventions, hydration rule, shared components.
- `/home/z/my-project/worklog.md` — Tasks 1, 5-a..5-h, FINAL, plus prior 6-x restructure tasks.
- `/home/z/my-project/src/components/views/transaksi-view.tsx` (615 lines, original flat list).
- `/home/z/my-project/src/lib/format.ts` (confirmed `BULAN_ID` is exported).
- `/home/z/my-project/src/lib/constants.ts` (KATEGORI_PEMASUKAN/KATEGORI_PENGELUARAN).
- `/home/z/my-project/src/components/shell/top-header.tsx` + `app-shell.tsx` — confirmed top-header is `sticky top-0 z-30` and main has no scroll container → page scrolls at body level. Sticky month headers therefore need `top-16 z-20` to clear the global header.
- `/home/z/my-project/eslint.config.mjs` — confirmed `react-hooks/exhaustive-deps` is OFF, but `react-hooks/set-state-in-effect` (v6 rule from eslint-config-next) is ON. This is what trips up `useEffect(() => setX(...))`.

## File I edited (only this one)
`/home/z/my-project/src/components/views/transaksi-view.tsx` (540 lines, under ~550 guideline).

## Key changes
1. **PageHeader**: title "Pemasukan"/"Pengeluaran", TrendingUp/TrendingDown icon, "+ Catat {title}" action, description mentions "per bulan".
2. **4 StatCards** (Total, Jumlah Transaksi, Bulan Ini, Rata-rata): unchanged from original.
3. **Filter bar**: search + kategori select + **NEW year selector**. Mobile stacked, sm inline.
   - `yearOptions` built dynamically: union of `{year}` + (mounted? currentYear : nothing) + data years. Sorted desc.
4. **Monthly grouping (core change)**:
   - `groupByMonth(items, year)` helper — 12 slots, fill by `new Date(t.tanggal).getFullYear() === year`, sort items within month ascending by date, return only months with items (Jan→Des ascending).
   - Each month: `<div className="rounded-xl border bg-card">` containing sticky header + body + subtotal footer.
   - Sticky header bar: `sticky top-16 z-20 flex items-center gap-2 rounded-t-xl border-b bg-card/95 p-3 backdrop-blur` — chevron button (ChevronDown/ChevronRight, aria-expanded), Calendar icon (hidden on mobile), `{monthName} {year}` truncate, "{N} trx" Badge, colored total.
   - Body: mobile = MobileCardList; desktop = `<div className="overflow-x-auto scrollbar-thin"><DesktopTable/></div>`.
   - Subtotal footer: `rounded-b-xl border-t bg-muted/40 px-3 py-2` — "Total {Bulan}" + colored total.
   - Months with no transactions: skipped (cleaner than empty rows). If year has 0 matching transactions, separate EmptyState shown.
5. **Year total summary card** at the bottom: border-2 card (success/destructive tint by jenis), TrendingUp/Down in colored circle, "Total Tahun {year}" + "{yearCount} transaksi • {monthGroups.length} bulan aktif" subtitle, large 2xl bold colored total.
6. **CREATE Dialog**: Tanggal/Kategori/Keterangan/Nominal(rupiah input + formatRupiah preview + aria-invalid)/Sumber|Penerima/Metode/Bukti(file). postJSON + toast + resetForm + refetch. Validation gated by touched flag.
7. **DETAIL Dialog**: TrendBadge header + nominal card + 8-row dl + optional Bukti + footer Hapus (AlertDialog) + Cetak Kwitansi (toast.info).
8. **AlertDialog delete**: async handleDelete → deleteJSON(/api/transaksi/[id]) → toast + clear + refetch.
9. **Loading/Error/Empty states**: CardSkeletons, ErrorState with retry, EmptyState with create CTA (both general "no items" + year-specific "Tidak ada transaksi tahun {year}").

## Hydration rule (CRITICAL)
- NO `useEffect(() => setX(...))` anywhere in transaksi-view.tsx → avoids the `react-hooks/set-state-in-effect` lint error.
- `year` state: lazy initializer `useState(() => typeof window !== "undefined" ? new Date().getFullYear() : 2026)` — server-safe 2026, client uses actual current year.
- `tanggal` state in CreateDialog: lazy initializer `useState(() => typeof window !== "undefined" ? toISODate(new Date()) : "2026-01-01")`.
- "Bulan Ini" hint and `yearOptions` current-year add gated by `mounted` (from `useMounted()`).
- `resetForm` recomputes today inline (no useEffect).

## Mobile-first / zero overflow
- Mobile (<768px): card list (MobileCardList) per month, with kode truncated `truncate font-mono`, nominal column `shrink-0`.
- Desktop (≥768px): table per month wrapped in `overflow-x-auto scrollbar-thin` — only the table scrolls horizontally, never the body.
- kode column: `max-w-[120px] truncate` on desktop too.
- touch-target utility on all interactive elements.
- aria-labels on icon-only buttons (Eye, Trash2, X, chevron).
- Modals: `max-h-[90vh] overflow-y-auto`.

## Lint result
- `bun run lint` full project → 1 error total, in `/home/z/my-project/src/hooks/use-mounted.ts:8:19` (setState-in-effect inside the shared hook itself — PRE-EXISTING, NOT in my file, OUT of task scope).
- My file `transaksi-view.tsx`: 0 errors, 0 warnings.
- Initial draft used `useEffect(() => setYear(new Date().getFullYear()))` + `useEffect(() => setTanggal(toISODate(new Date())))` which triggered `react-hooks/set-state-in-effect` in my file — fixed by switching both to lazy state initializers.

## Dev server health
Pemasukan/Pengeluaran routes compile + render. `/api/transaksi?jenis=...&limit=200` returns 200. No compile errors in dev.log from my changes.

## No other files modified
Only `src/components/views/transaksi-view.tsx` was edited. All shared components, hooks (including use-mounted.ts), APIs, schema, page.tsx, app-shell, view-router untouched.
