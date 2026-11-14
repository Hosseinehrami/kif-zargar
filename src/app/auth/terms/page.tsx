"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { TERMS_VERSION, TERMS_UPDATED_AT, TERMS_SUMMARY } from "@/lib/legal";

export default function TermsPage() {
  const router = useRouter();
  const { user, isLoading, isTermsAccepted, hasPin, signTerms } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const [shake, setShake] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.phone) {
      router.replace("/auth/login");
    } else if (isTermsAccepted) {
      router.replace(user.kycStatus === "verified" ? "/" : "/auth/verify");
    } else if (!hasPin) {
      router.replace("/auth/pin");
    }
  }, [isLoading, user, isTermsAccepted, hasPin, router]);

  function handleDigit(d: string) {
    if (pin.length >= 4) return;
    setError("");
    setPin(prev => prev + d);
  }

  function handleBackspace() {
    setPin(prev => prev.slice(0, -1));
    setError("");
  }

  async function handleSign() {
    if (!agreed || pin.length !== 4 || signing) return;
    setSigning(true);
    setError("");
    const result = await signTerms(pin);
    if (result.success && result.signature) {
      setSignature(result.signature);
    } else {
      setError(result.error || "خطا در امضا");
      setShake(true);
      await new Promise(r => setTimeout(r, 450));
      setPin("");
      setShake(false);
    }
    setSigning(false);
  }

  if (signature) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4" dir="rtl">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-lg font-bold mb-2">قوانین با موفقیت امضا شد</h1>
          <p className="text-[11px] text-[var(--muted)] mb-4">از این پس می‌توانید از تمام خدمات استفاده کنید</p>
          <div className="rounded-xl border-2 border-[var(--gold)]/40 bg-[var(--bg)]/60 p-4 mb-4">
            <div className="text-[9px] text-[var(--muted)] mb-1">شماره قرارداد امضای دیجیتال</div>
            <div className="text-base font-black text-[var(--gold)] font-mono tracking-wider" dir="ltr">
              {signature}
            </div>
          </div>
          <button
            onClick={() => router.replace("/")}
            className="w-full h-11 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 transition"
          >
            ورود به اپلیکیشن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-6 flex items-start justify-center" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="text-2xl font-black text-[var(--gold)] font-serif italic tracking-widest mb-1">KIFE ZARGAR</div>
          <div className="text-[10px] text-[var(--muted)]">پذیرش قوانین و شرایط</div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center text-2xl mb-2">📜</div>
            <h1 className="text-base font-bold mb-1">قوانین و شرایط استفاده</h1>
            <p className="text-[10.5px] text-[var(--muted)] leading-relaxed">برای شروع، لطفاً قوانین را مطالعه و با کد امن خود امضا کنید</p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-3 mb-3 max-h-[260px] overflow-y-auto">
            <div className="text-[9px] text-[var(--muted)] mb-2 font-bold">خلاصه‌ی مهم‌ترین موارد</div>
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

          <div className="flex items-center justify-between text-[9px] text-[var(--muted)] mb-3 px-1">
            <span>نسخه {TERMS_VERSION}</span>
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline font-bold">متن کامل ↗</Link>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] cursor-pointer hover:border-[var(--gold)]/40 transition mb-3">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--gold)] shrink-0" />
            <div className="flex-1 text-[10.5px] leading-relaxed">
              <span className="text-[var(--text)]">قوانین را مطالعه کرده و <span className="font-bold text-[var(--gold)]">می‌پذیرم</span>.</span>
              <div className="text-[9px] text-[var(--muted)] mt-1">برای امضا، کد امن ۴ رقمی خود را وارد کنید.</div>
            </div>
          </label>

          {agreed && (
            <div className="mb-3 fade-in">
              <label className="text-[10px] text-[var(--muted)] block mb-1.5">کد امن (PIN)</label>
              <div className="flex justify-center gap-2 mb-2" dir="ltr">
                {[0, 1, 2, 3].map(i => {
                  const filled = i < pin.length;
                  return (
                    <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black transition ${filled ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--border)] bg-[var(--bg)]"}`}>
                      {filled ? "●" : ""}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2" dir="ltr">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                  <button key={d} type="button" onClick={() => handleDigit(String(d))} className="h-10 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-sm font-bold text-[var(--text)] hover:bg-[var(--panel)] transition">
                    {d}
                  </button>
                ))}
                <button type="button" onClick={handleBackspace} className="h-10 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-sm font-bold text-red-400 hover:bg-red-500/10 transition">⌫</button>
                <button type="button" onClick={() => handleDigit("0")} className="h-10 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-sm font-bold text-[var(--text)] hover:bg-[var(--panel)] transition">0</button>
                <button type="button" onClick={handleSign} disabled={pin.length !== 4 || signing} className="h-10 rounded-lg bg-[var(--gold)] text-black text-sm font-bold hover:bg-[var(--gold)]/90 disabled:opacity-40 transition">
                  {signing ? "..." : "تأیید"}
                </button>
              </div>
              {error && <p className="text-[10px] text-red-400 text-center mt-2">{error}</p>}
            </div>
          )}

          <button
            onClick={handleSign}
            disabled={!agreed || pin.length !== 4 || signing}
            className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-2 mt-3"
          >
            {signing ? (
              <><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال امضا...</>
            ) : (
              "امضا و پذیرش قوانین"
            )}
          </button>
        </div>

        <div className="text-center text-[9px] text-[var(--muted)] mt-4 leading-relaxed">
          کیف زرگر — پلتفرم هوشمند سرمایه‌گذاری طلا
          <br />
          نسخه‌ی قوانین: {TERMS_VERSION} · آخرین به‌روزرسانی: {TERMS_UPDATED_AT}
        </div>
      </div>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        .animate-shake { animation: shake 0.4s ease; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );
}