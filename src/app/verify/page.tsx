"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

export default function VerifyHomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = toEnDigits(code).toUpperCase().trim();

    if (!clean) {
      setError("لطفاً کد رسید را وارد کنید");
      return;
    }
    if (!/^[A-Z]{3}-[A-Z0-9]{4,10}$/.test(clean)) {
      setError("فرمت کد نامعتبر است. مثال: TRX-A7K29M");
      return;
    }
    router.push(`/verify/${clean}`);
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--gold)] opacity-[0.08] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[var(--gold)] opacity-[0.08] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative" dir="rtl">
        {/* برند */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[var(--gold)] opacity-20 rounded-2xl blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 flex items-center justify-center text-2xl font-black text-[var(--gold)]">
              🔍
            </div>
          </div>
          <div className="mt-4 text-lg font-black text-[var(--gold)] font-serif italic tracking-[0.15em]">
            KIFE ZARGAR
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-1 tracking-widest">
            سامانه استعلام رسیدها
          </div>
        </div>

        {/* فرم */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h1 className="text-base font-bold mb-1">استعلام رسید</h1>
          <p className="text-[11px] text-[var(--muted)] mb-5">
            کد پیگیری رسید خود را وارد کنید
          </p>

          <form onSubmit={handleSubmit}>
            <label className="text-[10px] text-[var(--muted)] block mb-1.5">
              کد پیگیری
            </label>
            <div className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-2.5 mb-3 transition-all ${
              error
                ? "border-red-500/50"
                : code
                ? "border-[var(--gold)]/50"
                : "border-[var(--border)] focus-within:border-[var(--gold)]"
            }`}>
              <input
                type="text"
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="TRX-A7K29M"
                className="w-full bg-transparent text-center text-sm font-mono font-bold text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal outline-none tracking-wider"
                dir="ltr"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-[10px] text-red-400 mb-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={!code.trim()}
              className="w-full h-10 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20"
            >
              استعلام رسید
            </button>
          </form>

          <div className="mt-4 p-2.5 rounded-lg bg-[var(--panel-2)] border border-[var(--border)]">
            <div className="text-[9.5px] text-[var(--muted)] leading-relaxed text-center">
              کد استعلام در پایین رسید یا فاکتور شما موجود است
              <br />
              <span className="font-mono text-[9px] opacity-70" dir="ltr">
                TRX-XXXXXX · TRD-XXXXXX · DEP-XXXXXX
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link
            href="/"
            className="text-[11px] text-[var(--muted)] hover:text-[var(--gold)] transition"
          >
            ← بازگشت به کیف زرگر
          </Link>
        </div>
      </div>
    </div>
  );
}