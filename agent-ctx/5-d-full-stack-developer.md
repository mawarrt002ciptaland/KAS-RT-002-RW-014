# Task 5-d — kegiatan-view + pengumuman-view

Agent: full-stack-developer

## What I did
Built two mobile-first feature views for SISTEM INFORMASI RT 002:
1. `src/components/views/kegiatan-view.tsx` — `KegiatanView()` (Activities)
2. `src/components/views/pengumuman-view.tsx` — `PengumumanView()` (Announcements)

## Key decisions
- Mobile (< 768px) renders a vertical card list; desktop renders a horizontally-scrollable table wrapped in `scrollbar-thin overflow-x-auto`.
- Both views use `useFetch` for GET, `postJSON` for create, `deleteJSON` for delete; on success → `toast.success` + `refetch()`.
- Filter UX: shadcn `Tabs` for status (4 options), `Select` for kategori. Stacked vertically on mobile, row on desktop.
- Detail dialog includes full info + AlertDialog for delete confirmation (with `e.preventDefault()` so the dialog stays open during async deletion).
- Pengumuman: `mendesak` items get `border-l-2 border-l-destructive` left accent + AlertTriangle icon badge.
- Prioritas badge colors: mendesak=destructive, penting=warning, normal=info.
- Forms default to sensible values (`toISODate(new Date())` for kegiatan tanggalMulai; first kategori from constants).
- All interactive icon buttons have `aria-label`s; ARIA-compliant.

## Verification
- `bun run lint`: 0 errors in my files (5 pre-existing errors are in unrelated files: `.zscripts/*.cjs`, `search-overlay.tsx`).
- `bunx tsc --noEmit -p tsconfig.json`: 0 errors in my files (errors only in `examples/`, `skills/`, `warga-app.tsx`).
- Both files export the expected function name matching `view-router.tsx`.
- Line counts: kegiatan 349, pengumuman 342 — slightly above the ~280 soft target due to two dialogs (create + detail) + AlertDialog + mobile card component + desktop table per view.

## Files
- `/home/z/my-project/src/components/views/kegiatan-view.tsx`
- `/home/z/my-project/src/components/views/pengumuman-view.tsx`

## Did NOT modify
- Other view files, page.tsx, app-shell, view-router, APIs, schema, shared components.
