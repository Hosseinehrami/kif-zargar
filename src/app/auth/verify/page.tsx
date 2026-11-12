"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

type VerifyState = "form" | "verifying" | "success";

export default function VerifyPage() {
  const router = useRouter();
  const { user, isLoggedIn, isVerified, verifyShahkar } = useAuth();
  const [nationalId, setNationalId] = useState("");
  const [state, setState] = useState<VerifyState>("form");
  const [error, setError] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/auth/login");
    else if (isVerified && !transitioning) router.replace("/");
  }, [isLoggedIn, isVerified, transitioning, router]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const isValid = /^\d{10}$/.test(nationalId);

  async function handleVerify() {
    if (!isValid) { setError("کد ملی باید ۱۰ رقم باشد"); return; }
    setError("");
    setState("verifying");
    setTransitioning(true);

    const result = await verifyShahkar(nationalId);
    if (result.success) {
      setState("success");
      setTimeout(() => {
        if (result.hasPin) router.replace("/auth/pin");
        else router.replace("/");
      }, 1400);
    } else {
      setTransitioning(false);
      setState("form");
      setError(result.error || "استعلام ناموفق بود");
      inputRef.current?.focus();
    }
  }

  const progressBar = (
    <div className="flex gap-1 px-5 pt-4">
      <div className="flex-1 h-0.5 rounded-full bg-[var(--gold)]" />
      <div className="flex-1 h-0.5 rounded-full bg-[var(--gold)]" />
      <div className="flex-1 h-0.5 rounded-full bg-[var(--gold)]" />
    </div>
  );

  if (state === "verifying") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {progressBar}
        <div className="p-6 text-center slide-in-left">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-[var(--gold)] opacity-30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center text-2xl">🔍</div>
          </div>
          <h1 className="text-base font-bold mb-1.5">در حال استعلام</h1>
          <p className="text-[11px] text-[var(--muted)] mb-5 leading-relaxed">
            در حال تطبیق کد ملی با شماره
            <br />
            <span dir="ltr" className="font-mono font-bold text-[var(--text)]">{user?.phone}</span>
          </p>
          <div className="w-8 h-8 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin mx-auto" />
          <p className="text-[9.5px] text-[var(--muted)] mt-3">سامانه شاهکار</p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {progressBar}
        <div className="p-6 text-center fade-in">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-emerald-500 opacity-30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-base font-bold mb-1.5">احراز هویت موفق</h1>
          <p className="text-xs text-[var(--muted)]">
            خوش آمدید، <span className="font-bold text-[var(--text)]">{user?.firstName} {user?.lastName}</span>
          </p>
          <p className="text-[10px] text-emerald-400 mt-2.5 flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            در حال انتقال...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-xl shadow-xl overflow-hidden">
      {progressBar}
      <div className="p-5 slide-in-right">
        <div className="w-11 h-11 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-xl mb-3">
          🆔
        </div>
        <h1 className="text-base font-bold mb-1">احراز هویت</h1>
        <p className="text-[11px] text-[var(--muted)] mb-5 leading-relaxed">
          کد ملی خود را وارد کنید تا با شماره موبایل شما تطبیق داده شود.
        </p>

        <label className="text-[10px] text-[var(--muted)] block mb-1.5">کد ملی</label>
        <div
          className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-3 transition-all ${
            error
              ? "border-red-500/50"
              : isValid
              ? "border-emerald-500/50"
              : "border-[var(--border)] focus-within:border-[var(--gold)]"
          }`}
        >
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={nationalId}
            onChange={e => { setNationalId(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 10)); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter" && isValid) handleVerify(); }}
            placeholder="۱۰ رقم"
            className="w-full bg-transparent text-left text-lg font-black tracking-[0.15em] text-[var(--text)] placeholder:text-[var(--muted)] placeholder:tracking-[0.1em] placeholder:font-normal placeholder:text-xs outline-none"
            dir="ltr"
          />
        </div>

        {/* نوار پیشرفت رقم */}
        <div className="flex items-center gap-2 mt-2 mb-4">
          <div className="flex-1 h-0.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isValid ? "bg-emerald-500" : "bg-[var(--gold)]"}`}
              style={{ width: `${(nationalId.length / 10) * 100}%` }}
            />
          </div>
          <span className="text-[9.5px] text-[var(--muted)] font-mono shrink-0" dir="ltr">{nationalId.length}/10</span>
        </div>

        {error && <p className="text-[10px] text-red-400 mb-2.5 text-center">{error}</p>}

        <div className="text-[9.5px] text-[var(--muted)] mb-3 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-2.5 leading-relaxed">
          🔒 استعلام خودکار از سامانه شاهکار انجام می‌شود.
        </div>

        <button
          onClick={handleVerify}
          disabled={!isValid}
          className="w-full h-10 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--gold)]/20"
        >
          استعلام و ورود
        </button>
      </div>
    </div>
  );
}