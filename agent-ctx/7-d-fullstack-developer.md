# Task 7-d — Struktur Pengurus View Refine (Clean Org Chart)

**Agent:** full-stack-developer
**Task:** Refine `src/components/views/struktur-view.tsx` to a cleaner, more standard top-down org-chart layout (green theme).

## What I read first
- `/home/z/my-project/CONTEXT-FOR-AGENTS.md` (all 3 sections) — conventions, hydration rule, shared components.
- `/home/z/my-project/worklog.md` — prior tasks (1, 5-x, 6-x, FINAL, HYDRATION-FIX-2).
- `/home/z/my-project/src/components/views/struktur-view.tsx` (398 lines, prior 3-tier version).
- `/home/z/my-project/src/components/shared/index.tsx` — PageHeader/EmptyState/ErrorState/CardSkeleton/Card/openWhatsApp signatures.
- `/home/z/my-project/src/hooks/use-fetch.ts` — useFetch/postJSON/patchJSON/deleteJSON.
- `/home/z/my-project/src/hooks/use-mounted.ts` — hydration-safe (useSyncExternalStore, no setState-in-effect).
- `/home/z/my-project/src/components/ui/avatar.tsx` — Radix Avatar (img fallback).
- `/home/z/my-project/src/lib/constants.ts` — RT_INFO.

## File I edited (only this one)
`/home/z/my-project/src/components/views/struktur-view.tsx` (411 lines — slightly over ~400 guideline due to connectors + 3 tier cards + dialog; within tolerance).

## Key refinements vs prior version
1. **PageHeader**: unchanged — title "Struktur Pengurus RT 002", Network icon, "+ Tambah Pengurus" action.
2. **HERO BANNER** (cleaner copy):
   - Eyebrow: "PENGURUS RT 002 BLOK MAWAR" (uppercase tracking-wider, small).
   - Big title: "Struktur Organisasi" (text-2xl sm:text-3xl bold).
   - Subtitle: "Periode {periode} • Perumahan Ciptaland, Batam".
   - Small Crown icon badge on right (rounded-xl bg-white/15 backdrop-blur) showing "Periode / {periode}".
