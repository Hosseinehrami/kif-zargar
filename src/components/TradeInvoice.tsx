"use client";

import { useState } from "react";
import { COMPANY_INFO } from "@/lib/company-info";

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toFa = (s: string) =>
  s.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/\./g, "٫");

function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length !== 11) return clean || "—";
  const fa = (s: string) => s.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
  return `${fa(clean.slice(0, 4))} ${fa(clean.slice(4, 7))} ${fa(clean.slice(7))}`;
}

const RECEIPT_SECRET = "KFZ_2025_SECRET";

function generateReceiptHash(data: Record<string, unknown>): string {
  const payload = JSON.stringify(data) + RECEIPT_SECRET;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  let hash2 = hash;
  for (let i = 0; i < payload.length; i++) {
    hash2 ^= payload.charCodeAt(i) ^ 0xa5;
    hash2 = Math.imul(hash2, 0x01000193) >>> 0;
  }
  return (hash.toString(16).padStart(8, "0") + hash2.toString(16).padStart(8, "0")).toUpperCase();
}

function generateVerificationCode(hash: string): string {
  return `KFZ-${hash.slice(0, 4)}-${hash.slice(8, 12)}`;
}

function generateQRPattern(seed: string, size = 21): boolean[][] {
  const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (ox + x < size && oy + y < size) grid[oy + y][ox + x] = isBorder || isCenter;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) continue;
      if (x < 8 && y < 8) continue;
      if (x >= size - 8 && y < 8) continue;
      if (x < 8 && y >= size - 8) continue;
      s = (s * 1103515245 + 12345) >>> 0;
      grid[y][x] = (s & 1) === 1;
    }
  }
  return grid;
}

export type TradeInvoiceData = {
  trackingCode: string;
  dateTime: string;
  side: "buy" | "sell";
  orderType: "instant" | "limit";
  symbolName: string;
  unit: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  finalAmount: number;
  paymentMethod: "rial" | "gold";
  buyer: {
    name: string;
    nationalId: string;
    phone: string;
  };
};

