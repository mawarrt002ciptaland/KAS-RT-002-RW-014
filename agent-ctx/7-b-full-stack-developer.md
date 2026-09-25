# Task 7-b — Marketplace Image Upload Feature

**Agent:** full-stack-developer
**Task:** Add image upload (by device OR by URL) to the Marketplace create/edit form and show uploaded images on product cards.

## What changed
- Rewrote `/home/z/my-project/src/components/views/marketplace-view.tsx` (`export function MarketplaceView()`).

## Key features added
1. **Product cards** — responsive grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`. Each card:
   - Square top image area: `next/image` with `fill` + `object-cover` + `unoptimized` when `fotoUrl` exists, else a kategori-colored placeholder (ShoppingBag icon + large first letter of nama).
   - nama (line-clamp-2 font-semibold), harga (green bold `formatRupiah`), penjual row with initials avatar circle, kondisi badge (Baru=success, Bekas=warning), full-width "Hubungi" button → `openWhatsApp`.
   - Clicking the card (image or nama) opens the detail dialog; "Hubungi" button uses `stopPropagation`.
2. **Create/Edit dialog with image upload** (`ImageUploader` component):
   - Prominent square `aspect-square` live preview at top (uses `next/image fill unoptimized` when value set, else ImageIcon placeholder).
   - "Upload dari Perangkat" button → hidden `<input type="file" accept="image/*" capture="environment">` → POST /api/upload (FormData) → set fotoUrl + `toast.success("Gambar terunggah")`. Spinner overlay (`Loader2 animate-spin`) shown while uploading.
   - "Gunakan URL" → text input + "Terapkan" button → validates `^https?://` → sets fotoUrl.
   - "Hapus" button clears fotoUrl to "".
   - All other fields: Nama, Kategori select, Harga (rupiah input + live `formatRupiah` hint), Kondisi select, Penjual, Telepon (tel), Deskripsi.
3. **Detail dialog** — large square image (next/image fill) OR kategori placeholder, all info (harga, penjual with initials avatar, deskripsi, posting date), StatusBadge, kondisi Badge, kategori Badge. Footer buttons: Hapus (AlertDialog → deleteJSON), Edit (opens create dialog prefilled via `openEdit`), Hubungi (openWhatsApp).
4. **Edit flow** — no PATCH endpoint exists, so edit = delete old (`deleteJSON`) + create new (`postJSON`). Toast: "Barang diperbarui" (edit) / "Barang ditambahkan" (create).
5. **StatCards** — 4 cards in `grid-cols-2 sm:grid-cols-4`: Total Barang, Tersedia, Total Nilai (`formatRupiah` sum), Kategori count.
6. **States** — loading skeleton grid (8 cards h-60), EmptyState, ErrorState with retry.
7. **Hydration** — `useMounted()` gates `formatTanggalID` and `relativeTime` in the detail dialog (`{mounted ? ... : "\u00A0"}`).

## Helpers
- `initials(name)` — first + last initial uppercased for avatar circle.
- `uploadImage(file)` — POST /api/upload FormData, returns url or null (toasts on error).
- `firstLetter(s)` — first char uppercased for placeholder letter.
- `kategoriBg(k)` — kategori → bg color class for placeholder.
- `buildWaMessage(it)` — "Halo {penjual}, saya tertarik dengan {nama}".

## Imports used
- `useFetch, postJSON, deleteJSON` from `@/hooks/use-fetch`
- `useIsMobile` (used in `ImageUploader` to toggle preview max-width)
- `useMounted`
- `PageHeader, StatCard, StatusBadge, EmptyState, ErrorState, CardSkeleton, SectionTitle, Card, openWhatsApp` from `@/components/shared`
- `formatRupiah, parseRupiahInput, toThousandInput, relativeTime, formatTanggalID` from `@/lib/format`
- `KATEGORI_MARKETPLACE` from `@/lib/constants`
- `Image` from `next/image` (always `unoptimized` for /uploads/* and http URLs)
- shadcn `Dialog, AlertDialog, Button, Input, Select, Label, Textarea, Badge`
- `toast` from sonner
- lucide: `ShoppingBag, Plus, Search, MessageCircle, Trash2, Eye, Edit, Upload, Link2, X, Camera, Image as ImageIcon, Loader2, Package`

## Lint
- `bun run lint` → clean (0 errors). ESLint config has `no-unused-vars` and `@typescript-eslint/no-unused-vars` off, so the `Camera` import (kept for spec completeness) does not error. Note: `Camera` is imported but not rendered; harmless under current lint rules.

## Line count
- 493 lines (slightly above the ~450 soft target due to verbose ImageUploader + StatCard row + full AlertDialog). Mobile-first, zero horizontal overflow, all dialogs `max-h-[90vh] overflow-y-auto`.

## Files touched
- `src/components/views/marketplace-view.tsx` (full rewrite)
- No other files modified.
