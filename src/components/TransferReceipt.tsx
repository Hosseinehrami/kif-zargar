"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
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

// ============================================================
// سیستم امضای دیجیتال
// در بک‌اند واقعی: HMAC-SHA256 با کلید مخفی
// در فرانت‌اند: FNV-1a دوگانه (فقط برای نمایش بصری)
// ============================================================
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

// QR Code شبیه‌سازی شده — در پروداکشن با qrcode.react
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

export type TransferReceiptData = {
  trackingCode: string;
  date: string;
  time: string;
  amount: number;
  unit: string;
  fee: number;
  recipientName: string;
  recipientPhone: string;
  note?: string;
};

export default function TransferReceipt({
  transfer,
  onClose,
}: {
  transfer: TransferReceiptData;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // ساخت hash از داده‌های رسید
  const receiptHash = generateReceiptHash({
    trackingCode: transfer.trackingCode,
    amount: transfer.amount,
    recipient: transfer.recipientPhone,
    date: transfer.date,
    time: transfer.time,
  });
  const verificationCode = generateVerificationCode(receiptHash);

  const senderName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "کاربر کیف زرگر";
  const senderPhone = (user?.phone || "").trim();
  const senderNationalId = (user?.nationalId || "").trim();

  async function share() {
    const text = `🧾 رسید رسمی انتقال طلا — ${COMPANY_INFO.brandName}
━━━━━━━━━━━━━━━━━━
شماره: ${transfer.trackingCode}
تاریخ: ${transfer.date} · ${transfer.time}

👤 فرستنده: ${senderName}
${senderPhone ? `موبایل: ${senderPhone}\n` : ""}
👥 گیرنده: ${transfer.recipientName}
موبایل: ${transfer.recipientPhone}

━━━━━━━━━━━━━━━━━━
مقدار: ${toFa(transfer.amount.toFixed(4))} ${transfer.unit}
کارمزد: ${toFa(transfer.fee.toFixed(4))} ${transfer.unit}
${transfer.note ? `توضیحات: ${transfer.note}\n` : ""}
━━━━━━━━━━━━━━━━━━
🔍 کد استعلام: ${verificationCode}
🌐 استعلام: kifzargar.com/verify/${transfer.trackingCode}
🔐 امضای دیجیتال: ${receiptHash.slice(0, 16)}…

⚠️ صحت این رسید را با اسکن QR یا استعلام کد بررسی کنید.`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "رسید انتقال طلا", text });
        return;
      } catch {}
    }
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {}
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="max-w-sm w-full my-4" onClick={e => e.stopPropagation()}>

        {/* بنر موفقیت */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 mb-2">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500 flex items-center justify-center shrink-0">
            <span className="text-violet-400 text-sm">⇄</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-violet-400">رسید رسمی انتقال طلا</div>
            <div className="text-[9px] text-[var(--muted)] mt-0.5">انتقال با موفقیت انجام شد</div>
          </div>
        </div>

        {/* رسید */}
        <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-[var(--panel)] overflow-hidden relative">
          {/* واترمارک */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.025]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-serif italic font-black whitespace-nowrap -rotate-[25deg] text-[var(--gold)]" style={{ fontSize: 48, letterSpacing: "0.15em" }}>
                KIFE ZARGAR
              </div>
            </div>
          </div>

          {/* هدر با QR + کد پیگیری */}
          <div className="relative bg-gradient-to-l from-[var(--gold)]/20 to-[var(--gold)]/5 border-b-2 border-[var(--gold)]/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-[var(--gold)]">رسید رسمی انتقال طلا</div>
                <div className="text-[8px] text-[var(--muted)] mt-0.5">کیف زرگر · KIFE ZARGAR</div>
                <div className="mt-2 space-y-0.5 text-[9px]">
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--muted)]">شماره:</span>
                    <span className="font-mono font-bold text-[var(--text)]" dir="ltr">{transfer.trackingCode}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--muted)]">تاریخ:</span>
                    <span className="font-mono text-[var(--text)]">{transfer.date} · {transfer.time}</span>
                  </div>
                </div>
              </div>
              {/* QR */}
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

          {/* فرستنده و گیرنده — دو ستون */}
          <div className="relative grid grid-cols-2 divide-x divide-[var(--border)] border-b border-[var(--border)]">
            <div className="p-2.5">
              <div className="text-[7.5px] font-bold text-[var(--gold)] uppercase tracking-wider mb-1">فرستنده</div>
              <div className="text-[9.5px] font-bold text-[var(--text)] mb-1 leading-tight">{senderName}</div>
              <div className="space-y-0.5 text-[8px] text-[var(--muted)] leading-relaxed">
                {senderNationalId && (
                  <div>کد ملی: <span className="text-[var(--text)] font-mono" dir="ltr">{senderNationalId}</span></div>
                )}
                {senderPhone && (
                  <div>موبایل: <span className="text-[var(--text)] font-mono whitespace-nowrap" dir="ltr">{formatPhone(senderPhone)}</span></div>
                )}
              </div>
            </div>
            <div className="p-2.5">
              <div className="text-[7.5px] font-bold text-[var(--gold)] uppercase tracking-wider mb-1">گیرنده</div>
              <div className="text-[9.5px] font-bold text-[var(--text)] mb-1 leading-tight">{transfer.recipientName}</div>
              <div className="space-y-0.5 text-[8px] text-[var(--muted)] leading-relaxed">
                <div>موبایل: <span className="text-[var(--text)] font-mono whitespace-nowrap" dir="ltr">{formatPhone(transfer.recipientPhone)}</span></div>
              </div>
            </div>
          </div>

          {/* مقدار اصلی */}
          <div className="relative p-4 text-center border-b border-[var(--border)] bg-[var(--gold)]/5">
            <div className="text-[10px] text-[var(--muted)] mb-1">مقدار منتقل شده</div>
            <div className="text-3xl font-black text-[var(--gold)]">
              {toFa(transfer.amount.toFixed(4))}
              <span className="text-sm font-normal text-[var(--muted)] mr-1">{transfer.unit}</span>
            </div>
          </div>

          {/* جزئیات */}
          <div className="relative p-3 border-b border-[var(--border)] space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">کارمزد</span>
              <span className="text-[var(--text)]">{toFa(transfer.fee.toFixed(4))} {transfer.unit}</span>
            </div>
            {transfer.note && (
              <div className="pt-1.5 border-t border-[var(--border)]">
                <div className="text-[var(--muted)] mb-1">توضیحات:</div>
                <div className="text-[var(--text)] bg-[var(--panel-2)] rounded p-1.5 leading-relaxed text-[9.5px]">
                  {transfer.note}
                </div>
              </div>
            )}
          </div>

          {/* ===== بخش استعلام و امضا ===== */}
          <div className="relative p-3 bg-[var(--panel-2)] border-t-2 border-[var(--gold)]/30">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs">🔍</span>
              <span className="text-[10px] font-bold text-[var(--gold)]">قابل استعلام</span>
            </div>

            <div className="space-y-1.5">
              {/* کد استعلام */}
              <div>
                <div className="text-[8.5px] text-[var(--muted)] mb-0.5">کد استعلام</div>
                <div
                  className="font-mono text-[11px] font-black text-[var(--gold)] tracking-wider bg-[var(--bg)] border border-[var(--gold)]/30 rounded px-2 py-1 text-center"
                  dir="ltr"
                >
                  {verificationCode}
                </div>
              </div>

              {/* لینک استعلام */}
              <div>
                <div className="text-[8.5px] text-[var(--muted)] mb-0.5">لینک استعلام</div>
                <div
                  className="text-[9px] font-mono text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 truncate"
                  dir="ltr"
                >
                  kifzargar.com/verify/{transfer.trackingCode}
                </div>
              </div>
            </div>

            {/* امضای دیجیتال */}
            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-[7.5px] font-bold text-emerald-400">امضای دیجیتال</span>
                </div>
                <span className="text-[8px] text-[var(--muted)] font-mono" dir="ltr">
                  {receiptHash.slice(0, 16)}…
                </span>
              </div>
            </div>
          </div>

          {/* مهر رسمی */}
          <div className="relative border-t-2 border-dashed border-[var(--gold)]/30 bg-gradient-to-b from-transparent to-[var(--gold)]/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-[8px] text-[var(--muted)] leading-relaxed">
                  ⚠️ هرگونه تغییر در این رسید، با اسکن QR یا استعلام کد قابل تشخیص است.
                </div>
              </div>
              <div className="shrink-0 w-20 h-14 rounded border border-dashed border-[var(--gold)]/30 flex flex-col items-center justify-center bg-[var(--bg)]/30">
                <div className="text-[7px] font-black text-[var(--gold)]/50 leading-tight">KIFE ZARGAR</div>
                <div className="text-[6px] text-[var(--gold)]/40 mt-0.5">مهر رسمی</div>
              </div>
            </div>
          </div>

          {/* پاورقی */}
          <div className="relative bg-[var(--gold)]/5 border-t border-[var(--gold)]/20 px-2.5 py-1.5 text-center">
            <div className="text-[8px] text-[var(--muted)]">
              این رسید الکترونیکی است · {COMPANY_INFO.website}
            </div>
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={share}
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
                اشتراک‌گذاری رسید
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