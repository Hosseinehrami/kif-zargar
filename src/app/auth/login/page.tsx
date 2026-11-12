"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

const MAX_ATTEMPTS = 3;
const RESEND_SECONDS = 60;
const REMEMBER_KEY = "kif-remembered-phone";

type Step = "phone" | "otp";
type OtpStatus = "filling" | "verifying" | "success" | "error";

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp, isLoggedIn, isVerified } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("filling");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [shake, setShake] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockRemain, setLockRemain] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);
  const [rememberedPhone, setRememberedPhone] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved && /^09\d{9}$/.test(saved)) setRememberedPhone(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (transitioning) return;
    if (isLoggedIn && isVerified) router.replace("/");
    else if (isLoggedIn && !isVerified) router.replace("/auth/verify");
  }, [isLoggedIn, isVerified, transitioning, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

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

  // پذیرش هر دو حالت: 09121234567 یا 9121234567
  const isValidPhone = /^(?:0)?9\d{9}$/.test(phone);
  const isLocked = lockedUntil !== null && lockRemain > 0;
  const normalizedPhone = phone.startsWith("0") ? phone : "0" + phone;

  async function handleSendOtp(targetPhone?: string) {
    const raw = targetPhone || phone;
    const p = raw.startsWith("0") ? raw : "0" + raw;
    if (!/^09\d{9}$/.test(p)) { setPhoneError("شماره موبایل معتبر نیست"); return; }
    setPhoneError(""); setError(""); setLoading(true);
    try {
      await sendOtp(p);
      if (!targetPhone) setPhone(raw);
      setStep("otp");
      setResendIn(RESEND_SECONDS);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch { setPhoneError("خطا در ارسال کد"); }
    finally { setLoading(false); }
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return;
    setDigits(["", "", "", ""]);
    setOtpStatus("filling");
    setError("");
    await handleSendOtp();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  function handleDigitChange(idx: number, val: string) {
    if (isLocked) return;
    const en = toEnDigits(val).replace(/\D/g, "");
    if (!en) {
      const next = [...digits]; next[idx] = "";
      setDigits(next);
      return;
    }
    if (en.length > 1) {
      const chars = en.slice(0, 4).split("");
      const next = ["", "", "", ""];
      chars.forEach((c, i) => { next[i] = c; });
      setDigits(next);
      setTimeout(() => inputRefs.current[3]?.focus(), 0);
      return;
    }
    const next = [...digits];
    next[idx] = en;
    setDigits(next);
    if (idx < 3) setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (isLocked) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[idx]) {
        const next = [...digits]; next[idx] = "";
        setDigits(next);
      } else if (idx > 0) {
        const next = [...digits]; next[idx - 1] = "";
        setDigits(next);
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 3) inputRefs.current[idx + 1]?.focus();
    if (e.key === "Enter" && digits.every(d => d) && !isLocked) handleVerifyOtp();
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (isLocked) return;
    const text = toEnDigits(e.clipboardData.getData("text")).replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    text.split("").forEach((c, i) => { if (i < 4) next[i] = c; });
    setDigits(next);
    setTimeout(() => inputRefs.current[Math.min(text.length, 3)]?.focus(), 0);
  }

  async function handleVerifyOtp() {
    if (isLocked || otpStatus === "verifying" || otpStatus === "success") return;
    const code = digits.join("");
    if (code.length !== 4) { setError("کد ۴ رقمی را کامل وارد کنید"); return; }

    setTransitioning(true);
    setOtpStatus("verifying");
    setError("");

    try {
      await new Promise(r => setTimeout(r, 500));
      const result = await verifyOtp(normalizedPhone, code);
      try { localStorage.setItem(REMEMBER_KEY, normalizedPhone); } catch {}
      setOtpStatus("success");
      await new Promise(r => setTimeout(r, 1300));

      if (result.isVerified && result.hasPin) router.push("/auth/pin");
      else if (result.isVerified) router.push("/");
      else router.push("/auth/verify");
    } catch (e: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + 60000);
        setError("تعداد تلاش‌ها بیش از حد مجاز. ۶۰ ثانیه صبر کنید.");
      } else {
        setError(`${e.message || "کد اشتباه است"} · ${MAX_ATTEMPTS - newAttempts} تلاش باقی‌مانده`);
      }
      setOtpStatus("error");
      setShake(true);
      await new Promise(r => setTimeout(r, 450));
      setDigits(["", "", "", ""]);
      setOtpStatus("filling");
      setShake(false);
      setTransitioning(false);
      if (newAttempts < MAX_ATTEMPTS) setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }

  // auto-verify امن
  useEffect(() => {
    if (
      digits.every(d => d) &&
      otpStatus === "filling" &&
      !isLocked &&
      !transitioning
    ) {
      const t = setTimeout(() => handleVerifyOtp(), 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, otpStatus, isLocked, transitioning]);

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Progress — نازک */}
        <div className="flex gap-1 px-5 pt-4">
          <div className="flex-1 h-0.5 rounded-full bg-[var(--gold)] transition-all duration-500" />
          <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step === "otp" ? "bg-[var(--gold)]" : "bg-[var(--border)]"}`} />
          <div className="flex-1 h-0.5 rounded-full bg-[var(--border)]" />
        </div>

        <div className="p-5">
          {/* ============ مرحله ۱ ============ */}
          {step === "phone" && (
            <div className="slide-in-right">
              <div className="w-11 h-11 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-xl mb-3">
                📱
              </div>
              <h1 className="text-base font-bold mb-1">خوش آمدید 👋</h1>
              <p className="text-[11px] text-[var(--muted)] mb-5">برای شروع، شماره موبایل خود را وارد کنید</p>

              {rememberedPhone && (
                <button
                  type="button"
                  onClick={() => handleSendOtp(rememberedPhone)}
                  disabled={loading}
                  className="w-full mb-4 flex items-center gap-2.5 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 hover:bg-[var(--gold)]/10 transition p-2.5 text-right disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/15 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-[var(--muted)]">ورود سریع با شماره قبلی</div>
                    <div className="text-xs font-bold font-mono" dir="ltr">{rememberedPhone}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              {rememberedPhone && (
                <div className="relative text-center my-3">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
                  <span className="relative px-2 bg-[var(--panel)]/80 text-[9px] text-[var(--muted)]">یا با شماره دیگر</span>
                </div>
              )}

              <label className="text-[10px] text-[var(--muted)] block mb-1.5">شماره موبایل</label>
              <div
                className={`flex items-center gap-2 rounded-xl border-2 bg-[var(--bg)] px-3 py-2.5 transition-all ${
                  phoneError
                    ? "border-red-500/50"
                    : isValidPhone
                    ? "border-emerald-500/50"
                    : "border-[var(--border)] focus-within:border-[var(--gold)]"
                }`}
              >
                <span className="text-[10px] text-[var(--muted)] shrink-0 font-mono">+98</span>
                <div className="w-px h-3.5 bg-[var(--border)]" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => { setPhone(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 11)); setPhoneError(""); }}
                  onKeyDown={e => { if (e.key === "Enter" && isValidPhone) handleSendOtp(); }}
                  placeholder="9121234567"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm font-bold tracking-wider text-left text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal"
                  dir="ltr"
                  autoFocus
                />
                {isValidPhone && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 fade-in">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {phoneError && <p className="text-[10px] text-red-400 mt-1.5">{phoneError}</p>}

              <button
                onClick={() => handleSendOtp()}
                disabled={!isValidPhone || loading}
                className="w-full h-10 mt-4 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    دریافت کد تأیید
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                  </>
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setSupportOpen(true)}
                  className="text-[10px] text-[var(--muted)] hover:text-[var(--gold)] transition inline-flex items-center gap-1"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  مشکل در ورود؟ پشتیبانی
                </button>
              </div>
            </div>
          )}

          {/* ============ مرحله ۲ ============ */}
          {step === "otp" && (
            <div className="slide-in-left">
              <button
                onClick={() => {
                  setStep("phone");
                  setDigits(["", "", "", ""]);
                  setOtpStatus("filling");
                  setError("");
                  setAttempts(0);
                }}
                disabled={otpStatus === "success"}
                className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--gold)] mb-3 transition disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                تغییر شماره
              </button>

              <h1 className="text-base font-bold mb-1">کد تأیید</h1>
              <p className="text-[11px] text-[var(--muted)] mb-5">
                کد ۴ رقمی به <span dir="ltr" className="font-mono font-bold text-[var(--text)]">{normalizedPhone}</span> ارسال شد
              </p>

              {/* ۴ مربع OTP — LTR استاندارد */}
              <div className={`flex justify-center gap-2 mb-4 ${shake ? "animate-shake" : ""}`} dir="ltr">
                {digits.map((d, i) => {
                  const showSuccess = otpStatus === "success";
                  const isVerifying = otpStatus === "verifying";
                  const isError = otpStatus === "error";
                  return (
                    <div key={i} className="relative" style={{ perspective: "1000px" }}>
                      <div
                        style={{
                          transformStyle: "preserve-3d",
                          transform: showSuccess ? "rotateY(180deg)" : "rotateY(0deg)",
                          transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
                          transitionDelay: showSuccess ? `${i * 70}ms` : "0ms",
                        }}
                      >
                        <div style={{ backfaceVisibility: "hidden" }}>
                          <input
                            ref={el => { inputRefs.current[i] = el; }}
                            type="tel"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={4}
                            value={d}
                            onChange={e => handleDigitChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            onPaste={handlePaste}
                            disabled={isVerifying || showSuccess || isLocked}
                            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-xl border-2 outline-none transition-all bg-[var(--bg)] ${
                              isError
                                ? "border-red-500 text-red-400"
                                : isLocked
                                ? "border-red-500/50 text-[var(--muted)] cursor-not-allowed"
                                : isVerifying
                                ? "border-[var(--gold)]/50 text-[var(--gold)] animate-pulse"
                                : d
                                ? "border-[var(--gold)] text-[var(--gold)] shadow-md shadow-[var(--gold)]/15"
                                : "border-[var(--border)] text-[var(--text)] focus:border-[var(--gold)] focus:shadow-md focus:shadow-[var(--gold)]/10"
                            }`}
                          />
                        </div>
                        <div
                          className="absolute inset-0 w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 border-emerald-500 bg-emerald-500/15 flex items-center justify-center"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && <p className="text-[10px] text-red-400 text-center mb-2">{error}</p>}
              {isLocked && (
                <p className="text-[10px] text-amber-400 text-center mb-2">🔒 قفل موقت: {lockRemain} ثانیه</p>
              )}
              {otpStatus === "verifying" && (
                <p className="text-[10px] text-[var(--gold)] text-center mb-2 flex items-center justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin" />
                  در حال بررسی...
                </p>
              )}
              {otpStatus === "success" && (
                <p className="text-[10px] text-emerald-400 text-center mb-2 fade-in">✓ کد تأیید شد</p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={digits.some(d => !d) || otpStatus === "verifying" || otpStatus === "success" || isLocked}
                className="w-full h-10 mt-3 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-1.5"
              >
                {otpStatus === "verifying" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    در حال بررسی...
                  </>
                ) : "تأیید و ادامه"}
              </button>

              <div className="mt-3 text-center">
                {resendIn > 0 ? (
                  <p className="text-[10px] text-[var(--muted)]">
                    ارسال مجدد تا <span className="font-mono font-bold text-[var(--text)]">{resendIn}</span> ثانیه
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-[10px] text-[var(--gold)] hover:underline font-bold disabled:opacity-50"
                  >
                    {loading ? "در حال ارسال..." : "ارسال مجدد کد"}
                  </button>
                )}
              </div>

              <div className="text-[9.5px] text-[var(--muted)] mt-3 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-2.5 text-center">
                🔒 در نسخه دمو، کد <span className="font-mono font-bold text-[var(--gold)]">1234</span> را وارد کنید
              </div>
            </div>
          )}
        </div>
      </div>

      {/* مودال پشتیبانی */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSupportOpen(false)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3.5 border-b border-[var(--border)]">
              <h2 className="font-bold text-xs">پشتیبانی کیف زرگر</h2>
              <button onClick={() => setSupportOpen(false)} className="text-[var(--muted)] hover:text-[var(--text)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-3 space-y-2">
              <a href="tel:02191000000" className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--gold)]/50 hover:bg-[var(--panel-2)] transition">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-base shrink-0">📞</div>
                <div className="flex-1 text-right">
                  <div className="text-[11px] font-bold">تماس تلفنی</div>
                  <div className="text-[9.5px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">021-91000000</div>
                </div>
              </a>
              <a href="https://wa.me/989120000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--gold)]/50 hover:bg-[var(--panel-2)] transition">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-base shrink-0">💬</div>
                <div className="flex-1 text-right">
                  <div className="text-[11px] font-bold">واتساپ</div>
                  <div className="text-[9.5px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">+98 912 000 0000</div>
                </div>
              </a>
              <a href="mailto:support@kifzargar.com" className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--gold)]/50 hover:bg-[var(--panel-2)] transition">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-base shrink-0">✉️</div>
                <div className="flex-1 text-right">
                  <div className="text-[11px] font-bold">ایمیل</div>
                  <div className="text-[9.5px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">support@kifzargar.com</div>
                </div>
              </a>
            </div>
            <div className="p-3 border-t border-[var(--border)] text-[9.5px] text-[var(--muted)] text-center">
              شنبه تا پنجشنبه · ۹ صبح تا ۹ شب
            </div>
          </div>
        </div>
      )}
    </>
  );
}