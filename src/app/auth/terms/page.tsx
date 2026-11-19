"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { TERMS_VERSION, TERMS_UPDATED_AT } from "@/lib/legal";
import { Modal } from "@/components/ui/Modal";

export default function TermsPage() {
  const router = useRouter();
  const { user, isLoading, isTermsAccepted, hasPin, signTerms } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  
  // 👇 استیت برای باز و بسته کردن مودال قوانین
  const [isTermsOpen, setIsTermsOpen] = useState(false);

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
      setPin("");
    }
    setSigning(false);
  }

  if (signature) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-lg font-bold mb-2">قوانین با موفقیت امضا شد</h1>
        <p className="text-[11px] text-[var(--muted)] mb-4">از این پس می‌توانید از تمام خدمات استفاده کنید</p>
        
        <div className="rounded-xl border-2 border-[var(--gold)]/40 bg-[var(--bg)]/60 p-4 mb-6">
          <div className="text-[9px] text-[var(--muted)] mb-1">شماره قرارداد امضای دیجیتال</div>
          <div className="text-base font-black text-[var(--gold)] font-mono tracking-wider" dir="ltr">
            {signature}
          </div>
        </div>
        
        <button
          onClick={() => router.replace("/")}
          className="w-full h-11 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 transition shadow-lg shadow-[var(--gold)]/20"
        >
          ورود به اپلیکیشن
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-5">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center text-2xl mb-2">
          📜
        </div>
        <h1 className="text-lg font-bold mb-1.5">قوانین و شرایط استفاده</h1>
        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
          برای شروع، لطفاً قوانین را مطالعه و با کد امن خود امضا کنید
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        
        {/* 👇 دکمه باز کردن مودال قوانین (بدون خروج از صفحه) */}
        <button 
          onClick={() => setIsTermsOpen(true)}
          className="flex items-center justify-between w-full p-3 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 hover:bg-[var(--gold)]/10 transition mb-4 group"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <span className="text-[11px] font-bold text-[var(--text)] group-hover:text-[var(--gold)] transition">
              مشاهده متن کامل قوانین
            </span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[var(--gold)]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div className="flex items-center justify-between text-[9px] text-[var(--muted)] mb-4 px-1">
          <span>نسخه {TERMS_VERSION}</span>
          <span>آخرین به‌روزرسانی: {TERMS_UPDATED_AT}</span>
        </div>

        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] cursor-pointer hover:border-[var(--gold)]/40 transition mb-4">
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={e => setAgreed(e.target.checked)} 
            className="mt-0.5 w-4 h-4 accent-[var(--gold)] shrink-0" 
          />
          <div className="flex-1 text-[10.5px] leading-relaxed">
            <span className="text-[var(--text)]">قوانین را مطالعه کرده و <span className="font-bold text-[var(--gold)]">می‌پذیرم</span>.</span>
            <div className="text-[9px] text-[var(--muted)] mt-1">برای امضا، کد امن ۴ رقمی خود را وارد کنید.</div>
          </div>
        </label>

        {agreed && (
          <div className="mb-2 fade-in">
            <label className="text-[10px] text-[var(--muted)] block mb-2 text-center">کد امن (PIN)</label>
            <div className="flex justify-center gap-2 mb-3" dir="ltr">
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
          className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-2 mt-4"
        >
          {signing ? (
            <><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال امضا...</>
          ) : (
            "امضا و پذیرش قوانین"
          )}
        </button>
      </div>

      {/* 👇 مودال نمایش متن کامل قوانین */}
      <Modal 
        open={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
        title="متن کامل قوانین و مقررات" 
        size="lg"
      >
        <div className="space-y-4 text-[11.5px] text-[var(--text)] leading-relaxed text-justify pb-4">
          <p className="font-bold text-[var(--gold)]">
            به کیف زرگر خوش آمدید. لطفاً قبل از استفاده از خدمات، شرایط زیر را به دقت مطالعه فرمایید.
          </p>
          
          <div>
            <h3 className="font-bold mb-1 text-[var(--gold)]">۱. پذیرش قوانین</h3>
            <p className="text-[var(--muted)]">با ثبت‌نام و استفاده از خدمات کیف زرگر، شما تایید می‌کنید که این شرایط و قوانین را خوانده‌اید و می‌پذیرید. در صورت عدم موافقت، لطفاً از خدمات ما استفاده نکنید.</p>
          </div>

          <div>
            <h3 className="font-bold mb-1 text-[var(--gold)]">۲. احراز هویت</h3>
            <p className="text-[var(--muted)]">برای استفاده کامل از خدمات (به‌ویژه برداشت فیزیکی و انتقال)، ارائه‌ی کد ملی و تطبیق آن با سامانه شاهکار الزامی است.</p>
          </div>

          <div>
            <h3 className="font-bold mb-1 text-[var(--gold)]">۳. معاملات و ریسک بازار</h3>
            <p className="text-[var(--muted)]">خرید و فروش طلا همواره با ریسک نوسانات قیمت همراه است. مسئولیت تصمیمات معاملاتی و سرمایه‌گذاری با شماست و کیف زرگر هیچ تضمینی در قبال سود یا زیان شما نمی‌دهد.</p>
          </div>

          <div>
            <h3 className="font-bold mb-1 text-[var(--gold)]">۴. کارمزدها</h3>
            <p className="text-[var(--muted)]">میزان کارمزدها در صفحه‌ی انجام معامله به صورت شفاف نمایش داده می‌شود. کیف زرگر حق تغییر کارمزدها را با اطلاع‌رسانی قبلی محفوظ می‌دارد.</p>
          </div>

          <div>
            <h3 className="font-bold mb-1 text-[var(--gold)]">۵. امنیت حساب</h3>
            <p className="text-[var(--muted)]">حفظ کد امن (PIN) و عدم افشای آن به دیگران، بر عهده‌ی کاربر است. هرگونه فعالیت مشکوک را بلافاصله به پشتیبانی اطلاع دهید.</p>
          </div>

          <div>
            <h3 className="font-bold mb-1 text-[var(--gold)]">۶. محدودیت‌های برداشت</h3>
            <p className="text-[var(--muted)]">جهت رعایت قوانین مبارزه با پول‌شویی، برداشت وجه تنها به حساب‌های بانکی به نام خود کاربر امکان‌پذیر است.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}