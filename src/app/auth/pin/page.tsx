"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

export default function PinPage() {
  const router = useRouter();
  const { user, hasPin, isLoggedIn, isVerified, isTermsAccepted, setPin, validatePin, unlockSession, logout } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockRemain, setLockRemain] = useState(0);
  const [showForgot, setShowForgot] = useState(false);

  // اگر کاربر لاگین نیست
  useEffect(() => {
    if (!isLoggedIn) router.replace("/auth/login");
  }, [isLoggedIn, router]);

  // اگر PIN دارد ولی KYC یا قوانین تکمیل نیست، به مسیر درست هدایت شود
  useEffect(() => {
    if (!isLoggedIn) return;
    if (hasPin) {
      // در حالت ورود با PIN، اگر KYC یا قوانین تکمیل نشده باشد
      if (!isVerified) { router.replace("/auth/verify"); return; }
      if (!isTermsAccepted) { router.replace("/auth/terms"); return; }
    }
  }, [isLoggedIn, hasPin, isVerified, isTermsAccepted, router]);

  // قفل شدن پس از تلاش‌های ناموفق
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remain = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockRemain(remain);
      if (remain <= 0) { setLockedUntil(null); setAttempts(0); setError(""); }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  // ارسال خودکار وقتی ۴ رقم وارد شد
  useEffect(() => {
    if (pin.length === 4 && !lockedUntil) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function handleDigit(d: string) {
    if (lockedUntil || pin.length >= 4) return;
    setError("");
    setPin(prev => prev + d);
  }

  function handleBackspace() {
    if (lockedUntil) return;
    setPin(prev => prev.slice(0, -1));
    setError("");
  }

  async function handleVerify() {
    // حالت تنظیم اولیه PIN
    if (!hasPin) {
      try {
        await setPin(pin);
        router.replace("/auth/terms");
        return;
      } catch (e: any) {
        setError(e.message || "خطا در تنظیم کد امن");
        setShake(true);
        await new Promise(r => setTimeout(r, 400));
        setPin("");
        setShake(false);
        return;
      }
    }

    // حالت ورود با PIN
    const correct = validatePin(pin);
    if (correct) {
      unlockSession();
      if (!isVerified) router.replace("/auth/verify");
      else if (!isTermsAccepted) router.replace("/auth/terms");
      else router.replace("/");
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setShake(true);
    setError("کد امن اشتباه است");
    if (newAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCK_SECONDS * 1000);
      setError(`تعداد تلاش‌ها بیش از حد مجاز. ${LOCK_SECONDS} ثانیه صبر کنید`);
    }
    await new Promise(r => setTimeout(r, 400));
    setPin("");
    setShake(false);
  }

  function confirmForgot() {
    logout();
    router.replace("/auth/login");
  }

  const isLocked = lockedUntil !== null && lockRemain > 0;
  const isSettingUp = !hasPin;
  const title = isSettingUp ? "تنظیم کد امن" : "ورود با کد امن";
  const subtitle = isSettingUp ? "یک کد ۴ رقمی برای امنیت حساب خود تعیین کنید" : "برای دسترسی به حساب، کد ۴ رقمی خود را وارد کنید";

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-2xl font-black text-[var(--gold)] font-serif italic tracking-widest mb-1">KIFE ZARGAR</div>
          <h1 className="text-base font-bold mt-3">{title}</h1>
          <p className="text-[10.5px] text-[var(--muted)] mt-1 leading-relaxed">{subtitle}</p>
        </div>

        <div className={`flex justify-center gap-2 mb-4 ${shake ? "animate-shake" : ""}`} dir="ltr">
          {[0, 1, 2, 3].map(i => {
            const filled = i < pin.length;
            return (
              <div key={i} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${error ? "border-red-500" : filled ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--border)] bg-[var(--bg)]"}`}>
                {filled ? "●" : ""}
              </div>
            );
          })}
        </div>

        {error && <p className="text-[10px] text-red-400 text-center mb-3">{error}</p>}
        {isLocked && <p className="text-[10px] text-amber-400 text-center mb-3">{lockRemain} ثانیه صبر کنید</p>}
        {!error && !isLocked && hasPin && (
          <p className="text-[10px] text-[var(--muted)] text-center mb-3">{MAX_ATTEMPTS - attempts} تلاش باقی‌مانده</p>
        )}

        <div className="grid grid-cols-3 gap-2" dir="ltr">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
            <button key={d} type="button" onClick={() => handleDigit(String(d))} disabled={isLocked} className="h-12 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base font-bold text-[var(--text)] hover:bg-[var(--panel-2)] disabled:opacity-40 transition">
              {d}
            </button>
          ))}
          <button type="button" onClick={handleBackspace} disabled={isLocked} className="h-12 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition">⌫</button>
          <button type="button" onClick={() => handleDigit("0")} disabled={isLocked} className="h-12 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base font-bold text-[var(--text)] hover:bg-[var(--panel-2)] disabled:opacity-40 transition">0</button>
          <button type="button" onClick={handleVerify} disabled={isLocked || pin.length !== 4} className="h-12 rounded-xl bg-[var(--gold)] text-black text-sm font-bold hover:bg-[var(--gold)]/90 disabled:opacity-40 transition">
            تأیید
          </button>
        </div>

        {hasPin && (
          <button onClick={() => setShowForgot(true)} className="w-full mt-4 text-[10px] text-[var(--muted)] hover:text-[var(--gold)] transition">
            کد امن را فراموش کرده‌اید؟
          </button>
        )}

        {showForgot && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onClick={() => setShowForgot(false)}>
            <div className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-3">
                <div className="text-3xl mb-2">🔐</div>
                <div className="text-sm font-bold mb-1">فراموشی کد امن</div>
                <div className="text-[10px] text-[var(--muted)] leading-relaxed">برای بازیابی، از حساب خارج شده و دوباره وارد شوید.</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForgot(false)} className="flex-1 h-9 rounded-lg border border-[var(--border)] text-[11px] font-bold text-[var(--muted)]">انصراف</button>
                <button onClick={confirmForgot} className="flex-1 h-9 rounded-lg bg-red-500 text-white text-[11px] font-bold">خروج و ورود مجدد</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  );
}