# Task 5-f — Trafik Website + Marketplace views

Agent: full-stack-developer
Task: Implement two feature views — `TrafikView` (traffic analytics) and `MarketplaceView` (resident marketplace) — both mobile-first, integrated with existing `/api/trafik` and `/api/marketplace` endpoints.

## Work Log

### Context review
- Read CONTEXT-FOR-AGENTS.md and worklog.md (Tasks 1, 5-a..5-e) for project conventions and prior agent patterns.
- Read existing shared components (`PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, `CardSkeleton`, `Card`, `StatusBadge`, `openWhatsApp`, `SectionTitle`) in `src/components/shared/index.tsx`.
- Read `use-fetch.ts` (`useFetch`, `postJSON`, `deleteJSON`), `use-mobile.ts`, `lib/format.ts`, `lib/constants.ts` (`KATEGORI_MARKETPLACE`).
- Read existing API routes to verify contracts:
  - `/api/trafik?days=N` → `{ totalViews, totalVisitors, totalSessions, daily[], deviceBreakdown[], topReferrers[], topPages[] }` ✓
  - `/api/marketplace?kategori=&q=` → `{ items: Marketplace[] }` (filters by `status: "tersedia"`) ✓
  - `POST /api/marketplace` expects `{ nama, kategori, harga, deskripsi, penjual, telepon, kondisi, fotoUrl }` ✓
  - `DELETE /api/marketplace/[id]` ✓
- Inspected `dashboard-view.tsx`, `charts/expense-donut.tsx`, `charts/cash-flow-chart.tsx`, and `kegiatan-view.tsx` for visual + code patterns.

### TrafikView (`src/components/views/trafik-view.tsx`)
- "use client"; `export function TrafikView()`.
- PageHeader: title "Trafik Website" + Globe icon + description.
- Period selector: segmented control with three buttons (`7 hari`, `30 hari`, `90 hari`) using `role="tablist"`/`role="tab"` + `aria-selected`, with `touch-target` for mobile. State `days` drives `useFetch` URL via `useMemo`.
- 4 StatCards (mobile 1-col → desktop 4-col): Total Views, Total Visitors, Total Sessions, Rata-rata/Hari (`totalViews/days`). Values use `n.toLocaleString("id-ID")` via local `formatNum()` helper.
- Charts (recharts `ResponsiveContainer` wrapped in `h-56 sm:h-72`):
  - **Daily area chart** (`AreaChart` + `Area` with emerald linearGradient, `CartesianGrid`, `XAxis`/`YAxis` with theme-aware colors via `useTheme().resolvedTheme`, `Tooltip`).
  - **Device donut** (`PieChart` + `Pie` innerRadius 62% — mobile donut on top + legend below). Legend rows use device icon (`Smartphone`/`Monitor`/`Tablet`), percent, and absolute visitors. Center overlay shows total.
  - **Top referrers horizontal bar** (`BarChart layout="vertical"`).
  - Theme-aware grid/axis colors (`useTheme`).
- **Top Pages**: card grid (mobile 1-col → sm 2-col) with rank badge, page path (truncate), views (tabular-nums). Capped to 10 items.
- Empty state when `totalViews === 0` and no daily data.
- Loading skeleton (4 stat cards + 1 area chart skeleton + 2 chart skeletons).
- Error state with `refetch` retry.

### MarketplaceView (`src/components/views/marketplace-view.tsx`)
- "use client"; `export function MarketplaceView()`.
- PageHeader: title "Marketplace" + ShoppingBag icon + `+ Jual Barang` action.
- Filter bar (mobile stacked → desktop inline): search `Input` (with `Search` icon) + kategori `Select` (`Semua` + `KATEGORI_MARKETPLACE`). URL built with `URLSearchParams` via `useMemo`.
- Grid (mobile 2-col → sm 3-col → lg 4-col): each card = `ProductCard` component.
- `ProductCard`:
  - Square photo (or `PhotoBox` fallback with ShoppingBag icon + kategori-colored chip).
  - Nama (line-clamp-2, click opens detail).
  - Harga `formatRupiah` (text-primary).
  - Penjual (truncate) + kondisi Badge (Baru/Bekas).
  - Full-width `Hubungi` button → `openWhatsApp(item.telepon, "Halo " + item.penjual + ", saya tertarik dengan " + item.nama)`.
- **Create Dialog** (`max-h-[90vh] overflow-y-auto`): Nama, Kategori (Select), Kondisi (Select baru/bekas), Harga (`inputMode="numeric"`, `toThousandInput` display + `parseRupiahInput` parse + `formatRupiah` preview hint), Penjual, Telepon (`type="tel"`), Deskripsi (Textarea), URL Foto (`type="url"`) — single text-input string (no upload). Submit → `postJSON` + `toast.success` + reset + `refetch`. Validation: nama/harga/penjual/telepon required.
- **Detail Dialog**: full info + PhotoBox + StatusBadge + kategori + kondisi badges + price card + penjual/telepon row (MessageCircle icon) + posting date (`formatTanggalID` + `relativeTime`) + deskripsi block. Footer: Hapus (AlertDialog confirm) + Hubungi.
- AlertDialog for delete (`deleteJSON /api/marketplace/[id]` + `toast.success` + `refetch`).
- Loading skeleton grid (8 cards), empty state with create CTA, error state with retry.
- Two helper components extracted to keep file compact: `Field` (Label+input wrapper with optional hint), `PhotoBox` (img or fallback). The `buildWaMessage` and `kategoriColor` helpers are pure top-level functions.

### Mobile-first / a11y
- All interactive elements use `touch-target` utility (44×44px min).
- `aria-label` on search input, kategori select, photo button, period tabs.
- Modals capped at `max-h-[90vh] overflow-y-auto`.
- Emerald theme tokens only (no indigo/blue). PieCell uses `oklch()` palette matching `expense-donut.tsx`.
- No footer added (handled by AppShell).
- Use of `useTheme` for chart grid/axis colors so dark mode renders correctly.

### Verification
- `bunx eslint src/components/views/trafik-view.tsx src/components/views/marketplace-view.tsx` → 0 errors / 0 warnings.
- `bunx tsc --noEmit -p tsconfig.json` filtered to my two files → 0 errors.
- `bun run lint` (full project) → 5 pre-existing errors in OTHER agents' files (`.zscripts/gen-icon.cjs`, `.zscripts/gen-stubs.cjs` require() usage, `src/components/views/pengaduan-view.tsx` react-hooks/preserve-manual-memoization warning). None in my files.
- Dev server still healthy (no compile errors in `dev.log`).

### Line counts (under ~320)
- `trafik-view.tsx`: 262 lines.
- `marketplace-view.tsx`: 312 lines.

## Stage Summary
- **Files edited (only these two)**:
  - `/home/z/my-project/src/components/views/trafik-view.tsx` (262 lines) — `export function TrafikView()`.
  - `/home/z/my-project/src/components/views/marketplace-view.tsx` (312 lines) — `export function MarketplaceView()`.
- Both views wire up to existing `/api/trafik?days=` and `/api/marketplace` (+ `[id]` DELETE) endpoints.
- Mobile-first throughout; recharts `ResponsiveContainer` for all charts; emerald theme tokens only (no indigo/blue); touch-target buttons; aria-labels on icon-only controls; modals capped at `max-h-[90vh]`.
- Lint clean for both files. Project-wide remaining lint errors are in other agents' files (`.zscripts/*.cjs` require() usage, `pengaduan-view.tsx` react-hooks/preserve-manual-memoization) — out of task scope per "do not modify other files" rule.
