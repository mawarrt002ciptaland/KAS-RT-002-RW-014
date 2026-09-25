# SHARED CONTEXT — SISTEM INFORMASI RT 002 (Frontend View Builders)

## Project Overview
SISTEM INFORMASI RT 002 Blok Mawar Ciptaland — a Digital Operating System for an Indonesian neighborhood (RT 002 RW 014 Perumahan Ciptaland, Batam). Single-route SPA at `/` (src/app/page.tsx → AppShell). All feature views are client components under `src/components/views/`.

## Tech Stack
- Next.js 16 (App Router) + TypeScript 5 + Tailwind CSS 4 + shadcn/ui (New York) + lucide-react
- Prisma ORM (SQLite) + Zustand + Recharts + framer-motion + sonner (toasts)
- Dev server on port 3000 (already running). Use `bun run lint` to check code quality.

## CRITICAL: Mobile-First Responsive (PRIMARY REQUIREMENT)
- Design for 360px first, THEN enhance for 768px (tablet), 1280px+ (desktop).
- NEVER force a desktop table onto mobile — render a CARD LIST on mobile (< 768px) and a TABLE on desktop.
- Tables: wrap in `<div className="overflow-x-auto scrollbar-thin">` so ONLY the table scrolls horizontally, never the body.
- Inputs: `w-full`, min height 44px (use `.touch-target` utility). Buttons: min 44×44px touch target.
- Modals: use shadcn `Dialog` on desktop; on mobile it auto-adapts. Add `max-h-[90vh] overflow-y-auto` to content.
- Charts: always wrap in `<div className="h-64 w-full sm:h-72"><ResponsiveContainer width="100%" height="100%">...</ResponsiveContainer></div>`. Never fixed width.
- Rupiah text: use `formatRupiah(n)` — it produces `Rp 8.002.313`. Use the `<RupiahText value={n} />` component (handles wrapping).
- No indigo/blue colors. Theme is emerald-based. Use tokens: `bg-primary`, `text-success`, `text-destructive`, `text-warning`, `text-info`, `bg-muted`, `text-muted-foreground`.
- Footer is already sticky (handled by AppShell). Don't add a footer.

## Existing Shared Components (import from `@/components/shared`)
- `PageHeader({ title, description?, actions?, icon? })` — page title block with optional icon + actions row
- `StatCard({ title, value, icon?, tone?, hint?, action? })` — tone: "default"|"income"|"expense"|"warning"|"neutral"
- `RupiahText({ value, className?, sign? })` — sign: "pos"|"neg" for +/− prefix
- `StatusBadge({ status })` — auto-colors for: selesai/belum_bayar/telat/lunas/aktif/arsip/baru/proses/ditolak/akan_datang/berlangsung/dibatalkan/tersedia/terjual
- `TrendBadge({ jenis: "pemasukan"|"pengeluaran" })`
- `SectionTitle({ title, action? })`
- `EmptyState({ icon?, title, description?, action? })`
- `ErrorState({ message?, onRetry? })`
- `CardSkeleton({ className? })`, `Card({ className, ...props })`
- `openWhatsApp(number, message)` — opens wa.me in new tab
- `Icon({ name, className })` — from `@/components/shared/icon`; maps lucide icon names (e.g. `<Icon name="Users" className="h-5 w-5" />`)

## Data Fetching (`@/hooks/use-fetch`)
- `const { data, loading, error, refetch } = useFetch<T>("/api/...")` — auto-fetch on mount, returns {data, loading, error, refetch}
- `import { postJSON, patchJSON, deleteJSON } from "@/hooks/use-fetch"` — return `{ ok: boolean, data?, error? }`
- After mutation: `if (!r.ok) return toast.error(r.error); toast.success("Berhasil"); refetch();`
- `import { toast } from "sonner"` for notifications

## Format Helpers (`@/lib/format`)
- `formatRupiah(n)` → "Rp 8.002.313"
- `formatRupiahCompact(n)` → "Rp 8 jt"
- `parseRupiahInput(s)` → number (strips non-digits)
- `toThousandInput(n)` → "8.002.313" for input display
- `formatTanggalID(d)` → "31 Agustus 2026"
- `formatTanggalLengkapID(d)` → "Senin, 31 Agustus 2026"
- `toISODate(d)` → "2026-08-31" for `<input type="date">`
- `monthKey(d)` → "2026-08"
- `shortMonthLabel(d)` → "Agu 26"
- `relativeTime(d)` → "2 jam lalu"

## Constants (`@/lib/constants`)
- `KATEGORI_PEMASUKAN`, `KATEGORI_PENGELUARAN`, `KATEGORI_PENGADUAN`, `KATEGORI_PENGUMUMAN`, `KATEGORI_KEGIATAN`, `KATEGORI_MARKETPLACE`
- `RT_INFO` → `{ rt, rw, blok, perumahan, kota, whatsappAdmin: "6281234567890", namaLengkap, alamat }`

## Store (`@/lib/store`)
- `useAppStore()` → `{ role, setRole, activeView, setActiveView, drawerOpen, setDrawerOpen, wargaTab, setWargaTab, searchOpen, setSearchOpen, notifOpen, setNotifOpen, quickOpen, setQuickOpen }`
- Use `setActiveView("pemasukan")` etc. for in-app navigation

