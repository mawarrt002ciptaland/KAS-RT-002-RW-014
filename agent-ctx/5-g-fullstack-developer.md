# Task 5-g — Pengaduan, Struktur, Tautan Views

Task ID: 5-g
Agent: full-stack-developer
Task: Build three views for SISTEM INFORMASI RT 002 — PengaduanView, StrukturView, TautanView.

## Files Created/Edited (only these three):
- `/home/z/my-project/src/components/views/pengaduan-view.tsx` (~310 lines)
- `/home/z/my-project/src/components/views/struktur-view.tsx` (~240 lines)
- `/home/z/my-project/src/components/views/tautan-view.tsx` (~225 lines)

## Approach

### PengaduanView
- PageHeader: title "Pengaduan Warga" + MessageSquareWarning icon + "+ Buat Aduan" action.
- 4 StatCards: Total Aduan (default), Baru (neutral), Diproses (warning), Selesai (income).
- Filters: Tabs (Semua/Baru/Diproses/Selesai/Ditolak) + Select kategori (KATEGORI_PENGADUAN).
- Mobile: card list — kode (mono), judul, kategori badge, lokasi (MapPin), status badge, pelapor + relativeTime, [Tanggapi][Hapus]. Desktop: table inside Card with `scrollbar-thin overflow-x-auto` (Kode/Judul/Kategori/Lokasi/Status/Waktu/Aksi).
- Create Dialog: Kategori (Select), Judul, Deskripsi (Textarea), Lokasi (Input), Foto (styled file input with `capture="environment"`, stores filename as fotoUrl). On submit → postJSON + toast.success(`Aduan {kode} terkirim. Status: BARU`) + refetch.
- Detail/Tanggapi Dialog: shows all fields (deskripsi, lokasi, pelapor, tanggal, fotoUrl, tanggapan existing) + admin form (Status Select baru/proses/selesai/ditolak + Tanggapan Textarea). PATCH on Simpan + toast. Includes Hapus (AlertDialog).
- Uses: useFetch, postJSON, patchJSON, deleteJSON; useIsMobile; PageHeader/StatCard/StatusBadge/EmptyState/ErrorState/CardSkeleton/Card; formatTanggalID, relativeTime; KATEGORI_PENGADUAN, RT_INFO; shadcn Dialog/AlertDialog/Button/Input/Select/Label/Textarea/Badge/Table/Tabs; toast sonner; lucide MessageSquareWarning/Plus/MapPin/Trash2/Eye/Send/ImageIcon/Clock.

### StrukturView
- PageHeader: title "Struktur Pengurus RT 002" + Network icon + "+ Tambah Pengurus".
- Hero Card: border-primary/40 bg-primary/5 with Shield icon, "Pengurus RT 002 Blok Mawar", "Periode {periode}" (periode from first item or default "2024-2027").
- Ketua detection: any item where jabatan matches `/ketua\s*r(t|w)?/i` or `/^ketua$/i`. Ketua rendered as large full-width card (border-primary bg-primary/5) with Avatar (initials fallback), "Ketua RT" label, nama, jabatan, bidang badge, WhatsApp button (Phone icon → openWhatsApp with phone digits), Edit + Hapus icon buttons.
- Other pengurus: grid sm:2-col lg:3-col with PengurusCard (Avatar fallback User icon, nama bold, jabatan text-primary, bidang Badge, telepon clickable via openWhatsApp, email via mailto, Edit + Hapus buttons).
- Create/Edit Dialog: Nama, Jabatan, Bidang, Telepon, Email, Urutan (number). postJSON/patchJSON + toast + refetch.
- Hapus AlertDialog with destructive confirm.
- Loading: 4 CardSkeletons in grid; ErrorState with retry; EmptyState with create CTA.
- Uses: useFetch, postJSON, patchJSON, deleteJSON; PageHeader/EmptyState/ErrorState/CardSkeleton/Card/openWhatsApp; RT_INFO; shadcn Dialog/AlertDialog/Button/Input/Label/Badge/Avatar; toast sonner; lucide Network/Plus/Phone/Mail/Trash2/Edit/User/Shield.

### TautanView
- PageHeader: title "Tautan & Kontak" + Link2 icon + "+ Tambah Tautan".
- Filter: Select kategori (Semua + 5 categories: Sosial Media, Pemerintah, Layanan, Kontak, Umum).
- List: grid sm:1-col → sm:grid-cols-2. Each TautanCard: colored icon box per kategori (Sosial Media=primary+Instagram icon, Pemerintah=info+Building2, Layanan=success+Globe, Kontak=warning+MessageCircle, Umum=muted+ExternalLink), judul bold, deskripsi line-clamp-2 muted, button "Kunjungi" (ArrowRight) or "Hubungi" (WhatsappIcon = lucide Send aliased), small Trash2 button.
- Button behavior: if kategori="Kontak" AND url matches wa.me/whatsapp → extract phone digits → openWhatsApp(num, "Halo, saya warga RT 002 Mawar"). Else → window.open(url, "_blank", "noopener,noreferrer").
- Create Dialog: Judul, URL (type=url), Kategori (Select), Deskripsi (Textarea). postJSON + toast + refetch.
- Hapus AlertDialog.
- Uses: useFetch, postJSON, deleteJSON; PageHeader/EmptyState/ErrorState/CardSkeleton/Card/openWhatsApp; shadcn Dialog/AlertDialog/Button/Input/Label/Textarea/Select; toast sonner; lucide Link2/Plus/Trash2/Building2/Globe/ExternalLink/MessageCircle/Instagram/ArrowRight + Send as WhatsappIcon.

## Mobile-First Considerations
- All cards use card-hover, p-3 / p-4 / p-5 padding tokens.
- `touch-target` utility on action buttons (min 44×44px).
- Dialogs capped at `max-h-[90vh] overflow-y-auto`.
- Mobile Pengaduan: card list with 3 action buttons; Desktop: table wrapped in `scrollbar-thin overflow-x-auto`.
- Pengurus: 1-col mobile → 2-col tablet → 3-col desktop; Ketua always full-width above grid.
- Tautan: 1-col mobile → 2-col sm+.
- Emerald theme tokens only (no indigo/blue), theme tokens bg-primary/text-success/text-warning/text-info/text-destructive used throughout.
- ARIA labels on all icon-only buttons; sr-only class used for hidden file input.

## Lint
- `bunx eslint` on the three files: exit 0, no errors.
- Project-wide `bun run lint`: 5 errors total, ALL in OTHER files:
  - `.zscripts/gen-icon.cjs` (2 errors — `require()` imports, pre-existing)
  - `.zscripts/gen-stubs.cjs` (2 errors — `require()` imports, pre-existing)
  - `src/components/views/pengaturan-view.tsx` (1 error — setState-in-effect, pre-existing, NOT touched)
- 0 errors in my three files. (Note: Pengaturan view is owned by another agent; not modified by me.)
- Initial lint error in pengaduan-view.tsx: `useMemo` dep `[items]` rejected by react-hooks/preserve-manual-memoization because `items = data?.items || []` creates a new array reference per render. Fixed by switching dep to `[data]` and computing from `data?.items || []` inside the memo body (matches the warga-view pattern).

## Did NOT Modify
- src/app/page.tsx, app-shell, view-router
- Any API route (pengaduan/pengurus/tautan + [id])
- Prisma schema, lib/format, lib/constants, lib/db
- shared components (PageHeader, StatCard, etc.)
- Other view files (pengaturan-view.tsx lint issue is pre-existing and out of scope)
