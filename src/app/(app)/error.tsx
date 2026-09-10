"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">
            Terjadi Kendala Memuat Halaman
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data sedang dimuat atau koneksi terputus sejenak. Silakan muat ulang.
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl inline-flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Muat Ulang Halaman</span>
        </button>
      </div>
    </div>
  );
}
