# Task 6-c — Redesign Pengaturan View (Logo Upload + QRIS Upload + User Management)

## Task ID: 6-c
- **Agent**: full-stack-developer
- **View file**: `/home/z/my-project/src/components/views/pengaturan-view.tsx`
- **Export**: `PengaturanView()`

## What was built

Rewrote `pengaturan-view.tsx` (~790 lines) from 3-tab layout to 4-tab layout adding 3 new major features.

### Tab 1 — Profil RT
- Editable form (nama_rt, rw, perumahan, kota, periode_pengurus, alamat) with save
- LOGO UPLOAD card: preview (next/image unoptimized for /uploads/* + http), "Upload dari Perangkat" file picker → POST /api/upload → PATCH { logo_url } → `useBrandStore.setBrand({ logoUrl })` for instant header update → toast. "Gunakan URL" + Terapkan. "Hapus Logo".
- When saving profil, if nama_rt changed, also calls setBrand({ namaRT }) to sync header.

### Tab 2 — Keuangan
- iuran_bulanan / iuran_keamanan / iuran_kebersihan (RupiahField with parseRupiahInput + toThousandInput + formatRupiah preview)
- bank_nama / bank_rekening / bank_pemilik + qris_url text field
- QRIS UPLOAD card: 128×128 preview, "Upload dari Perangkat" → POST /api/upload → PATCH { qris_image } → toast.success("QRIS diperbarui. Kwitansi akan menampilkan QRIS ini."). "Gunakan URL" + Terapkan. "Hapus QRIS". Note text "QRIS ini akan otomatis tampil di setiap kwitansi yang dicetak."

### Tab 3 — Akun (USER MANAGEMENT — NEW MAJOR FEATURE)
- Hint card about integrated database login
- Header "Manajemen Akun Login" + "+ Tambah User"
- Independent `useFetch<{items, count}>("/api/auth/users")` (separate from settings fetch)
- User list as Card rows: Avatar (foto or initials fallback colored by role), nama, role Badge (admin=primary, ketua=success, bendahara=warning, pengurus=info, warga=muted), status badge if non-aktif, email, telepon, lastLogin relativeTime (gated behind useMounted)
- Actions per row: Reset Password (KeyRound), Edit (Edit), Hapus (Trash2 → AlertDialog)
- "+ Tambah User" Dialog: Email (required email, disabled on edit), Password (required create, optional edit "Kosongkan jika tidak diubah", show/hide Eye/EyeOff toggle, min 6 validation), Nama (required), Role Select, Telepon (tel). POST /api/auth/users + toast.success("User {email} ditambahkan") + refetch.
- Edit Dialog: same fields, password optional. PATCH /api/auth/users/[id] + toast + refetch.
- ResetPasswordDialog: small prompt with new password (Eye/EyeOff toggle) → PATCH { password } → toast + close + refetch.
- AlertDialog confirm for delete → DELETE → toast + refetch.

### Tab 4 — Tampilan
- Theme toggle light/dark via useTheme().setTheme, Switch gated by useMounted to avoid hydration mismatch
- "Mode Tampilan" Admin/Warga via useAppStore.setRole
- Theme preview card using bg-background/text-foreground tokens that auto-switch

## Patterns followed

- **Draft-overlay state**: `getValue(k) = k in draft ? draft[k] : (settings[k] ?? "")`. No useEffect syncing fetched data → local state (avoids `react-hooks/set-state-in-effect` lint).
- **Keyed remount for UserFormInner**: `key={mode === "edit" ? user?.id || "edit" : "new"}` so form state resets cleanly on edit-mode switch without useEffect.
- **useMounted gate** for theme checks, lastLogin relativeTime, Pratinjau Tema Badge content.
- **Upload helper**: `uploadImage(file)` POSTs FormData "file" to /api/upload → returns URL string or null (with toast error).
- **Image preview**: next/image with `unoptimized` for /uploads/* paths AND http URLs.
- **Brand sync**: after saving logo_url, call `useBrandStore.setBrand({ logoUrl })` to update header INSTANTLY (no reload).

## Lint & TypeScript

- `bunx eslint src/components/views/pengaturan-view.tsx` → 0 errors
- `bunx tsc --noEmit -p tsconfig.json` → 0 errors in this file
- `bun run lint` project-wide → 1 pre-existing error in `src/hooks/use-mounted.ts:8` (NOT in scope per "do not modify other files" rule)

## Files touched
- `src/components/views/pengaturan-view.tsx` (rewritten, 790 lines)
- `worklog.md` (appended Task 6-c entry)

No other files modified.
