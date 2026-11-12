"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toFa } from "@/lib/format";
import { TERMS_VERSION, TERMS_UPDATED_AT, TERMS_SUMMARY } from "@/lib/legal";

type Step = "accept" | "verify" | "success";

export default function TermsPage() {
  const router = useRouter();
  const { user, isLoading, isTermsAccepted, sendTermsCode, verifyTermsCode } = useAuth();

  const [step, setStep] = useState<Step>("accept");
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [shake, setShake] = useState(false);

  // محافظت: فقط کاربران لاگین‌کرده
  useEffect(() => {
    if (isLoading) return;
    if (!user?.phone) {
      router.replace("/auth/login");
    } else if (isTermsAccepted) {
      // قبلاً پذیرفته → برو KYC یا خانه
      router.replace(user.kycStatus === "verified" ? "/" : "/auth/verify");
    }
  }, [isLoading, user, isTermsAccepted, router]);

  // کول‌داون شمارش معکوس
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ارسال کد
  async function handleSendCode() {
    if (!agreed || sending) return;
    setSending(true);
    setError("");
    const result = await sendTermsCode();
    setSending(false);

    if (!result.success) {
      setError(result.error || "خطا در ارسال کد");
      return;
    }

    if (result.demoCode) setDemoCode(result.demoCode);
    setCooldown(60);
    setStep("verify");
    setCodeDigits(["", "", "", "", "", ""]);
    setTimeout(() => {
      (document.getElementById("terms-code-0") as HTMLInputElement)?.focus();
    }, 100);
  }

  // تغییر رقم کد
  function handleDigit(idx: number, val: string) {
    const en = val.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g, "");
    const next = [...codeDigits];
    if (!en) {
      next[idx] = "";
      setCodeDigits(next);
      return;
    }
    next[idx] = en[0];
    setCodeDigits(next);
    if (idx < 5) {
      (document.getElementById(`terms-code-${idx + 1}`) as HTMLInputElement)?.focus();
    }
    // auto verify
    if (next.every((d) => d !== "")) {
      setTimeout(() => verifyCode(next.join("")), 150);
    }
  }

  function handleBackspace(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
      (document.getElementById(`terms-code-${idx - 1}`) as HTMLInputElement)?.focus();
    }
  }

  // تایید کد
  async function verifyCode(codeOverride?: string) {
    const code = codeOverride ?? codeDigits.join("");
    if (code.length !== 6 || verifying) return;

    setVerifying(true);
    setError("");
    const result = await verifyTermsCode(code);

    if (result.success && result.signature) {
      setSignature(result.signature);
      setStep("success");
    } else {
      setError(result.error || "کد اشتباه است");
      setShake(true);
      await new Promise((r) => setTimeout(r, 450));
      setCodeDigits(["", "", "", "", "", ""]);
      setShake(false);
      (document.getElementById("terms-code-0") as HTMLInputElement)?.focus();
    }
    setVerifying(false);
  }

  // ادامه بعد از موفقیت
  function goNext() {
    router.replace(user?.kycStatus === "verified" ? "/" : "/auth/verify");
  }

  if (isLoading || !user?.phone) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]" dir="rtl">
        <div className="w-8 h-8 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-6 flex items-start justify-center" dir="rtl">
      <div className="w-full max-w-md">
        {/* هدر */}
        <div className="text-center mb-5">
          <div className="text-2xl font-black text-[var(--gold)] font-serif italic tracking-widest mb-1">
            KIFE ZARGAR
          </div>
          <div className="text-[10px] text-[var(--muted)]">پذیرش قوانین و شرایط</div>
        </div>

        {/* ============ مرحله ۱: پذیرش ============ */}
        {step === "accept" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center text-2xl mb-2">
                📜
              </div>
              <h1 className="text-base font-bold mb-1">قوانین و شرایط استفاده</h1>
              <p className="text-[10.5px] text-[var(--muted)] leading-relaxed">
                برای شروع استفاده از کیف زرگر، لطفاً قوانین را مطالعه و تأیید کنید
              </p>
            </div>

            {/* خلاصه‌ی ۶ بند */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-3 mb-3 max-h-[280px] overflow-y-auto">
              <div className="text-[9px] text-[var(--muted)] mb-2 font-bold">
                خلاصه‌ی مهم‌ترین موارد
              </div>
              <div className="space-y-2">
                {TERMS_SUMMARY.map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sm shrink-0 mt-0.5">{t.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[10.5px] font-bold text-[var(--text)]">{t.title}</div>
                      <div className="text-[9.5px] text-[var(--muted)] leading-relaxed">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* اطلاعات نسخه */}
            <div className="flex items-center justify-between text-[9px] text-[var(--muted)] mb-3 px-1">
              <span>نسخه {TERMS_VERSION}</span>
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline font-bold">
                مطالعه‌ی متن کامل ↗
              </Link>
            </div>

            {/* چک‌باکس */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] cursor-pointer hover:border-[var(--gold)]/40 transition mb-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[var(--gold)] shrink-0"
              />
              <div className="flex-1 text-[10.5px] leading-relaxed">
                <span className="text-[var(--text)]">
                  قوانین و شرایط استفاده را مطالعه کرده و{" "}
                  <span className="font-bold text-[var(--gold)]">می‌پذیرم</span>.
                </span>
                <div className="text-[9px] text-[var(--muted)] mt-1">
                  با تأیید، یک کد امضای دیجیتال به شماره {user.phone} ارسال می‌شود.
                </div>
              </div>
            </label>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 mb-2">
                <div className="text-[10px] text-red-400">{error}</div>
              </div>
            )}

            <button
              onClick={handleSendCode}
              disabled={!agreed || sending}
              className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="m2 8 10 6 10-6" />
                  </svg>
                  تأیید و دریافت کد امضا
                </>
              )}
            </button>

            <div className="text-[9px] text-[var(--muted)] text-center mt-3 leading-relaxed">
              این مرحله برای حفاظت حقوقی شما و ما طراحی شده و الزامی است.
            </div>
          </div>
        )}

        {/* ============ مرحله ۲: تایید کد ============ */}
        {step === "verify" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-sky-500/10 border-2 border-sky-500/40 flex items-center justify-center text-2xl mb-2">
                📱
              </div>
              <h1 className="text-base font-bold mb-1">تأیید کد امضا</h1>
              <p className="text-[10.5px] text-[var(--muted)] leading-relaxed">
                کد ۶ رقمی ارسال‌شده به <span className="font-bold font-mono" dir="ltr">{user.phone}</span> را وارد کنید
              </p>
            </div>

            {/* نمایش دمو */}
            {demoCode && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 mb-3">
                <div className="text-[9.5px] text-amber-400 text-center">
                  🔒 دمو: کد شما <span className="font-mono font-black text-amber-300" dir="ltr">{demoCode}</span>
                </div>
              </div>
            )}

            {/* ۶ رقم */}
            <div className={`flex justify-center gap-1.5 sm:gap-2 mb-4 ${shake ? "animate-shake" : ""}`} dir="ltr">
              {codeDigits.map((d, i) => (
                <input
                  key={i}
                  id={`terms-code-${i}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleBackspace(i, e)}
                  disabled={verifying}
                  autoFocus={i === 0}
                  aria-label={`رقم ${i + 1} کد امضا`}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-black rounded-lg border-2 outline-none transition-all ${
                    error
                      ? "border-red-500 text-red-400"
                      : d
                      ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] text-[var(--text)] bg-[var(--bg)] focus:border-[var(--gold)]"
                  }`}
                />
              ))}
            </div>

            {error && <p className="text-[10px] text-red-400 text-center mb-3">{error}</p>}
            {verifying && !error && (
              <p className="text-[10px] text-[var(--gold)] text-center mb-3 flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin" />
                در حال تایید و تولید امضا...
              </p>
            )}

            {!verifying && (
              <button
                onClick={() => verifyCode()}
                disabled={!codeDigits.every((d) => d !== "")}
                className="w-full h-10 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                تأیید و امضا
              </button>
            )}

            <button
              onClick={() => {
                setStep("accept");
                setCodeDigits(["", "", "", "", "", ""]);
                setError("");
                setDemoCode(null);
              }}
              disabled={verifying}
              className="w-full h-8 mt-2 rounded-lg text-[10.5px] text-[var(--muted)] hover:text-[var(--text)] transition disabled:opacity-40"
            >
              بازگشت و ویرایش
            </button>

            {cooldown > 0 && (
              <div className="text-[9px] text-[var(--muted)] text-center mt-2">
                ارسال مجدد کد تا {toFa(String(cooldown))} ثانیه‌ی دیگر
              </div>
            )}
          </div>
        )}

        {/* ============ مرحله ۳: موفقیت ============ */}
        {step === "success" && signature && (
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 sm:p-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-base font-bold mb-1">قوانین با موفقیت امضا شد</h1>
              <p className="text-[10.5px] text-[var(--muted)] leading-relaxed">
                از این پس می‌توانید از تمام خدمات کیف زرگر استفاده کنید
              </p>
            </div>

            {/* کارت قرارداد */}
            <div className="rounded-xl border-2 border-[var(--gold)]/40 bg-[var(--bg)]/60 p-4 mb-3">
              <div className="text-[9px] text-[var(--muted)] text-center mb-1">شماره قرارداد امضای دیجیتال</div>
              <div className="text-base font-black text-[var(--gold)] font-mono tracking-wider text-center" dir="ltr">
                {signature}
              </div>
              <div className="text-[8.5px] text-[var(--muted)] text-center mt-2">
                این شماره را برای مراجعات حقوقی نگه دارید
              </div>
            </div>

            {/* خلاصه */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-3 mb-3 space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">نسخه قوانین</span>
                <span className="font-bold">{TERMS_VERSION}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">تاریخ امضا</span>
                <span className="font-bold">{TERMS_UPDATED_AT}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">امضاکننده</span>
                <span className="font-bold font-mono" dir="ltr">{user.phone}</span>
              </div>
            </div>

            <Link
              href={`/verify`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-8 rounded-lg border border-[var(--border)] text-[10px] text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/40 transition flex items-center justify-center gap-1.5 mb-2"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              استعلام امضا
            </Link>

            <button
              onClick={goNext}
              className="w-full h-11 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 transition shadow-lg shadow-[var(--gold)]/20"
            >
              ادامه و ورود به اپلیکیشن
            </button>
          </div>
        )}

        {/* فوتر */}
        <div className="text-center text-[9px] text-[var(--muted)] mt-4 leading-relaxed">
          کیف زرگر — پلتفرم هوشمند سرمایه‌گذاری طلا
          <br />
          نسخه‌ی قوانین: {TERMS_VERSION} · آخرین به‌روزرسانی: {TERMS_UPDATED_AT}
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