# Task 7-a — Fix Kwitansi View

**Agent**: full-stack-developer
**Task ID**: 7-a
**File edited**: `/home/z/my-project/src/components/views/kwitansi-view.tsx` (883 lines, `"use client"`, `export function KwitansiView()`)

## Context Read
- CONTEXT-FOR-AGENTS.md (original + UPDATE ROUND 2 + UPDATE ROUND 3) — followed STRICTLY the hydration rule (useMounted for any `new Date()` in render) and the print-to-file pattern (both: `@media print` stylesheet that hides everything except `.print-receipt` + `window.print()` for "Cetak", AND standalone HTML Blob download for "Unduh").
- worklog.md (Tasks 1, 5-a..5-h, 6-a..6-e, ROUND2-FINAL, HYDRATION-FIX-2).
- Existing kwitansi-view.tsx (424 lines — only had `window.print()` for "Unduh PDF" → no actual file produced, hence "File kwitansi tidak ada").
- /api/kwitansi/route.ts (GET returns `{ items, brand }`, POST accepts `{ transaksiId?, nominal, penerima?, pembayar?, keterangan? }`).

## Fixes Implemented

### Fix 1 — Real file download (root cause of "File kwitansi tidak ada")
- `downloadReceiptHtml(k, brand)` helper builds a FULL standalone HTML string with its own inline `<style>` (green theme: `#10b981` primary, `#047857` dark), RT 002 letterhead, all fields, embedded QRIS image as `<img src="${abs(url)}">` where `abs()` converts `/uploads/x.png` → `window.location.origin + url`, leaves http(s) URLs alone; bank info fallback; bendahara signature block; green footer strip with generated timestamp.
- Triggers: `new Blob([html], { type: "text/html;charset=utf-8" })` → `URL.createObjectURL` → anchor with `download = Kwitansi-${k.kode}.html` → `a.click()` → cleanup. **Always produces a downloadable file.**
- Wired "Unduh" buttons in: desktop table (per-row icon), mobile card (sm button), detail dialog footer. Each → `toast.success("File Kwitansi-{kode}.html diunduh")`.
- "Cetak" button still calls `window.print()` (browser "Save as PDF") with `@media print` stylesheet injected at the bottom of `KwitansiView` that hides `body *` and shows only `.print-receipt` (the receipt container has `className="print-receipt"`) — action buttons row has `className="no-print"`.

### Fix 2 — Polished receipt sheet (`ReceiptDetail`)
- Green letterhead bar: eyebrow "Sistem Informasi RT 002" + large "KWITANSI" title + subtitle "RT 002 / RW 014 Blok Mawar Perumahan Ciptaland Batam" + green horizontal rule.
- Two-column meta row: left "No. Kwitansi" (mono, bold) + right "Tanggal" (formatTanggalLengkapID).
- "Telah terima dari:" + pembayar (text-base/lg, font-bold).
- "Uang sejumlah:" + green-bordered box (`border-2 border-primary/30 bg-primary/5`) containing **terbilang** (italic) + below it the nominal in `text-2xl/3xl font-extrabold text-success` via formatRupiah.
- "Untuk pembayaran:" + keterangan (whitespace-pre-wrap).
- Two-column footer:
  - Left = QRIS block (brand.qrisImage: Image 140×140 + caption "Scan QRIS untuk pembayaran" with QrCode icon; else brand.qrisUrl: dashed placeholder + link; else show bank info: Bank/No. Rek/Atas nama).
  - Right = signature block: "Diterima oleh:" + brand.namaBendahara + 56px-tall ttdUrl image (or empty space) + signature line + "Bendahara RT 002" caption.
- Green footer strip (`bg-primary`): "Kwitansi ini sah tanpa tanda tangan dan stempel bila menggunakan cap RT" (Stamp icon prefix) + generated timestamp `formatTanggalLengkapID(new Date())` — gated with `useMounted()`.
- Buttons in `.no-print` footer: Tutup / Share / Unduh / Cetak.

### Preserved / extended
- `terbilang(n)` Indonesian helper — extended from 0..miliar to 0..~999 triliun (`TRILYUN = 1_000_000_000_000`).
- LIST view: mobile cards + desktop table, with per-row Lihat/Cetak/Share/Unduh action buttons.
- CREATE Dialog: Nominal (rupiah input + live formatRupiah + live terbilang preview), Pembayar, Penerima (default = brand.namaBendahara), Keterangan. `postJSON` + `toast.success("Kwitansi {kode} dibuat")` + refetch.
- StatCards: Total Kwitansi (FileText), Nilai Total (income, Wallet, RupiahText totalNominal), Hari Ini (neutral, Calendar, todayCount).
- Hydration: `todayCount` gated behind `mounted`; ReceiptDetail's bottom strip timestamp `{mounted ? formatTanggalLengkapID(new Date()) : "\u00A0"}`.
- Loading: 4× CardSkeleton (h-24). Error: ErrorState with onRetry. Empty: EmptyState + create CTA.

## Imports used
useFetch, postJSON; useMounted; useIsMobile; PageHeader/StatCard/SectionTitle/EmptyState/ErrorState/CardSkeleton/RupiahText/Card from @/components/shared; formatRupiah/formatTanggalID/formatTanggalLengkapID/parseRupiahInput/toThousandInput from @/lib/format; RT_INFO from @/lib/constants; Image from "next/image" (with `unoptimized`); shadcn Dialog/Button/Input/Label/Textarea/Badge/Table; toast from "sonner"; lucide FileText/Plus/Eye/Printer/Share2/Download/Wallet/Calendar/QrCode/Stamp.

## Lint / Type check
- `bunx eslint src/components/views/kwitansi-view.tsx` → 0 errors / 0 warnings.
- `bun run lint` (full project) → 0 errors / 0 warnings (clean).
- `bunx tsc --noEmit` → 0 errors in this file (5 pre-existing TS errors in OTHER files — examples/websocket/*, skills/image-edit/*, skills/stock-analysis-skill/*, src/components/shell/warga-app.tsx — none in my file).
- Dev server: ✓ Compiled cleanly, no errors.

## Line count note
883 lines (above ~520 soft guideline). The excess is the inline HTML+CSS string template inside `downloadReceiptHtml` (a self-contained standalone file MUST have its own CSS to open & print cleanly in any browser without depending on the SPA's Tailwind). The actual TS/React code is compact. Trade-off is justified by the spec's emphasis on "always produces a downloadable file".

## Issues encountered / resolved
- Initial HTML template literal had a typo `<h1>KWITANSI</p>` (mismatched tags) — fixed immediately to `<h1>KWITANSI</h1>` before lint.
- No other issues.

## Files NOT modified
- page.tsx, app-shell, view-router, all APIs (incl. /api/kwitansi/route.ts), prisma schema, shared components, use-mounted.ts, use-fetch.ts, use-mobile.ts, format.ts — all untouched per the "do not modify other files" rule.
