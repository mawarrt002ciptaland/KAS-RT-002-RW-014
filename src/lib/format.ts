// Format helpers for SISTEM INFORMASI RT 002

const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Format number to Rupiah: Rp 8.002.313 */
export function formatRupiah(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return "Rp " + v.toLocaleString("id-ID");
}

/** Compact rupiah for tight spaces: Rp 8 jt */
export function formatRupiahCompact(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1_000_000_000) return "Rp " + (v / 1_000_000_000).toFixed(1) + " M";
  if (Math.abs(v) >= 1_000_000) return "Rp " + (v / 1_000_000).toFixed(1) + " jt";
  if (Math.abs(v) >= 1_000) return "Rp " + (v / 1_000).toFixed(0) + " rb";
  return "Rp " + v.toLocaleString("id-ID");
}

/** Parse rupiah-formatted input back to integer */
export function parseRupiahInput(s: string): number {
  const cleaned = s.replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/** Format an input value to grouped thousands while typing */
export function toThousandInput(n: number): string {
  if (!n) return "";
  return n.toLocaleString("id-ID");
}

/** Format date: 31 Agustus 2026 */
export function formatTanggalID(d: Date | string | number): string {
  const date = new Date(d);
  return `${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** Format date with weekday: Senin, 31 Agustus 2026 */
export function formatTanggalLengkapID(d: Date | string | number): string {
  const date = new Date(d);
  return `${HARI_ID[date.getDay()]}, ${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** Format date to ISO yyyy-mm-dd for input[type=date] */
export function toISODate(d: Date | string | number): string {
  const date = new Date(d);
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 10);
}

/** Format time: 14:30 */
export function formatJam(d: Date | string | number): string {
  const date = new Date(d);
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** Relative time: "2 jam lalu", "3 hari lalu" */
export function relativeTime(d: Date | string | number): string {
  const date = new Date(d);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
  if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
  if (diff < 604800) return Math.floor(diff / 86400) + " hari lalu";
  return formatTanggalID(date);
}

/** Month key: "2026-08" */
export function monthKey(d: Date | string | number): string {
  const date = new Date(d);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

/** Short month label: "Agu 26" */
export function shortMonthLabel(d: Date | string | number): string {
  const date = new Date(d);
  const m = BULAN_ID[date.getMonth()].slice(0, 3);
  return `${m} ${String(date.getFullYear()).slice(2)}`;
}

export { BULAN_ID, HARI_ID };
