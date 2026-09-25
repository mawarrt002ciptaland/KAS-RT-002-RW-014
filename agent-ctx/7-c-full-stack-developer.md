# Task 7-c — Kegiatan Warga (Activities) View Redesign

Agent: full-stack-developer
Task ID: 7-c
Target file: `/home/z/my-project/src/components/views/kegiatan-view.tsx` (export `KegiatanView()`)

## Context read
- `/home/z/my-project/CONTEXT-FOR-AGENTS.md` (all 3 sections incl. hydration rule + image upload + print pattern)
- `/home/z/my-project/worklog.md` (Tasks 1, 5-a..5-h, 6-a..6-e, ROUND2-FINAL, HYDRATION-FIX-2)
- Existing kegiatan-view.tsx (350 lines, flat mobile card + desktop table)
- Shared exports (PageHeader/EmptyState/ErrorState/CardSkeleton/StatusBadge/Card/SectionTitle)
- hooks (useFetch/postJSON/deleteJSON, useMounted via useSyncExternalStore, useIsMobile)
- format helpers (formatTanggalID, formatTanggalLengkapID, formatJam, toISODate, relativeTime, BULAN_ID)
- constants (KATEGORI_KEGIATAN = Sosial/Keamanan/Kebersihan/Pertemuan/Gotong Royong/Olahraga)
- shadcn ui (Dialog/AlertDialog/Button/Input/Select/Label/Textarea/Badge, Button supports asChild)
- globals.css tokens: --primary (emerald), --success, --destructive, --warning, --info, --muted + scrollbar-hide / tw-animate-css
- /api/kegiatan (GET items, POST create) + /api/kegiatan/[id] (DELETE only — no PATCH → no Edit feature)

## Implementation summary
- Rewrote file to 441 lines, single-file export `KegiatanView()`.
- **Filter tabs**: horizontally scrollable pills (`flex overflow-x-auto scrollbar-hide gap-2`) — Semua/Akan Datang/Berlangsung/Selesai; active = bg-primary text-primary-foreground; inactive = border bg-card. Plus kategori dropdown (KATEGORI_KEGIATAN) using rounded-full Select trigger with Filter icon.
- **Featured upcoming**: prominent highlighted card (border-2 border-primary/30 bg-primary/5 rounded-2xl p-4 sm:p-5). Left = large DateBadge (h-16 w-16 green square, big day + month abbr). Right = "KEGIATAN MENDATANG" eyebrow, judul (xl bold), kategori badge (bg-primary/10 text-primary), MetaRow (tanggal + lokasi + peserta), deskripsi line-clamp-2, "Lihat Detail" green button. Only shown when filter is "semua" or "akan_datang" AND an akan_datang item exists (picks soonest by tanggalMulai).
- **Activity list**: single-column list (cleaner, mobile-first). Each card: left DateBadge (h-12 w-12) colored by status (akan_datang=primary, berlangsung=success, selesai=muted, dibatalkan=destructive/10 with border), middle = judul semibold + ChevronRight, kategori Badge + StatusBadge, MetaRow, deskripsi line-clamp-1. Cards stagger via `animate-in fade-in slide-in-from-bottom-2` with deterministic animationDelay. Whole card is clickable (role=button, keyboard accessible).
- **Detail dialog**: header with DateBadge + judul + StatusBadge + kategori + MetaRow (full). fotoUrl shown as large next/image (unoptimized, h-48 sm:h-56). deskripsi full prose. 2x2 meta grid (Mulai/Selesai/Lokasi/Peserta) using MetaBox helper. "Dibuat {relativeTime}" gated with mounted. Footer: "Lihat Foto Kegiatan" outline button (only when status=selesai AND fotoUrl) opens fotoUrl in new tab; "Hapus" destructive button → AlertDialog; "Tutup".
- **Create dialog**: Judul, Kategori select, Tanggal Mulai + Tanggal Selesai (date inputs, 2-col grid), Lokasi, Deskripsi textarea. openCreate() sets tanggalMulai to today via toISODate(new Date()) — called in event handler (post-mount, no hydration concern). Submit → postJSON → toast → refetch → close.
- **AlertDialog delete**: confirms + deleteJSON → toast → refetch + close detail.
- **Empty state per filter**: title/desc/icon mapped by statusFilter (calendar for semua/akan_datang, clock for berlangsung, CheckCircle2 for selesai).
- **Loading skeleton**: CardSkeleton h-32 (featured placeholder) + 3× CardSkeleton h-24.
- **Error state**: ErrorState with retry.
- Removed Edit feature entirely (API has no PATCH) — only Tambah + Lihat Detail + Hapus.

## Helpers added
- `badgeClassFor(status)` — solid bg for akan_datang/berlangsung/selesai, destructive tint for dibatalkan.
- `DateBadge({ date, size, status })` — calendar tear-off; supports lg (h-16, text-2xl) and sm (h-12, text-lg). new Date(string) is deterministic → safe.
- `MetaRow({ k, full })` — tanggal + (time if ISO T) + lokasi + peserta; flex-col on mobile, sm:flex-row when full.
- `MetaBox({ icon, label, value })` — bordered meta cell for detail grid.
- `FeaturedCard({ k, onDetail })` — large highlighted upcoming card.
- `ActivityCard({ k, onDetail, index })` — clickable list card with stagger animation.
- `EMPTY_MSG` map + `emptyIcon` selector (CheckCircle2 / Clock / CalendarDays).
- `MONTH_ABBR` = Jan..Des (local, no dependency on BULAN_ID full names).

## Hydration safety
- `mounted = useMounted()` gates `relativeTime(detail.createdAt)` → fallback "\u00A0".
- Form state initialized with `tanggalMulai: ""` (no Date in useState initializer). `openCreate()` populates today's date in an event handler.
- `new Date(string)` calls (in DateBadge, sorting, MetaRow date format) are deterministic for the same input string on server and client.
- No `Math.random()`, no `Date.now()` in render body.
- No `useEffect(() => setX(...))` → no `react-hooks/set-state-in-effect` lint error.

## Mobile-first / UX
- Filter pills scroll horizontally INSIDE their container only (`overflow-x-auto scrollbar-hide` on the pill wrapper, the kategori Select stays fixed on the right) → no body overflow.
- Featured card stacks (flex-col on mobile, sm:flex-row).
- Detail dialog `max-h-[90vh] overflow-y-auto sm:max-w-lg`.
- Touch-target utility on all action buttons (min 44×44).
- ARIA: aria-pressed on filter pills, aria-label on icon-only buttons, role=button + tabIndex + keyboard handler on ActivityCard.
- Emerald theme tokens only (bg-primary, text-success, text-destructive, bg-muted). No indigo/blue.

## Verification
- `bun run lint` → 0 errors, 0 warnings (clean across the whole project).
- `bunx tsc --noEmit` filtered to my file → 0 errors in kegiatan-view.tsx (other pre-existing errors in examples/, skills/, src/components/shell/warga-app.tsx are out of scope).
- Dev server: compiles cleanly (`✓ Compiled in ...`), no errors.
- Final file: 441 lines (slightly over the ~420 soft guideline; structure is clean and lint-clean — accepted the trade-off for readability of the date-badge + meta-grid + dialog flow).

## Files touched
- ONLY `/home/z/my-project/src/components/views/kegiatan-view.tsx` (edited, 441 lines).
- No other files modified.
