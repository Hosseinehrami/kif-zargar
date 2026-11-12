"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type ReceiptKind = "trade" | "transfer" | "deposit" | "withdraw";

export type VerifiedReceipt = {
  kind: ReceiptKind;
  trackingCode: string;
  dateTime: string;
  amount: number;
  unit: string;
  finalAmount?: number;
  side?: "buy" | "sell";
  symbolName?: string;
  senderName?: string;
  recipientName?: string;
};

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toFa = (s: string) =>
  s.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/\./g, "٫");

async function lookupReceipt(code: string): Promise<VerifiedReceipt | null> {
  // 🔗 در بک‌اند واقعی → fetch(`/api/verify/${code}`)
  await new Promise(r => setTimeout(r, 900));

  const trimmed = code.trim().toUpperCase();
  const parts = trimmed.split("-");
  if (parts.length !== 2) return null;
  const [prefix, body] = parts;
  if (!body || body.length < 4) return null;

  if (prefix === "TRX") {
    return {
      kind: "transfer",
      trackingCode: trimmed,
      dateTime: "۲ روز پیش · ۱۴:۰۰",
      amount: 0.5,
      unit: "گرم",
      senderName: "کاربر کیف زرگر",
      recipientName: "علی رضایی",
    };
  }
  if (prefix === "TRD") {
    return {
      kind: "trade",
      trackingCode: trimmed,
      dateTime: "۰۹:۱۵ · ۱۴۰۴/۰۸/۲۰",
      amount: 2.5,
      unit: "گرم",
      side: "buy",
      symbolName: "طلای ۱۸ عیار",
      finalAmount: 48_177_000,
    };
  }
  if (prefix === "DEP" || prefix === "WDR") {
    return {
      kind: prefix === "DEP" ? "deposit" : "withdraw",
      trackingCode: trimmed,
      dateTime: "امروز · ۱۲:۴۰",
      amount: 10_000_000,
      unit: "تومان",
    };
  }
  return null;
}

const KIND_LABEL: Record<ReceiptKind, string> = {
  trade: "فاکتور معامله",
  transfer: "رسید انتقال طلا",
  deposit: "رسید واریز",
  withdraw: "رسید برداشت",
};

const KIND_ICON: Record<ReceiptKind, string> = {
  trade: "🧾",
  transfer: "⇄",
  deposit: "↙",
  withdraw: "↗",
};

export default function ReceiptDisplay({ code }: { code: string }) {
  const [state, setState] = useState<"loading" | "found" | "not_found">("loading");
  const [receipt, setReceipt] = useState<VerifiedReceipt | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setReceipt(null);

    lookupReceipt(code).then(result => {
      if (cancelled) return;
      if (result) {
        setReceipt(result);
        setState("found");
      } else {
        setState("not_found");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-[var(--panel)] overflow-hidden relative">
      {/* واترمارک */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.025]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="font-serif italic font-black whitespace-nowrap -rotate-[25deg] text-[var(--gold)]"
            style={{ fontSize: 56, letterSpacing: "0.15em" }}
          >
            KIFE ZARGAR
          </div>
        </div>
      </div>

      {/* هدر */}
      <div className="relative bg-gradient-to-l from-[var(--gold)]/20 to-[var(--gold)]/5 border-b-2 border-[var(--gold)]/40 p-3 flex items-center gap-2">
        <span className="text-base">🔍</span>
        <div>
          <div className="text-xs font-black text-[var(--gold)]">استعلام رسید</div>
          <div className="text-[9px] text-[var(--muted)] mt-0.5 font-mono" dir="ltr">
            {code}
          </div>
        </div>
      </div>

      {/* بدنه */}
      <div className="relative p-5 text-center min-h-[220px] flex flex-col items-center justify-center">
        {state === "loading" && (
          <>
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-[var(--gold)] opacity-30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin" />
              </div>
            </div>
            <div className="text-sm font-bold mb-1">در حال استعلام</div>
            <div className="text-[11px] text-[var(--muted)]">لطفاً صبر کنید...</div>
          </>
        )}

        {state === "not_found" && (
          <>
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-red-500 opacity-30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-bold text-red-400 mb-1">رسید یافت نشد</div>
            <div className="text-[11px] text-[var(--muted)] max-w-xs leading-relaxed">
              این کد در سامانه کیف زرگر ثبت نشده است
            </div>
            <div className="mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 leading-relaxed max-w-xs">
              ⚠️ این رسید ممکن است جعلی باشد. لطفاً برای بررسی بیشتر با پشتیبانی تماس بگیرید.
            </div>
          </>
        )}

        {state === "found" && receipt && (
          <>
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 bg-emerald-500 opacity-30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-bold text-emerald-400 mb-1">رسید معتبر است ✓</div>
            <div className="text-[10px] text-[var(--muted)] mb-4">
              این رسید در سامانه کیف زرگر ثبت شده است
            </div>

            {/* جزئیات */}
            <div className="w-full max-w-xs bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-3 text-right space-y-1.5 text-[10.5px]">
              <div className="flex justify-between items-center pb-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">نوع</span>
                <span className="font-bold text-[var(--text)] flex items-center gap-1">
                  <span>{KIND_ICON[receipt.kind]}</span>
                  {KIND_LABEL[receipt.kind]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">تاریخ</span>
                <span className="font-mono text-[var(--text)]">{receipt.dateTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">مقدار</span>
                <span className="font-bold text-[var(--gold)]">
                  {receipt.unit === "گرم"
                    ? toFa(receipt.amount.toFixed(4))
                    : format(receipt.amount)}{" "}
                  {receipt.unit}
                </span>
              </div>
              {receipt.symbolName && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">دارایی</span>
                  <span className="font-bold text-[var(--text)]">{receipt.symbolName}</span>
                </div>
              )}
              {receipt.side && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">نوع معامله</span>
                  <span className={`font-bold ${receipt.side === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                    {receipt.side === "buy" ? "خرید" : "فروش"}
                  </span>
                </div>
              )}
              {receipt.senderName && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">فرستنده</span>
                  <span className="font-bold text-[var(--text)]">{receipt.senderName}</span>
                </div>
              )}
              {receipt.recipientName && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">گیرنده</span>
                  <span className="font-bold text-[var(--text)]">{receipt.recipientName}</span>
                </div>
              )}
              {receipt.finalAmount !== undefined && (
                <div className="flex justify-between pt-1.5 border-t border-[var(--border)]">
                  <span className="text-[var(--muted)]">مبلغ نهایی</span>
                  <span className="font-bold text-[var(--gold)]">
                    {format(receipt.finalAmount)} تومان
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* پاورقی */}
      <div className="relative bg-[var(--gold)]/5 border-t border-[var(--gold)]/20 p-2.5 text-center">
        <div className="text-[9px] text-[var(--muted)] leading-relaxed">
          کیف زرگر · kifzargar.com
        </div>
      </div>
    </div>
  );
}