"use client";

import { useEffect } from "react";
import { useBrandStore } from "@/lib/brand-store";

/** Loads RT brand (logo, name) once on client mount. */
export function BrandLoader() {
  const load = useBrandStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);
  return null;
}