export default function TradeInvoice({
  trade,
  onClose,
}: {
  trade: TradeInvoiceData;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const receiptHash = generateReceiptHash({
    trackingCode: trade.trackingCode,
    amount: trade.amount,
    price: trade.price,
    total: trade.total,
    dateTime: trade.dateTime,
  });
  const verificationCode = generateVerificationCode(receiptHash);

  const buyerPhone = trade.buyer?.phone?.trim() || "";
  const buyerNationalId = trade.buyer?.nationalId?.trim() || "";
  const buyerName = trade.buyer?.name?.trim() || "کاربر کیف زرگر";

  async function shareInvoice() {
    const text = `🧾 فاکتور رسمی ${trade.side === "buy" ? "خرید" : "فروش"} — ${COMPANY_INFO.brandName}
━━━━━━━━━━━━━━━━━━
شماره: ${trade.trackingCode}
تاریخ: ${trade.dateTime}

🏢 فروشنده: ${COMPANY_INFO.legalName}
شناسه ملی: ${COMPANY_INFO.nationalId} · کد اقتصادی: ${COMPANY_INFO.economicCode}

👤 خریدار: ${buyerName}
کد ملی: ${buyerNationalId || "—"} · موبایل: ${buyerPhone || "—"}

━━━━━━━━━━━━━━━━━━
${trade.symbolName} · ${toFa(trade.amount.toFixed(4))} ${trade.unit}
قیمت واحد: ${format(trade.price)} تومان
ارزش کل: ${format(trade.total)} تومان
کارمزد: ${format(trade.fee)} تومان
مبلغ نهایی: ${format(trade.finalAmount)} تومان

🔍 استعلام: ${verificationCode}
🌐 kifzargar.com/verify/${trade.trackingCode}`;

    if (navigator.share) {
      try { await navigator.share({ title: "فاکتور رسمی", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="max-w-sm w-full my-4" onClick={e => e.stopPropagation()}>

        {/* کارت موفقیت کوچک */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-emerald-400">
              {trade.side === "buy" ? "خرید" : "فروش"} با موفقیت انجام شد
            </div>
            <div className="text-[9px] text-[var(--muted)] mt-0.5">فاکتور رسمی صادر شد</div>
          </div>
        </div>

        {/* فاکتور جمع‌وجور */}
        <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-[var(--panel)] overflow-hidden relative">
          {/* واترمارک */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.025]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-serif italic font-black whitespace-nowrap -rotate-[25deg] text-[var(--gold)]" style={{ fontSize: 48, letterSpacing: "0.15em" }}>
                KIFE ZARGAR
              </div>
            </div>
          </div>

          {/* هدر با QR */}
          <div className="relative bg-gradient-to-l from-[var(--gold)]/20 to-[var(--gold)]/5 border-b-2 border-[var(--gold)]/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-[var(--gold)]">فاکتور رسمی معامله</div>
                <div className="text-[8px] text-[var(--muted)] mt-0.5">کیف زرگر · KIFE ZARGAR</div>
                <div className="mt-2 space-y-0.5 text-[9px]">
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--muted)]">شماره:</span>
                    <span className="font-mono font-bold text-[var(--text)]" dir="ltr">{trade.trackingCode}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--muted)]">تاریخ:</span>
                    <span className="font-mono text-[var(--text)]">{trade.dateTime}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 bg-white p-1 rounded">
                <svg width="56" height="56" viewBox="0 0 21 21" shapeRendering="crispEdges">
                  {generateQRPattern(receiptHash).map((row, y) =>
                    row.map((filled, x) =>
                      filled ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" /> : null
                    )
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* فروشنده و خریدار — دو ستون */}
          <div className="relative grid grid-cols-2 divide-x divide-[var(--border)] border-b border-[var(--border)]">
            <div className="p-2.5">
              <div className="text-[7.5px] font-bold text-[var(--gold)] uppercase tracking-wider mb-1">فروشنده</div>
              <div className="text-[9.5px] font-bold text-[var(--text)] mb-1 leading-tight">{COMPANY_INFO.legalName}</div>
              <div className="space-y-0.5 text-[8px] text-[var(--muted)] leading-relaxed">
                <div>شناسه ملی: <span className="text-[var(--text)] font-mono" dir="ltr">{COMPANY_INFO.nationalId}</span></div>
                <div>کد اقتصادی: <span className="text-[var(--text)] font-mono" dir="ltr">{COMPANY_INFO.economicCode}</span></div>
                <div>تلفن: <span className="text-[var(--text)] font-mono" dir="ltr">{COMPANY_INFO.phone}</span></div>
              </div>
            </div>
            <div className="p-2.5">
              <div className="text-[7.5px] font-bold text-[var(--gold)] uppercase tracking-wider mb-1">خریدار</div>
              <div className="text-[9.5px] font-bold text-[var(--text)] mb-1 leading-tight">{buyerName}</div>
              <div className="space-y-0.5 text-[8px] text-[var(--muted)] leading-relaxed">
                <div>کد ملی: <span className="text-[var(--text)] font-mono" dir="ltr">{buyerNationalId || "—"}</span></div>
                <div>موبایل: <span className="text-[var(--text)] font-mono whitespace-nowrap" dir="ltr">{buyerPhone ? formatPhone(buyerPhone) : "—"}</span></div>
              </div>
            </div>
          </div>

          {/* جدول اقلام */}
          <div className="relative p-3 border-b border-[var(--border)]">
            <table className="w-full text-[9.5px]">
              <thead>
                <tr className="text-[7.5px] text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">
                  <th className="text-right pb-1.5 font-bold">شرح</th>
                  <th className="text-center pb-1.5 font-bold w-20">مقدار</th>
                  <th className="text-left pb-1.5 font-bold w-24">مبلغ (تومان)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pt-2 align-top">
                    <div className="font-bold text-[var(--text)]">{trade.symbolName}</div>
                    <div className="text-[8px] text-[var(--muted)] mt-0.5">{format(trade.price)} تومان / {trade.unit}</div>
                  </td>
                  <td className="pt-2 text-center font-bold text-[var(--text)] align-top whitespace-nowrap">
                    {toFa(trade.amount.toFixed(trade.unit === "گرم" ? 4 : 0))} <span className="text-[7.5px] text-[var(--muted)] font-normal">{trade.unit}</span>
                  </td>
                  <td className="pt-2 text-left font-bold text-[var(--text)] align-top">{format(trade.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* جمع‌بندی */}
          <div className="relative p-3 border-b border-[var(--border)] space-y-1.5 text-[10px]">
            <div className="flex justify-between text-[var(--muted)]">
              <span>کارمزد (۱٪)</span>
              <span className="text-[var(--text)]">{format(trade.fee)} تومان</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1.5 items-center">
              <span className="font-bold text-[var(--text)]">
                {trade.side === "buy" ? "مبلغ پرداختی" : "مبلغ دریافتی"}
              </span>
              <span className="font-black text-[var(--gold)] text-sm">{format(trade.finalAmount)} <span className="text-[8px] font-normal">تومان</span></span>
            </div>
          </div>

          {/* نوع و روش پرداخت — دو ستون */}
          <div className="relative grid grid-cols-2 divide-x divide-[var(--border)] border-b border-[var(--border)] text-[9px]">
            <div className="p-2 flex items-center justify-between">
              <span className="text-[var(--muted)]">نوع</span>
              <span className={`font-bold ${trade.side === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                {trade.side === "buy" ? "↙ خرید" : "↗ فروش"} · {trade.orderType === "instant" ? "آنی" : "سفارش"}
              </span>
            </div>
            <div className="p-2 flex items-center justify-between">
              <span className="text-[var(--muted)]">پرداخت</span>
              <span className="font-bold text-[var(--text)]">
                {trade.paymentMethod === "rial" ? "💵 ریالی" : "🪙 طلایی"}
              </span>
            </div>
          </div>

          {/* استعلام + مهر */}
          <div className="relative grid grid-cols-[1fr_auto] divide-x divide-[var(--border)]">
            <div className="p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-[7.5px] font-bold text-emerald-400">امضای دیجیتال</span>
              </div>
              <div className="font-mono text-[9px] font-black text-[var(--gold)] tracking-wider" dir="ltr">{verificationCode}</div>
              <div className="text-[7.5px] text-[var(--muted)] font-mono mt-0.5 truncate" dir="ltr">
                kifzargar.com/verify/{trade.trackingCode}
              </div>
            </div>
            <div className="p-2.5 flex items-center justify-center">
              {/* ⭐ محل مهر — بعداً با <img> جایگزین کن */}
              <div className="w-20 h-14 rounded border border-dashed border-[var(--gold)]/30 flex flex-col items-center justify-center bg-[var(--bg)]/30">
                <div className="text-[7px] font-black text-[var(--gold)]/50 leading-tight">KIFE ZARGAR</div>
                <div className="text-[6px] text-[var(--gold)]/40 mt-0.5">مهر رسمی</div>
              </div>
            </div>
          </div>

          {/* پاورقی */}
          <div className="relative bg-[var(--gold)]/5 border-t border-[var(--gold)]/20 px-2.5 py-1.5 text-center">
            <div className="text-[8px] text-[var(--muted)]">
              این فاکتور الکترونیکی است · {COMPANY_INFO.website}
            </div>
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={shareInvoice}
            className="flex-1 h-9 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)] font-bold text-[11px] hover:bg-[var(--gold)]/20 transition flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                کپی شد
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                اشتراک‌گذاری
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] font-bold text-[11px] hover:bg-[var(--panel)] transition"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}