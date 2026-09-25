"use client";

import { useCallback, useEffect, useState } from "react";

/** Simple fetch hook with loading/error/refetch */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("[useFetch]", url, e);
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load } as const;
}

/** POST helper returning ok/error */
export async function postJSON(url: string, body: unknown) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false as const, error: json?.error || "Gagal menyimpan" };
    return { ok: true as const, data: json };
  } catch (e) {
    console.error("[postJSON]", url, e);
    return { ok: false as const, error: "Gagal terhubung ke server" };
  }
}

/** PATCH helper */
export async function patchJSON(url: string, body: unknown) {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false as const, error: json?.error || "Gagal memperbarui" };
    return { ok: true as const, data: json };
  } catch (e) {
    console.error("[patchJSON]", url, e);
    return { ok: false as const, error: "Gagal terhubung ke server" };
  }
}

/** DELETE helper */
export async function deleteJSON(url: string) {
  try {
    const res = await fetch(url, { method: "DELETE", headers: { Accept: "application/json" } });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { ok: false as const, error: j?.error || "Gagal menghapus" };
    }
    return { ok: true as const };
  } catch (e) {
    console.error("[deleteJSON]", url, e);
    return { ok: false as const, error: "Gagal terhubung ke server" };
  }
}
