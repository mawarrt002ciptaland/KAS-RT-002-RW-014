"use client";

import { create } from "zustand";

interface BrandState {
  logoUrl: string;
  namaRT: string;
  rw: string;
  perumahan: string;
  kota: string;
  blok: string;
  loaded: boolean;
  setBrand: (b: Partial<Omit<BrandState, "setBrand" | "loaded">>) => void;
  load: () => Promise<void>;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  logoUrl: "",
  namaRT: "RT 002",
  rw: "014",
  perumahan: "Ciptaland",
  kota: "Batam",
  blok: "Mawar",
  loaded: false,
  setBrand: (b) => set(b),
  load: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch("/api/pengaturan/logo");
      if (res.ok) {
        const b = await res.json();
        set({ logoUrl: b.logoUrl || "", namaRT: b.namaRT, rw: b.rw, perumahan: b.perumahan, kota: b.kota, blok: b.blok, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));
