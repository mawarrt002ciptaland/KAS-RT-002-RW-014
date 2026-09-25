// Navigation menu structure for SISTEM INFORMASI RT 002

export type MenuKey =
  | "dashboard"
  | "pemasukan"
  | "pengeluaran"
  | "tagihan"
  | "warga"
  | "kegiatan"
  | "kwitansi"
  | "laporan"
  | "trafik"
  | "marketplace"
  | "pengaduan"
  | "pengumuman"
  | "struktur"
  | "whatsapp"
  | "tautan"
  | "pengaturan";

export interface MenuItem {
  key: MenuKey;
  label: string;
  icon: string; // lucide icon name
  group: "utama" | "organisasi";
  description?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard", group: "utama", description: "Ringkasan keuangan & aktivitas RT" },
  { key: "pemasukan", label: "Pemasukan", icon: "TrendingUp", group: "utama", description: "Catat & kelola pemasukan kas RT" },
  { key: "pengeluaran", label: "Pengeluaran", icon: "TrendingDown", group: "utama", description: "Catat & kelola pengeluaran kas RT" },
  { key: "tagihan", label: "Tagihan Warga", icon: "ReceiptText", group: "utama", description: "Kelola tagihan iuran warga" },
  { key: "warga", label: "Data Warga", icon: "Users", group: "utama", description: "Database kependudukan RT 002" },
  { key: "kegiatan", label: "Kegiatan Warga", icon: "CalendarDays", group: "utama", description: "Agenda & kegiatan RT" },
  { key: "kwitansi", label: "Kwitansi", icon: "FileText", group: "utama", description: "Cetak & kelola kwitansi" },
  { key: "laporan", label: "Laporan", icon: "BarChart3", group: "utama", description: "Laporan keuangan & statistik" },
  { key: "trafik", label: "Trafik Website", icon: "Globe", group: "utama", description: "Statistik pengunjung website" },
  { key: "marketplace", label: "Marketplace", icon: "ShoppingBag", group: "utama", description: "Dagangan warga RT" },
  { key: "pengaduan", label: "Pengaduan Warga", icon: "MessageSquareWarning", group: "utama", description: "Aduan & keluhan warga" },
  { key: "pengumuman", label: "Pengumuman", icon: "Megaphone", group: "utama", description: "Pengumuman & info RT" },
  { key: "struktur", label: "Struktur Pengurus", icon: "Network", group: "organisasi", description: "Struktur pengurus RT 002" },
  { key: "whatsapp", label: "WhatsApp Broadcast", icon: "Send", group: "organisasi", description: "Kirim broadcast WhatsApp" },
  { key: "tautan", label: "Tautan & Kontak", icon: "Link2", group: "organisasi", description: "Tautan & kontak penting" },
  { key: "pengaturan", label: "Pengaturan", icon: "Settings", group: "organisasi", description: "Pengaturan sistem" },
];

export const MENU_LABEL: Record<MenuKey, string> = MENU_ITEMS.reduce((acc, m) => {
  acc[m.key] = m.label;
  return acc;
}, {} as Record<MenuKey, string>);

// Categories for transactions
export const KATEGORI_PEMASUKAN = [
  "Iuran Bulanan Warga",
  "Iuran Keamanan",
  "Iuran Kebersihan",
  "Donasi / Sumbangan",
  "Ganti Rugi",
  "Bantuan Eksternal",
  "Lain-lain",
];

export const KATEGORI_PENGELUARAN = [
  "Keamanan",
  "Fasilitas",
  "Kebersihan",
  "Operasional RT",
  "Sosial / Kematian",
  "Kegiatan Warga",
  "Pembangunan",
  "Perlengkapan",
  "Honor / Insentif",
  "Lain-lain",
];

export const KATEGORI_PENGADUAN = [
  "Keamanan",
  "Fasilitas",
  "Kebersihan",
  "Sosial",
  "Lainnya",
];

export const KATEGORI_PENGUMUMAN = ["Umum", "Penting", "Mendesak", "Acara"];
export const KATEGORI_KEGIATAN = ["Sosial", "Keamanan", "Kebersihan", "Pertemuan", "Gotong Royong", "Olahraga"];
export const KATEGORI_MARKETPLACE = ["Makanan", "Jasa", "Barang", "Kuliner", "Otomotif", "Lainnya"];

// RT info constants
export const RT_INFO = {
  rt: "002",
  rw: "014",
  blok: "Mawar",
  perumahan: "Ciptaland",
  kota: "Batam",
  provinsi: "Kepulauan Riau",
  namaLengkap: "RT 002 / RW 014 Blok Mawar Perumahan Ciptaland Batam",
  whatsappAdmin: "6281234567890",
  alamat: "Blok Mawar, Perumahan Ciptaland, Batam, Kepulauan Riau",
};