3. **ORG CHART — vertical top-down hierarchy with connector divs**:
   - **LEVEL 1 — Ketua RT** (centered `mx-auto max-w-md`): single card `border-2 border-primary bg-primary/5`. 96px circular Avatar (AvatarImage if foto, else green AvatarFallback with initials). **Crown icon overlay** absolute-positioned top-right of the avatar (`absolute -right-1 -top-1 ... bg-primary text-primary-foreground ring-2 ring-background`). nama `text-xl font-bold`. jabatan in green pill Badge with Crown icon. bidang muted small. telepon (Phone, openWhatsApp) + email (mailto) row, muted xs.
   - **ConnectorV**: `mx-auto my-1 h-8 w-0.5 bg-primary/30 sm:h-10` between L1 and L2.
   - **LEVEL 2 — Bendahara + Sekretaris** (`mx-auto grid max-w-3xl gap-4 sm:grid-cols-2`, mobile stacks to 1 col): each card `border border-primary/40 bg-card`, 64px Avatar with ring-2 ring-primary/15. nama semibold. jabatan in green outline Badge. bidang muted. telepon+email row xs.
   - **ConnectorBranch**: vertical drop (`h-8 sm:h-10`) → desktop horizontal bar (`hidden sm:block h-0.5 w-full max-w-3xl`) → small vertical drop (`h-4`) into L3.
   - **LEVEL 3 — Koordinator** (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`): each card standard `card-hover relative p-4`, 48px Avatar. nama semibold. jabatan Badge variant="secondary". bidang muted. telepon+email grid xs.
   - Detection regex: Ketua `/ketua/i`, Bendahara `/bendahara/i`, Sekretaris `/sekretaris/i`. Koordinator = remaining items, sorted by urutan then nama. If a tier is empty, that tier + its connectors are skipped (no broken layout).
4. **Empty state**: EmptyState with Network icon + "+ Tambah Pengurus" CTA when `items.length === 0`.
5. **Loading**: `OrgChartSkeleton` mirrors the 3-tier layout (max-w-md skeleton for L1, max-w-3xl 2-col for L2, 3-col for L3) with ConnectorV + ConnectorBranch in between.
6. **TAMBAH/EDIT DIALOG**:
   - Circular avatar PREVIEW at top (80px green circle, ring-2 ring-primary/20) showing live `initials(form.nama)` or User icon if empty.
   - Nama (required) Input.
   - Jabatan (required) Select combobox with 9 suggestions: "Ketua RT 002", "Bendahara RT 002", "Sekretaris RT 002", "Koordinator Keamanan/Kebersihan/Sosial/Pemuda/Agama", "Staf Administrasi" + "Lainnya…" → reveals custom Input.
   - Bidang (Input, placeholder "Pimpinan / Keuangan / Keamanan / ...").
   - Telepon (tel) + Email (email) — 2-col grid.
   - Urutan (number, default 0).
   - Footer: Batal (outline) + Simpan (disabled while submitting).
   - Create: postJSON → toast.success("Pengurus ditambahkan") → close + refetch.
   - Edit: prefill + patchJSON → toast.success("Perubahan disimpan") → close + refetch.
7. **Each card** has subtle Edit + Hapus icon buttons top-right (ghost, h-8 w-8 for L1/L2, h-7 w-7 for L3, aria-labels). Hapus via AlertDialog confirm (destructive red button, async deleteJSON → toast.success + refetch).
8. **Hydration**: no `new Date()` in render → no useMounted needed (periode is data-driven from `items[0]?.periode || "2024-2027"`). No `useEffect(() => setX(...))` anywhere.

## Imports used
- `useFetch, postJSON, patchJSON, deleteJSON` from `@/hooks/use-fetch`.
- `PageHeader, EmptyState, ErrorState, CardSkeleton, Card, openWhatsApp` from `@/components/shared`.
- `RT_INFO` from `@/lib/constants`.
- shadcn `Dialog, AlertDialog, Button, Input, Select, Label, Badge, Avatar`.
- `toast` from `sonner`.
- lucide `Network, Plus, Phone, Mail, Trash2, Edit, User, Crown`.
- Did NOT import `Image, Shield, Building2, Pencil, useMounted, StatCard, StatusBadge, SectionTitle, formatTanggalID` (spec mentioned them as available, but the design doesn't require them — kept imports tight to keep file size down).

## Mobile-first responsiveness
- L1 Ketua card: full-width on mobile (capped at max-w-md), avatar+text stacked vertically centered.
- L2 grid: 1 column on mobile (stacked Bendahara above Sekretaris), 2 columns on sm+.
- L3 grid: 1 column on mobile, 2 on sm, 3 on lg.
- Connectors: vertical-only on mobile, vertical+horizontal branch on desktop (sm+).
- All buttons ≥44px touch target via `.touch-target`.
- Dialog: `max-h-[90vh] overflow-y-auto sm:max-w-lg`.
- Avatar image fills properly via Radix Avatar.

## Lint verification
- `bun run lint` full project → 0 errors, 0 warnings (clean).
- Dev server healthy: GET / returns 200, GET /api/dashboard returns 200, no compile errors after edit.

## Stage Summary
- File edited (only this one): `/home/z/my-project/src/components/views/struktur-view.tsx` (411 lines).
- Refined hero banner (eyebrow + big title + subtitle + Crown badge).
- Org chart cleaner: max-w-md Ketua with Crown overlay → vertical connector → max-w-3xl 2-col Bendahara/Sekretaris → vertical+horizontal branch connector → 3-col Koordinator grid.
- Redesigned Tambah/Edit dialog: 80px green avatar preview (live initials), Jabatan combobox with 9 suggestions + Lainnya, Bidang/Telepon/Email/Urutan fields.
- Lint clean, dev server healthy, mobile-first responsive throughout, emerald theme (no indigo/blue).
