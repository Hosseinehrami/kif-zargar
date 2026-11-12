"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const toEnDigits = (s: string) => s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

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
    else if (isVerified && !transitioning) {
      // اگر قبلاً تایید شده، بر اساس وضعیت PIN و قوانین هدایت شود
      // این منطق در Appshell یا صفحات بعدی هم هست، ولی اینجا هم برای اطمینان
      // router.replace("/auth/pin"); // یا مسیر مناسب
    }
  }, [isLoggedIn, isVerified, transitioning, router]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        // بعد از KYC موفق، همیشه به صفحه PIN برو
        // اگر PIN نداشته باشد، آنجا تنظیم می‌کند؛ اگر داشته باشد، وارد می‌شود
        router.replace("/auth/pin");
      }, 1400);
    } else {
      setTransitioning(false);
      setState("form");
      setError(result.error || "استعلام ناموفق بود");
      inputRef.current?.focus();
    }
  }

  const progressBar = (
    <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden mb-6">
      <div className={`h-full bg-[var(--gold)] rounded-full transition-all duration-500 ${state === "form" ? "w-1/3" : "w-full"}`} />
    </div>
  );

  if (state === "verifying") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl">
        <div className="w-full max-w-sm text-center">
          {progressBar}
          <div className="w-16 h-16 mx-auto rounded-full bg-sky-500/10 border-2 border-sky-500/40 flex items-center justify-center mb-4">
            <span className="w-8 h-8 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
          </div>
          <h1 className="text-base font-bold mb-2">در حال استعلام</h1>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            در حال تطبیق کد ملی با شماره {user?.phone}
            <br />
            از سامانه شاهکار
          </p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl">
        <div className="w-full max-w-sm text-center">
          {progressBar}
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-base font-bold mb-2">احراز هویت موفق</h1>
          <p className="text-[11px] text-[var(--muted)]">خوش آمدید، {user?.firstName} {user?.lastName}</p>
          <p className="text-[10px] text-[var(--muted)] mt-2">در حال انتقال به مرحله بعد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl">
      <div className="w-full max-w-sm">
        {progressBar}
        <div className="text-center mb-5">
          <div className="text-2xl font-black text-[var(--gold)] font-serif italic tracking-widest mb-1">KIFE ZARGAR</div>
          <h1 className="text-base font-bold mt-3">احراز هویت</h1>
          <p className="text-[10.5px] text-[var(--muted)] mt-1 leading-relaxed">کد ملی خود را وارد کنید تا با شماره موبایل شما تطبیق داده شود.</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <label className="text-[10px] text-[var(--muted)] block mb-1.5">کد ملی</label>
          <div className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-3 transition-all ${nationalId.length > 0 && !isValid ? "border-red-500/50" : nationalId.length === 10 ? "border-emerald-500/50" : "border-[var(--border)] focus-within:border-[var(--gold)]"}`}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={nationalId}
              onChange={e => { setNationalId(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 10)); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter" && isValid) handleVerify(); }}
              placeholder="۱۰ رقم"
              className="w-full bg-transparent text-center text-lg font-black tracking-[0.15em] text-[var(--text)] placeholder:text-[var(--muted)] placeholder:tracking-[0.1em] placeholder:font-normal placeholder:text-xs outline-none"
              dir="ltr"
            />
          </div>
          <div className="text-[9px] text-[var(--muted)] text-center mt-1">{nationalId.length}/10</div>
          {error && <p className="text-[10px] text-red-400 text-center mt-2">{error}</p>}
          <p className="text-[9px] text-[var(--muted)] text-center mt-3 leading-relaxed">استعلام خودکار از سامانه شاهکار انجام می‌شود.</p>
          <button
            onClick={handleVerify}
            disabled={!isValid}
            className="w-full h-11 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition mt-3"
          >
            استعلام و ورود
          </button>
        </div>
      </div>
    </div>
  );
}