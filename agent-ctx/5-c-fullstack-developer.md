# Task 5-c — WargaView Builder

## Agent
full-stack-developer

## Task
Implement `/home/z/my-project/src/components/views/warga-view.tsx` exporting `WargaView` for the SISTEM INFORMASI RT 002 Data Warga module. Overwrote existing stub.

## Work Log
- Read CONTEXT-FOR-AGENTS.md and worklog.md to understand stack, shared components, hooks, and design rules.
- Read `src/app/api/warga/route.ts` and `[id]/route.ts` to confirm API contract (GET `{items,total,totalKK}`, POST, PATCH, DELETE) and exact Warga fields.
- Read `src/components/shared/index.tsx` to confirm exports: PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, CardSkeleton, openWhatsApp.
- Read `src/hooks/use-fetch.ts` (useFetch/postJSON/patchJSON/deleteJSON) and `src/hooks/use-mobile.ts` (useIsMobile, breakpoint 768).
- Inspected shadcn ui components (dialog, alert-dialog, select, badge, avatar, table) to verify export names.
- Implemented WargaView with:
  - PageHeader with Users icon, "+ Tambah Warga" action.
  - 4 StatCards (Total Warga, Total KK, Warga Aktif, Pengurus) — mobile 1-col, desktop 4-col.
  - Filter bar: search input (debounced 350ms), role select (Semua/Warga/Pengurus/Admin), status select (Semua/Aktif/Pindah/Meninggal). Mobile stacked, desktop inline.
  - Mobile (<768px): CARD LIST with Nama (uppercase bold), role + jabatan subtitle, status badge, noRumah, pekerjaan, masked telepon, [Lihat] [Edit] buttons.
  - Desktop (md+): TABLE inside `overflow-x-auto scrollbar-thin` wrapper, columns: No | Nama | No Rumah | Telepon | Pekerjaan | Jenis Kelamin | Role | Status | Aksi (Detail/Edit/Hapus icon buttons).
  - Phone masking: keeps first 2 + last 2 digits, masks middle with `*`.
  - Create/Edit Dialog: nama*, noRumah*, blok (default Mawar), telepon (type=tel), pekerjaan, jenisKelamin (L/P), role, status, jabatan (shown only when role=pengurus), alamat (textarea). Prefilled on edit. postJSON/patchJSON + toast + refetch.
  - Detail Dialog: Avatar (User icon fallback), nama + role/status badges, DetailRows for all info (noRumah, telepon masked, pekerjaan, jk, tanggalBergabung + relativeTime, alamat, email), WhatsApp button (passes full unmasked digits to openWhatsApp), Edit (opens form), Hapus (opens AlertDialog).
  - Loading: 5 CardSkeletons; Empty state with conditional copy; Error state with retry.
- Used tokens only (no indigo/blue): bg-primary, text-success, text-warning, text-destructive, bg-muted. Mobile-first responsive throughout. Touch-target class on action buttons.
- Ran `bunx eslint src/components/views/warga-view.tsx` → exit 0, no errors. Project-wide `bun run lint` shows only pre-existing errors in unrelated files (`.zscripts/gen-icon.cjs`, `.zscripts/gen-stubs.cjs`, `src/components/shell/search-overlay.tsx`).

## Stage Summary
- File: `/home/z/my-project/src/components/views/warga-view.tsx` (409 lines, "use client", exports `WargaView`).
- Lint: clean for this file.
- Mobile-first design with card-on-mobile + table-on-desktop per CONTEXT requirement.
- All requested functionality present: search, role+status filter, CRUD via Dialog/AlertDialog, WhatsApp integration, phone masking, detail view, loading/empty/error states.
