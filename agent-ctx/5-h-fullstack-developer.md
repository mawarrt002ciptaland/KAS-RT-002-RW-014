# Task 5-h — WhatsApp Broadcast & Pengaturan Views

## Files
- `/home/z/my-project/src/components/views/whatsapp-view.tsx` — `WhatsappView()` (361 lines)
- `/home/z/my-project/src/components/views/pengaturan-view.tsx` — `PengaturanView()` (327 lines)

## API contracts used
- `GET /api/warga` → `{ items: Warga[] }` where `Warga = { id, nama, noRumah, telepon, role, jabatan }`
- `GET /api/pengaturan` → `{ settings: Record<string,string>, items: Pengaturan[] }`
- `PATCH /api/pengaturan` body `{ key: value, ... }` bulk-upsert

## Helpers used
- `openWhatsApp(number, message)` from `@/components/shared` — opens wa.me links
- `RT_INFO` (incl. `whatsappAdmin`) from `@/lib/constants`
- `formatRupiah / parseRupiahInput / toThousandInput` from `@/lib/format`
- `useFetch / patchJSON` from `@/hooks/use-fetch`
- `useAppStore` (role/setRole) from `@/lib/store`
- `useTheme` from `next-themes`
- shadcn: Tabs / Button / Input / Textarea / Label / Switch / Badge / Checkbox / Select
- `toast` from `sonner`
- lucide: Send, Settings, MessageCircle, Users, Check, Copy, Phone, Sun, Moon, LogOut, UserCog, Wallet, Building2, Save, RefreshCw

## WhatsappView — design notes
- WhatsApp Admin card at top: prominent emerald tint, big full-width `WhatsApp Admin RT` button → opens wa.me with RT_INFO.whatsappAdmin prefilled "Halo Admin RT 002, saya ingin menyampaikan aduan/informasi."
- Compose card with SectionTitle + count badge:
  - Filter chips (Semua / Pengurus / Warga Biasa) — `aria-pressed` toggles
  - `Pilih Semua` (selects currently filtered IDs) + `Kosongkan` buttons
  - Recipients list: `max-h-64 overflow-y-auto scrollbar-thin`, each row = `<Checkbox>` + nama + noRumah + masked telepon + optional jabatan, role Badge (desktop only)
  - Phone mask: first 2 + last 2 digits, middle `*` (max 6 stars). Sending uses `waNumber()` to normalize "08…" → "62…" for wa.me
  - `Gunakan Template` select fills textarea with 4 presets: Pengumuman Rapat Warga, Pengingat Iuran Bulanan, Undangan Kegiatan, Pemberitahuan Tagihan (plus a "Kosongkan" option)
  - Pesan textarea (resize-y, 5 rows)
  - Actions row: `Salin Pesan` (clipboard + toast) and `Kirim Broadcast (N)` button
  - Broadcast results panel (after send): per-recipient row with `Buka` button — opens wa.me for that warga with current message. Auto-opens the FIRST recipient on `Kirim Broadcast` (browsers usually allow one popup), the rest require explicit user click.
- Loading: 5 `CardSkeleton` rows inside the scroll container; error: `ErrorState` with retry; empty: `EmptyState`.

## PengaturanView — design notes
- PageHeader with `Muat Ulang` action (RefreshCw icon) — calls refetch
- Tabs (4 cols, full-width TabsList) — Profil / Keuangan / Tampilan / Akun (with leading icons)
- "Draft overlay" state pattern (avoids `setState`-in-effect lint): single `draft` dict tracks only the fields the user has touched. `getValue(k) = k in draft ? draft[k] : data.settings[k] ?? ""`. Save sends only `k in draft` keys. After successful save, those keys are removed from draft + refetch.
- Profil RT: Nama RT / RW / Perumahan / Kota / Periode Pengurus (Field helper) + Alamat (Textarea), Save button → patchJSON with changed keys only
- Keuangan: 3 RupiahField (iuran_bulanan / iuran_keamanan / iuran_kebersihan — uses `parseRupiahInput` + `toThousandInput` + `formatRupiah` preview, stored as raw string in draft, normalized to integer string on save) + 4 plain Fields (bank_nama, bank_rekening, bank_pemilik, qris_url) + Save button
- Tampilan: two Switch rows in a single divided Card — Tema Gelap (`useTheme` light/dark) and Mode Tampilan Warga (`useAppStore.setRole` admin/warga). Both apply instantly — note "Perubahan tampilan langsung tersimpan otomatis"
- Akun: mock avatar card (Admin RT 002, admin@rt002mawar.id, Administrator badge) + 4-row dl/dt/dd info grid (v1.0.0, RT/RW, Perumahan, Admin WhatsApp) + destructive Logout button → `toast.info("Anda telah keluar.")`
- Loading: 3 CardSkeleton; error: ErrorState with retry
- All inputs/buttons use `.touch-target` (44px min), emerald tokens only (no indigo/blue), ARIA labels on icon-only buttons

## Lint result
- `bunx eslint src/components/views/whatsapp-view.tsx src/components/views/pengaturan-view.tsx` → 0 errors
- `bunx tsc --noEmit` → 0 errors in these files
- Project-wide `bun run lint` → only 4 pre-existing errors in `.zscripts/*.cjs` (require() style imports — NOT touched by this task)

## No other files modified
- Only the two assigned view stubs were overwritten. No page.tsx, app-shell, APIs, schema, shared components, or sibling views touched.
