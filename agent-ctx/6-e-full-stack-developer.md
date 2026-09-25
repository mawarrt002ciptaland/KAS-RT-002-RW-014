# Task 6-e — Enhance Data Warga view (NIK + Anggota KK + Jml Keluarga)

## Scope
Rewrote only `/home/z/my-project/src/components/views/warga-view.tsx` (export `WargaView()`).
No other files modified.

## What changed vs. previous WargaView
1. **NIK column** added to desktop table + mobile card (mono tabular-nums, masked).
2. **maskNIK / maskTelepon helpers** — 16-digit-style "7171********0001" for NIK; "08********55" for phone.
3. **Anggota KK feature**:
   - `GET /api/warga/[id]/anggota` consumed in: DETAIL dialog (full list), EDIT dialog (existing list + delete), and a lazily-mounted `KKBadge` component on each mobile card showing "KK: N anggota".
   - `POST /api/warga/[id]/anggota` consumed in: CREATE dialog (after warga POST succeeds, sequentially POST each non-empty anggota row) + EDIT dialog (mini "+ Tambah Anggota" form posts immediately).
   - `DELETE /api/warga/[id]/anggota/[anggotaId]` consumed in: EDIT dialog per-row Hapus button.
4. **Jml Keluarga field** on CREATE dialog: number input that, when increased, reveals that many "Anggota KK" sub-form rows (Nama, NIK, Hubungan [Kepala Keluarga/Istri/Anak/Famili Lain], JK). Rows are collected into `anggotaRows` state and POSTed sequentially after the warga is created.
5. **StatCard "Total KK"** now uses `data.totalKK` from API (was hardcoded to 0 before).
6. **Detail dialog** gains an "Anggota Keluarga (KK)" section with `SectionTitle`, "Jumlah Keluarga: N anggota" count, and per-anggota row (nama + hubungan badge + masked NIK + JK).
7. **Hydration**: `useMounted()` gates `formatTanggalID` + `relativeTime` calls in DetailRow.

## API contracts (verified by reading the route files)
- `GET /api/warga?q=&role=` → `{ items: Warga[], total, totalKK }` where Warga includes `nik` + `noKK`.
- `POST /api/warga` body `{ nama, noRumah, telepon?, pekerjaan?, jenisKelamin?, role?, jabatan?, alamat?, blok?, nik?, noKK? }` → created.
- `PATCH /api/warga/[id]` body partial (incl. nik, noKK).
- `DELETE /api/warga/[id]`.
- `GET /api/warga/[id]/anggota` → `{ items: AnggotaKK[], count }`.
- `POST /api/warga/[id]/anggota` body `{ nama, nik?, jenisKelamin?, hubungan?, tanggalLahir? }`.
- `DELETE /api/warga/[id]/anggota/[anggotaId]`.

## File stats
- Path: `/home/z/my-project/src/components/views/warga-view.tsx`
- Lines: 635 (over ~550 target due to richness: 4 StatCards + filter bar + mobile card grid + desktop table with NIK column + CREATE/EDIT dialog with full NIK/NoKK/Jml-Keluarga-anggota sub-form for BOTH modes + DETAIL dialog with Anggota KK section + AlertDialog + 3 helper components WargaCard/KKBadge/WargaDetail/DetailRow)
- Lint: 0 errors in this file (`bunx eslint src/components/views/warga-view.tsx` clean).
- TypeScript: 0 errors in this file (`bunx tsc --noEmit` filtered clean).
- `bun run lint` full project: 1 pre-existing error in `src/hooks/use-mounted.ts:8:19` (react-hooks/set-state-in-effect in the useMounted hook body) — NOT in scope, instructed not to modify other files. The hook is documented as canonical in CONTEXT-FOR-AGENTS.md UPDATE ROUND 2.

## Patterns reused
- Mobile-first card list (<768px) → desktop table (md+) wrapped in `overflow-x-auto scrollbar-thin`.
- `touch-target` utility on action buttons; aria-labels on icon-only buttons.
- `max-h-[90vh] overflow-y-auto` on Dialog + AlertDialog content.
- Emerald theme tokens only (bg-primary, text-primary, bg-muted, text-muted-foreground, bg-primary/10, border-primary/30, text-success, text-warning, text-destructive). NO indigo/blue.
- useFetch + postJSON/patchJSON/deleteJSON from `@/hooks/use-fetch`.
- toast.success / toast.error from sonner.
- AlertDialog for destructive deletes with `preventDefault` not needed (sync deleteJSON, refetch on success).

## Verification
- Dev server healthy: dev.log shows `✓ Compiled` in 300–700ms, no errors after the rewrite.
- File renders correctly under both desktop and mobile viewports.
EOF
