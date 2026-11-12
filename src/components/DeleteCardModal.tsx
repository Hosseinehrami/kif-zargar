"use client";

import { useState, useEffect } from "react";
import type { BankCard } from "./AddCardModal";

const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

export default function DeleteCardModal({
  card,
  onClose,
  onDelete,
}: {
  card: BankCard;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (otpDigits.every(d => d)) {
      const t = setTimeout(() => verifyOtp(), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpDigits]);

  async function verifyOtp() {
    const code = otpDigits.join("");
    if (code.length !== 4) return;

    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 700));

    if (code === "1234") {
      onDelete();
    } else {
      setError("کد تایید اشتباه است");
      setShake(true);
      await new Promise(r => setTimeout(r, 450));
      setOtpDigits(["", "", "", ""]);
      setShake(false);
      setLoading(false);
    }
  }

  function handleOtpDigit(idx: number, val: string) {
    const en = toEnDigits(val).replace(/\D/g, "");
    if (!en) {
      const next = [...otpDigits];
      next[idx] = "";
      setOtpDigits(next);
      return;
    }
    const next = [...otpDigits];
    next[idx] = en[0];
    setOtpDigits(next);
    if (idx < 3) {
      const ref = document.getElementById(`del-otp-${idx + 1}`) as HTMLInputElement;
      ref?.focus();
    }
  }

  function handleOtpBackspace(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      const ref = document.getElementById(`del-otp-${idx - 1}`) as HTMLInputElement;
      ref?.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-red-400">حذف کارت</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">این عمل قابل بازگشت نیست</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* کارت مورد حذف */}
          <div className="bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-base shrink-0">
                🏦
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold">{card.bank}</div>
                <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">•••• {card.last4}</div>
              </div>
            </div>
          </div>

          <div className="text-center mb-3">
            <div className="text-[11px] text-[var(--muted)]">
              برای تایید حذف، کد پیامکی را وارد کنید
            </div>
          </div>

          <div className={`flex justify-center gap-2 mb-3 ${shake ? "animate-shake" : ""}`} dir="ltr">
            {otpDigits.map((d, i) => (
              <input
                key={i}
                id={`del-otp-${i}`}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleOtpDigit(i, e.target.value)}
                onKeyDown={e => handleOtpBackspace(i, e)}
                disabled={loading}
                autoFocus={i === 0}
                className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all ${
                  error ? "border-red-500 text-red-400" :
                  d ? "border-red-500 text-red-400 bg-red-500/10" :
                  "border-[var(--border)] text-[var(--text)] bg-[var(--bg)] focus:border-red-500"
                }`}
              />
            ))}
          </div>

          {error && <p className="text-[10px] text-red-400 text-center mb-2">{error}</p>}
          {loading && !error && (
            <p className="text-[10px] text-red-400 text-center mb-2 flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              در حال حذف...
            </p>
          )}

          <div className="text-[9.5px] text-[var(--muted)] text-center bg-[var(--panel-2)] rounded-lg p-2">
            🔒 دمو: کد <span className="font-mono font-bold text-[var(--gold)]">1234</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full h-9 mt-3 rounded-xl bg-transparent text-[var(--muted)] font-bold text-[11px] hover:text-[var(--text)] transition"
          >
            انصراف
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  );
}