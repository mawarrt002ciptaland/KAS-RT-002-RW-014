"use client";

import { useState } from "react";
import { useFetch, patchJSON } from "@/hooks/use-fetch";
import {
  PageHeader, SectionTitle, ErrorState, CardSkeleton, Card,
} from "@/components/shared";
import { RT_INFO } from "@/lib/constants";
import { useAppStore } from "@/lib/store";
import { formatRupiah, parseRupiahInput, toThousandInput } from "@/lib/format";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings, Sun, Moon, LogOut, UserCog, Wallet, Building2, Save, RefreshCw,
} from "lucide-react";

interface PengaturanResponse {
  settings: Record<string, string>;
  items: { key: string; value: string; kategori?: string | null }[];
}

const PROFIL_KEYS = ["nama_rt", "rw", "perumahan", "kota", "periode_pengurus", "alamat"] as const;
const KEUANGAN_KEYS = [
  "iuran_bulanan", "iuran_keamanan", "iuran_kebersihan",
  "bank_nama", "bank_rekening", "bank_pemilik", "qris_url",
] as const;

export function PengaturanView() {
  const { data, loading, error, refetch } = useFetch<PengaturanResponse>("/api/pengaturan");
  const { theme, setTheme } = useTheme();
  const { role, setRole } = useAppStore();
  const [tab, setTab] = useState("profil");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // "Draft overlay": show draft value when present, else fall back to server value.
  function getValue(key: string): string {
    return key in draft ? draft[key] : data?.settings?.[key] ?? "";
  }
  function setValue(key: string, v: string) {
    setDraft((prev) => ({ ...prev, [key]: v }));
  }
  function clearDraft(keys: readonly string[]) {
    setDraft((prev) => {
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });
  }

  async function saveProfil() {
    const changes: Record<string, string> = {};
    for (const k of PROFIL_KEYS) if (k in draft) changes[k] = draft[k];
    if (Object.keys(changes).length === 0) return toast.info("Tidak ada perubahan");
    setSaving(true);
    const r = await patchJSON("/api/pengaturan", changes);
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Profil RT disimpan");
    clearDraft(PROFIL_KEYS);
    refetch();
  }

  async function saveKeuangan() {
    const changes: Record<string, string> = {};
    for (const k of KEUANGAN_KEYS) {
      if (!(k in draft)) continue;
      changes[k] = k.startsWith("iuran_")
        ? String(parseRupiahInput(draft[k] || "0"))
        : draft[k];
    }
    if (Object.keys(changes).length === 0) return toast.info("Tidak ada perubahan");
    setSaving(true);
    const r = await patchJSON("/api/pengaturan", changes);
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Pengaturan keuangan disimpan");
    clearDraft(KEUANGAN_KEYS);
    refetch();
  }

  const isDark = theme === "dark";

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Pengaturan" icon={<Settings className="h-5 w-5" />} />
        <CardSkeleton className="h-12" />
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Pengaturan" icon={<Settings className="h-5 w-5" />} />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil RT, keuangan, tampilan, & akun"
        icon={<Settings className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={refetch} className="touch-target">
            <RefreshCw className="h-4 w-4" /> Muat Ulang
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="profil" className="flex-1"><Building2 className="h-3.5 w-3.5" /> Profil</TabsTrigger>
          <TabsTrigger value="keuangan" className="flex-1"><Wallet className="h-3.5 w-3.5" /> Keuangan</TabsTrigger>
          <TabsTrigger value="tampilan" className="flex-1"><Sun className="h-3.5 w-3.5" /> Tampilan</TabsTrigger>
          <TabsTrigger value="akun" className="flex-1"><UserCog className="h-3.5 w-3.5" /> Akun</TabsTrigger>
        </TabsList>

        {/* Profil RT */}
        <TabsContent value="profil" className="mt-3">
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Profil RT" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama RT" value={getValue("nama_rt")} onChange={(v) => setValue("nama_rt", v)} placeholder="RT 002 Blok Mawar" />
              <Field label="RW" value={getValue("rw")} onChange={(v) => setValue("rw", v)} placeholder="014" />
              <Field label="Perumahan" value={getValue("perumahan")} onChange={(v) => setValue("perumahan", v)} placeholder="Ciptaland" />
              <Field label="Kota" value={getValue("kota")} onChange={(v) => setValue("kota", v)} placeholder="Batam" />
              <Field label="Periode Pengurus" value={getValue("periode_pengurus")} onChange={(v) => setValue("periode_pengurus", v)} placeholder="2024-2027" />
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="set-alamat">Alamat</Label>
                <Textarea
                  id="set-alamat"
                  rows={2}
                  value={getValue("alamat")}
                  onChange={(e) => setValue("alamat", e.target.value)}
                  placeholder="Alamat lengkap RT"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveProfil} disabled={saving} className="touch-target">
                <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Keuangan */}
        <TabsContent value="keuangan" className="mt-3">
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Pengaturan Keuangan" />
            <div className="grid gap-3 sm:grid-cols-2">
              <RupiahField label="Iuran Bulanan" value={getValue("iuran_bulanan")} onChange={(v) => setValue("iuran_bulanan", v)} />
              <RupiahField label="Iuran Keamanan" value={getValue("iuran_keamanan")} onChange={(v) => setValue("iuran_keamanan", v)} />
              <RupiahField label="Iuran Kebersihan" value={getValue("iuran_kebersihan")} onChange={(v) => setValue("iuran_kebersihan", v)} />
              <Field label="Nama Bank" value={getValue("bank_nama")} onChange={(v) => setValue("bank_nama", v)} placeholder="Bank BRI" />
              <Field label="No. Rekening" value={getValue("bank_rekening")} onChange={(v) => setValue("bank_rekening", v)} placeholder="1234-5678-9012-3" />
              <Field label="Atas Nama" value={getValue("bank_pemilik")} onChange={(v) => setValue("bank_pemilik", v)} placeholder="Endang Marliana" />
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="set-qris">URL QRIS</Label>
                <Input
                  id="set-qris"
                  inputMode="url"
                  value={getValue("qris_url")}
                  onChange={(e) => setValue("qris_url", e.target.value)}
                  placeholder="https://qris.id/..."
                  className="touch-target"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveKeuangan} disabled={saving} className="touch-target">
                <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Tampilan */}
        <TabsContent value="tampilan" className="mt-3">
          <Card className="divide-y p-0">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                {isDark ? <Moon className="mt-0.5 h-5 w-5 text-primary" /> : <Sun className="mt-0.5 h-5 w-5 text-primary" />}
                <div>
                  <p className="text-sm font-medium">Tema Gelap</p>
                  <p className="text-xs text-muted-foreground">Beralih antara mode terang & gelap</p>
                </div>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={(c) => setTheme(c ? "dark" : "light")}
                aria-label="Tema gelap"
              />
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                <UserCog className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Mode Tampilan Warga</p>
                  <p className="text-xs text-muted-foreground">Tampilan mobile sederhana untuk warga</p>
                </div>
              </div>
              <Switch
                checked={role === "warga"}
                onCheckedChange={(c) => setRole(c ? "warga" : "admin")}
                aria-label="Mode warga"
              />
            </div>
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">
            Perubahan tampilan langsung tersimpan otomatis di perangkat ini.
          </p>
        </TabsContent>

        {/* Akun */}
        <TabsContent value="akun" className="mt-3">
          <Card className="p-4 sm:p-5">
            <SectionTitle title="Akun" />
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
                RT
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">Admin RT 002</p>
                <p className="truncate text-sm text-muted-foreground">admin@rt002mawar.id</p>
                <Badge variant="secondary" className="mt-1">Administrator</Badge>
              </div>
            </div>
            <dl className="mt-4 grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Versi Aplikasi</dt>
                <dd className="font-medium">v1.0.0</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">RT / RW</dt>
                <dd className="font-medium">{RT_INFO.rt} / {RT_INFO.rw}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Perumahan</dt>
                <dd className="font-medium">{RT_INFO.perumahan}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Admin WhatsApp</dt>
                <dd className="font-medium">+{RT_INFO.whatsappAdmin}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end">
              <Button
                variant="destructive"
                className="touch-target"
                onClick={() => toast.info("Anda telah keluar.")}
              >
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="touch-target"
      />
    </div>
  );
}

function RupiahField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const num = parseRupiahInput(value || "");
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        inputMode="numeric"
        value={value ? toThousandInput(num) : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="touch-target"
      />
      <p className="text-xs text-muted-foreground">{formatRupiah(num)}</p>
    </div>
  );
}
