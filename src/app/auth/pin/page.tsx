"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

export default function PinPage() {
  const router = useRouter();
  const {
    hasPin,
    isLoggedIn,
    isVerified,
    isTermsAccepted,
    setPin: savePin,
    validatePin,
    unlockSession,
  } = useAuth();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockRemain, setLockRemain] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // رفرنس برای جلوگیری از اجرای دوباره auto-submit
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/auth/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remain = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockRemain(remain);
      if (remain <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setError("");
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  // بررسی خودکار بعد از وارد کردن ۴ رقم
  useEffect(() => {
    if (pin.length === 4 && !lockedUntil && !hasSubmitted.current) {
      hasSubmitted.current = true;
      handleVerify();
    }
  }, [pin, lockedUntil]);

  function handleDigit(d: string) {
    if (lockedUntil || pin.length >= 4 || isVerifying) return;
    setError("");
    setPin((prev) => prev + d);
  }

  function handleBackspace() {
    if (lockedUntil || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError("");
    hasSubmitted.current = false; // اجازه دوباره برای تایید
  }

  async function handleVerify() {
    setIsVerifying(true);
    setError("");

    // ۱. تنظیم اولیه PIN
    if (!hasPin) {
      try {
        await savePin(pin);
        // بعد از ذخیره، برو به قوانین
        router.replace("/auth/terms");
        return;
      } catch (e: any) {
        setError(e.message || "خطا در تنظیم کد امن");
        setShake(true);
        await new Promise((r) => setTimeout(r, 400));
        setPin("");
        setShake(false);
        hasSubmitted.current = false;
        setIsVerifying(false);
        return;
      }
    }

    // ۲. ورود با PIN
    const correct = validatePin(pin);
    if (correct) {
      unlockSession();
      
      // یک تاخیر کوچک برای اطمینان از اینکه sessionStorage ذخیره شده
      setTimeout(() => {
        if (!isVerified) {
          router.replace("/auth/verify");
        } else if (!isTermsAccepted) {
          router.replace("/auth/terms");
        } else {
          router.replace("/");
        }
      }, 50);
      return;
    }

    // ۳. PIN اشتباه
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setShake(true);
    setError("کد امن اشتباه است");
    if (newAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCK_SECONDS * 1000);
      setError(`تعداد تلاش‌ها بیش از حد مجاز. ${LOCK_SECONDS} ثانیه صبر کنید`);
    }
    
    await new Promise((r) => setTimeout(r, 400));
    setPin("");
    setShake(false);
    hasSubmitted.current = false;
    setIsVerifying(false);
  }

  const isLocked = lockedUntil !== null && lockRemain > 0;
  const isSettingUp = !hasPin;
  const title = isSettingUp ? "تنظیم کد امن" : "ورود با کد امن";
  const subtitle = isSettingUp
    ? "یک کد ۴ رقمی برای امنیت حساب خود تعیین کنید"
    : "برای دسترسی به حساب، کد ۴ رقمی خود را وارد کنید";

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-2xl font-black text-[var(--gold)] font-serif italic tracking-widest mb-1">
            KIFE ZARGAR
          </div>
          <h1 className="text-base font-bold mt-3">{title}</h1>
          <p className="text-[10.5px] text-[var(--muted)] mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className={`flex justify-center gap-2 mb-4 ${shake ? "animate-shake" : ""}`} dir="ltr">
          {[0, 1, 2, 3].map((i) => {
            const filled = i < pin.length;
            return (
              <div
                key={i}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                  error
                    ? "border-red-500"
                    : filled
                    ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                    : "border-[var(--border)] bg-[var(--bg)]"
                }`}
              >
                {filled ? "●" : ""}
              </div>
            );
          })}
        </div>

        {error && <p className="text-[10px] text-red-400 text-center mb-3">{error}</p>}
        {isLocked && (
          <p className="text-[10px] text-amber-400 text-center mb-3">
            {lockRemain} ثانیه صبر کنید
          </p>
        )}
        {!error && !isLocked && hasPin && !isVerifying && (
          <p className="text-[10px] text-[var(--muted)] text-center mb-3">
            {MAX_ATTEMPTS - attempts} تلاش باقی‌مانده
          </p>
        )}

        <div className="grid grid-cols-3 gap-2" dir="ltr">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(String(d))}
              disabled={isLocked || isVerifying}
              className="h-12 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base font-bold text-[var(--text)] hover:bg-[var(--panel-2)] disabled:opacity-40 transition"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isLocked || isVerifying}
            className="h-12 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            disabled={isLocked || isVerifying}
            className="h-12 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base font-bold text-[var(--text)] hover:bg-[var(--panel-2)] disabled:opacity-40 transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={isLocked || pin.length !== 4 || isVerifying}
            className="h-12 rounded-xl bg-[var(--gold)] text-black text-sm font-bold hover:bg-[var(--gold)]/90 disabled:opacity-40 transition flex items-center justify-center"
          >
            {isVerifying ? (
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              "تأیید"
            )}
          </button>
        </div>

        {hasPin && (
          <button
            onClick={() => router.push("/auth/pin-recovery")}
            className="w-full mt-4 text-[10px] text-[var(--muted)] hover:text-[var(--gold)] transition"
          >
            کد امن را فراموش کرده‌اید؟
          </button>
        )}
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