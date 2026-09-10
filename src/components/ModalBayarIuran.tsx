"use client";

import React, { useState } from "react";
import { X, QrCode, CheckCircle2, Copy, Check, Building2, CreditCard } from "lucide-react";

interface BayarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: {
    id: number;
    wargaNama?: string | null;
    wargaNoRumah?: string | null;
    bulan: string;
    totalTagihan: number;
    nominalKas: number;
    nominalSampah: number;
  } | null;
}

export function ModalBayarIuran({ isOpen, onClose, onSuccess, item }: BayarModalProps) {
  const [metode, setMetode] = useState("Transfer BCA / QRIS");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catatan, setCatatan] = useState("");

  if (!isOpen || !item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText("8720192831");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tagihan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: "lunas",
          metode,
          catatan: catatan || `Lunas via ${metode}`,
        }),
      });

      if (!res.ok) throw new Error("Gagal konfirmasi");

      onSuccess();
      onClose();
    } catch (e) {
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden text-center">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-base font-black text-slate-800">Bayar Iuran Warga</h3>
            <p className="text-xs text-slate-500">
              {item.wargaNama} ({item.wargaNoRumah}) · {item.bulan}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Amount Box */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <div className="text-left">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                Total Tagihan Iuran
              </span>
              <span className="text-xl font-black text-slate-900">
                Rp {item.totalTagihan.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              <p>Kas RT: Rp {item.nominalKas.toLocaleString("id-ID")}</p>
              <p>Sampah: Rp {item.nominalSampah.toLocaleString("id-ID")}</p>
            </div>
          </div>

          {/* QRIS Code */}
          <div className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Scan QRIS Resmi RT 002</span>
            </div>
            {/* Real dynamic QRIS image */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=KAS-RT002-BLOKMAWAR-TAGIHAN-${item.id}-${item.totalTagihan}`}
              alt="QRIS Tagihan RT"
              className="w-44 h-44 rounded-xl border border-slate-100 p-1 shadow-sm"
            />
            <span className="text-[10px] text-slate-400 mt-2 font-mono">
              NMID: ID1020038192083
            </span>
          </div>

          {/* Bank Transfer Option */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-left flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-700">Bank Central Asia (BCA)</p>
              <p className="text-sm font-black text-slate-900 font-mono tracking-wide">
                8720192831
              </p>
              <p className="text-[10px] text-slate-500">a.n KAS RT 002 BLOK MAWAR</p>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Disalin!" : "Salin"}</span>
            </button>
          </div>

          {/* Select payment method */}
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={metode}
              onChange={(e) => setMetode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
            >
              <option value="Transfer BCA / QRIS">Transfer BCA / QRIS</option>
              <option value="Transfer Bank Lain">Transfer Bank Lain</option>
              <option value="Tunai ke Bendahara">Tunai ke Bendahara</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Memproses..." : "Konfirmasi Pembayaran"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