## shadcn/ui Components (`@/components/ui/*`)
All exist: button, input, textarea, select, label, badge, card, dialog, sheet, drawer, table, tabs, dropdown-menu, sheet, tooltip, accordion, checkbox, switch, progress, scroll-area, separator, calendar, popover, command, toast, sonner, skeleton, avatar, alert, alert-dialog.

## Rules
- ONLY create/edit the view file(s) assigned to your task. Do NOT modify other files (page.tsx, app-shell, APIs, etc.) — they are final.
- Each view file must `"use client"` at top and `export function <Name>()` matching the view-router mapping (see below).
- Do NOT write test files.
- Use semantic HTML, ARIA labels for icon-only buttons, keyboard-accessible.
- After finishing, APPEND a section to `/home/z/my-project/worklog.md` (do not overwrite) using:
  ```
  ---
  Task ID: <your task id>
  Agent: full-stack-developer
  Task: <what you did>
  Work Log:
  - <steps>
  Stage Summary:
  - <files created/edited>
  ```

## View Router Mapping (the EXACT export names expected)
- `src/components/views/dashboard-view.tsx` → `export function DashboardView()` (DONE — do not touch)
- `src/components/views/transaksi-view.tsx` → `export function PemasukanView()` AND `export function PengeluaranView()`
- `src/components/views/tagihan-view.tsx` → `export function TagihanView()`
- `src/components/views/warga-view.tsx` → `export function WargaView()`
- `src/components/views/kegiatan-view.tsx` → `export function KegiatanView()`
- `src/components/views/kwitansi-view.tsx` → `export function KwitansiView()`
- `src/components/views/laporan-view.tsx` → `export function LaporanView()`
- `src/components/views/trafik-view.tsx` → `export function TrafikView()`
- `src/components/views/marketplace-view.tsx` → `export function MarketplaceView()`
- `src/components/views/pengaduan-view.tsx` → `export function PengaduanView()`
- `src/components/views/pengumuman-view.tsx` → `export function PengumumanView()`
- `src/components/views/struktur-view.tsx` → `export function StrukturView()`
- `src/components/views/whatsapp-view.tsx` → `export function WhatsappView()`
- `src/components/views/tautan-view.tsx` → `export function TautanView()`
- `src/components/views/pengaturan-view.tsx` → `export function PengaturanView()`

---

## UPDATE ROUND 2 — New APIs & Patterns (read this section too)

### New APIs added
- `POST /api/upload` — FormData field `file` (image png/jpg/webp/gif/svg, max 4MB) → `{ url: "/uploads/xxx.png", filename }`. Use to upload logo/QRIS images.
- `GET /api/pengaturan/logo` → `{ logoUrl, namaRT, rw, perumahan, kota, blok }` (brand settings for header)
- `GET /api/auth/users` → `{ items: User[], count }` where User = `{ id, email, nama, role, wargaId, telepon, foto, status, lastLogin, createdAt }`
- `POST /api/auth/users` body `{ email, password, nama, role, telepon?, wargaId? }` → created user (password hashed sha256 server-side). Roles: "admin"|"ketua"|"bendahara"|"pengurus"|"warga"
- `PATCH /api/auth/users/[id]` body `{ nama?, role?, telepon?, status?, wargaId?, foto?, password? }` (password optional, hashed if provided)
- `DELETE /api/auth/users/[id]`
- `POST /api/auth/login` body `{ email, password }` → `{ id, email, nama, role, wargaId, telepon, foto }` or 401
- `GET /api/warga/[id]/anggota` → `{ items: AnggotaKK[], count }` where AnggotaKK = `{ id, wargaId, nama, nik, jenisKelamin, hubungan, tanggalLahir, createdAt }`
- `POST /api/warga/[id]/anggota` body `{ nama, nik?, jenisKelamin?, hubungan?, tanggalLahir? }` → created
- `DELETE /api/warga/[id]/anggota/[anggotaId]`
- `GET /api/kwitansi` now returns `{ items: Kwitansi[], brand: { qrisImage, qrisUrl, namaBendahara, namaKetua, namaRT, bankNama, bankRekening, bankPemilik } }`
- `GET /api/warga` now includes `nik` and `noKK` fields per warga
- `POST /api/warga` now accepts `nik` and `noKK`
- `PATCH /api/pengaturan` accepts any key-value pairs (including `logo_url`, `qris_image`, `nama_bendahara`, `nama_ketua`, `ttd_bendahara`)

### New hooks / stores
- `import { useMounted } from "@/hooks/use-mounted"` — returns true after client mount. USE for any `new Date()` in render to avoid hydration mismatch: `{mounted ? formatTanggalID(new Date()) : "\u00A0"}`
- `import { useBrandStore } from "@/lib/brand-store"` — `{ logoUrl, namaRT, rw, perumahan, kota, blok, loaded, setBrand, load }`. Call `setBrand({ logoUrl: newUrl })` after uploading a logo to update the header INSTANTLY without reload.

### Image upload helper pattern (for logo/QRIS)
```tsx
async function uploadImage(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const j = await res.json();
  if (!res.ok) { toast.error(j.error); return null; }
  return j.url; // "/uploads/xxx.png"
}
```
For "by URL" option: just use the URL string the user pasted (validate it starts with http).

### Hydration rule (CRITICAL)
NEVER call `new Date()`, `Date.now()`, or `Math.random()` directly in a render body. Always gate with `useMounted()`. The app crashed on mobile because of this. Pattern:
```tsx
const mounted = useMounted();
// in JSX:
{mounted ? formatTanggalID(new Date()) : "\u00A0"}
```
