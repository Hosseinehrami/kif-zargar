"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

export default function PinPage() {
  const router = useRouter();
  const { user, hasPin, isLoggedIn, validatePin, unlockSession, logout } = useAuth();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockRemain, setLockRemain] = useState(0);
  const [showForgot, setShowForgot] = useState(false);

  // Guard
  useEffect(() => {
    if (!isLoggedIn) router.replace("/auth/login");
    else if (!hasPin) router.replace("/");
  }, [isLoggedIn, hasPin, router]);

  // Lock countdown
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

  // Auto-submit when 4 digits
  useEffect(() => {
    if (pin.length === 4 && !lockedUntil) {
      handleVerify();
    }
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
    const correct = validatePin(pin);
    if (correct) {
      unlockSession();
      router.replace("/");
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

  return (
    <>
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] p-4 relative overflow-hidden" dir="rtl">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--gold)] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--gold)] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm relative">
          {/* لوگو */}
          <div className="text-center mb-5">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-[var(--gold)] opacity-20 rounded-xl blur-xl animate-pulse" />
              <div className="relative w-14 h-14 rounded-xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 flex items-center justify-center text-xl">
                🔒
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-xl shadow-xl overflow-hidden p-5">
            <h1 className="text-base font-bold text-center mb-1">ورود با کد امن</h1>
            <p className="text-[11px] text-[var(--muted)] text-center mb-5">
              برای دسترسی به حساب، کد ۴ رقمی خود را وارد کنید
            </p>

            {/* ۴ نقطه PIN */}
            <div className={`flex justify-center gap-2 mb-4 ${shake ? "animate-shake" : ""}`} dir="ltr">
              {[0, 1, 2, 3].map(i => {
                const filled = i < pin.length;
                return (
                  <div
                    key={i}
                    className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                      error && !isLocked
                        ? "border-red-500 bg-red-500/10"
                        : isLocked
                        ? "border-red-500/50 bg-[var(--panel-2)]"
                        : filled
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 shadow-md shadow-[var(--gold)]/15"
                        : "border-[var(--border)] bg-[var(--bg)]"
                    }`}
                  >
                    {filled && (
                      <span className={`w-2.5 h-2.5 rounded-full ${error ? "bg-red-500" : "bg-[var(--gold)]"} animate-pulse`} />
                    )}
                  </div>
                );
              })}
            </div>

            {error && <p className="text-[10px] text-red-400 text-center mb-2">{error}</p>}
            {isLocked && (
              <p className="text-[10px] text-amber-400 text-center mb-2">🔒 {lockRemain} ثانیه صبر کنید</p>
            )}
            {!error && !isLocked && (
              <p className="text-[9.5px] text-[var(--muted)] text-center mb-2">
                {MAX_ATTEMPTS - attempts} تلاش باقی‌مانده
              </p>
            )}

                        {/* صفحه کلید — ۱،۲،۳ از چپ (با transform آینه‌ای) */}
<div
  style={{ transform: "scaleX(-1)" }}
  className="grid grid-cols-3 gap-2 max-w-[250px] mx-auto mt-3"
>
  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
    <button
      key={n}
      onClick={() => handleDigit(String(n))}
      disabled={isLocked || pin.length >= 4}
      style={{ transform: "scaleX(-1)" }}
      className="aspect-square rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--gold)]/50 hover:bg-[var(--panel-2)] text-lg font-bold text-[var(--text)] transition-all disabled:opacity-40 active:scale-95"
    >
      {n}
    </button>
  ))}
  <button
    onClick={() => setShowForgot(true)}
    disabled={isLocked}
    style={{ transform: "scaleX(-1)" }}
    className="aspect-square rounded-xl bg-transparent text-[9px] text-[var(--muted)] hover:text-[var(--gold)] transition disabled:opacity-40"
  >
    فراموشی؟
  </button>
  <button
    onClick={() => handleDigit("0")}
    disabled={isLocked || pin.length >= 4}
    style={{ transform: "scaleX(-1)" }}
    className="aspect-square rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--gold)]/50 hover:bg-[var(--panel-2)] text-lg font-bold text-[var(--text)] transition-all disabled:opacity-40 active:scale-95"
  >
    0
  </button>
  <button
    onClick={handleBackspace}
    disabled={isLocked || pin.length === 0}
    style={{ transform: "scaleX(-1)" }}
    className="aspect-square rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition-all disabled:opacity-40 active:scale-95"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  </button>
</div>

            <div className="text-center mt-4">
              <p className="text-[10px] text-[var(--muted)]">
                👋 {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>

          <div className="text-center mt-5 text-[9px] text-[var(--muted)] opacity-60">
            © ۱۴۰۵ کیف زرگر
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

      {/* مودال فراموشی PIN */}
      {showForgot && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowForgot(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <h2 className="font-bold text-sm mb-2">فراموشی کد امن</h2>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-4">
                اگر کد امن را فراموش کرده‌اید، باید از حساب خارج شوید و دوباره با کد پیامکی وارد شوید. کد امن قبلی پاک می‌شود.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForgot(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] text-xs font-bold hover:bg-[var(--panel-2)] transition"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmForgot}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-black text-xs font-bold hover:bg-[var(--gold)]/90 transition"
                >
                  خروج و ورود مجدد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}