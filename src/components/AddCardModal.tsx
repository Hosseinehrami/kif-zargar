"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

const BANKS = [
  { id: "melli", name: "بانک ملی ایران", icon: "🏛" },
  { id: "saderat", name: "بانک صادرات", icon: "🏦" },
  { id: "tejarat", name: "بانک تجارت", icon: "🏢" },
  { id: "saman", name: "بانک سامان", icon: "🏪" },
  { id: "parsian", name: "بانک پارسیان", icon: "🏬" },
  { id: "pasargad", name: "بانک پاسارگاد", icon: "🏦" },
  { id: "mellat", name: "بانک ملت", icon: "🏛" },
  { id: "refah", name: "بانک رفاه", icon: "🏪" },
  { id: "sepah", name: "بانک سپه", icon: "🏢" },
  { id: "other", name: "سایر بانک‌ها", icon: "🏦" },
];

export type BankCard = {
  id: string;
  bank: string;
  last4: string;
  iban: string;
  cardNumber: string;
  isDefault: boolean;
};

type Step = "form" | "verifying" | "success" | "error";

export default function AddCardModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (card: BankCard) => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [shabaDigits, setShabaDigits] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [error, setError] = useState("");

  // شبا فقط ۲۴ رقم (بعد از IR)
  const shabaClean = toEnDigits(shabaDigits).replace(/\D/g, "").slice(0, 24);
  const isShabaValid = shabaClean.length === 24;

  // کارت ۱۶ رقم
  const cardClean = toEnDigits(cardNumber).replace(/\D/g, "");
  const isCardValid = /^\d{16}$/.test(cardClean);

  const fullShaba = `IR${shabaClean}`;
  const isValid = isShabaValid && isCardValid;

  // کد ملی خودکار از حساب کاربر
  const userNationalId = user?.nationalId || "";
  const hasNationalId = userNationalId.length === 10;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function formatGroups(digits: string, groupSize = 4) {
    const re = new RegExp(`.{1,${groupSize}}`, "g");
    return (digits.match(re) || []).join(" ");
  }

  function handleShabaChange(v: string) {
    const clean = toEnDigits(v).replace(/\D/g, "").slice(0, 24);
    setShabaDigits(clean);
    setError("");
  }

  function handleCardChange(v: string) {
    const clean = toEnDigits(v).replace(/\D/g, "").slice(0, 16);
    setCardNumber(clean);
    setError("");
  }

  async function verifyWithShahkar() {
    if (!isValid) return;

    if (!hasNationalId) {
      setError("کد ملی شما در حساب ثبت نشده. ابتدا احراز هویت کنید.");
      return;
    }

    setStep("verifying");
    setError("");

    // ============================================================
    // 🔗 در بک‌اند واقعی، این بخش با این کد جایگزین می‌شود:
    //
    // const res = await fetch("/api/verify-shaba", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     shaba: fullShaba,
    //     nationalId: userNationalId,
    //   }),
    // });
    //
    // const data = await res.json();
    //
    // if (!data.success) {
    //   setStep("error");
    //   setError(data.error || "شبا با کد ملی شما مطابقت ندارد");
    //   return;
    // }
    //
    // در بک‌اند:
    //   - درخواست به شناسار (shahkar.ir) با shaba + nationalId
    //   - اگر تطبیق داشت → success: true
    //   - اگر نداشت → success: false
    // ============================================================

    // شبیه‌سازی حالا
    await new Promise(r => setTimeout(r, 1800));

    // تست خطا: شبایی که با 00 شروع شود رد می‌شود
    if (shabaClean.startsWith("00")) {
      setStep("error");
      setError("شبا وارد شده با کد ملی شما مطابقت ندارد");
      return;
    }

    // موفق
    setStep("success");
    await new Promise(r => setTimeout(r, 1600));

    onAdd({
      id: "card-" + Date.now(),
      bank: selectedBank.name,
      last4: cardClean.slice(-4),
      iban: fullShaba,
      cardNumber: cardClean,
      isDefault: false,
    });
  }

  function retry() {
    setStep("form");
    setError("");
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex items-end sm:items-center justify-center"
        onClick={step === "verifying" || step === "success" ? undefined : onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden my-4"
          onClick={e => e.stopPropagation()}
        >
          {/* هدر */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold">
                  {step === "form" && "افزودن کارت بانکی"}
                  {step === "verifying" && "در حال استعلام"}
                  {step === "success" && "کارت اضافه شد"}
                  {step === "error" && "استعلام ناموفق"}
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-0.5">
                  {step === "form" && "اطلاعات حساب خود را وارد کنید"}
                  {step === "verifying" && "استعلام از سامانه شاهکار"}
                  {step === "success" && "کارت با موفقیت ثبت شد"}
                  {step === "error" && "لطفاً اطلاعات را بررسی کنید"}
                </div>
              </div>
            </div>
            {step !== "verifying" && step !== "success" && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition"
                aria-label="بستن"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* بدنه */}
          <div className="p-4">
            {/* ===== مرحله فرم ===== */}
            {step === "form" && (
              <>
                {/* کد ملی کاربر (نمایش) */}
                <div className="bg-[var(--panel-2)] rounded-xl p-2.5 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[9px] text-[var(--muted)]">کد ملی (خودکار)</div>
                      <div className="text-[11px] font-mono font-bold text-[var(--text)]" dir="ltr">
                        {hasNationalId ? userNationalId : "ثبت نشده"}
                      </div>
                    </div>
                  </div>
                  {hasNationalId && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                {/* انتخاب بانک */}
                <label className="text-[10px] text-[var(--muted)] block mb-1.5">بانک</label>
                <button
                  type="button"
                  onClick={() => setShowBankPicker(true)}
                  className="w-full flex items-center gap-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 mb-3 hover:border-[var(--gold)]/50 transition"
                >
                  <span className="text-base">{selectedBank.icon}</span>
                  <span className="flex-1 text-right text-[12px] font-bold">{selectedBank.name}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* شماره شبا با IR ثابت */}
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-[var(--muted)]">شماره شبا</label>
                  <span className="text-[9px] text-[var(--muted)] font-mono" dir="ltr">
                    {shabaClean.length}/24
                  </span>
                </div>
                <div
                  className={`flex items-stretch rounded-xl border-2 bg-[var(--bg)] mb-3 overflow-hidden transition-all ${
                    shabaDigits && !isShabaValid
                      ? "border-red-500/50"
                      : isShabaValid
                      ? "border-emerald-500/50"
                      : "border-[var(--border)] focus-within:border-[var(--gold)]"
                  }`}
                  dir="ltr"
                >
                  {/* IR ثابت */}
                  <div className="flex items-center justify-center px-3 bg-[var(--gold)]/10 border-r border-[var(--border)]">
                    <span className="text-sm font-mono font-black text-[var(--gold)] select-none">
                      IR
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatGroups(shabaClean)}
                    onChange={e => handleShabaChange(e.target.value)}
                    placeholder="0000 0000 0000 0000 0000 0000"
                    className="flex-1 min-w-0 bg-transparent text-center text-[11px] font-mono font-bold text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal outline-none py-2.5"
                    autoFocus
                  />
                </div>
                {shabaDigits && !isShabaValid && (
                  <p className="text-[9.5px] text-red-400 mb-2 -mt-1.5">
                    {24 - shabaClean.length} رقم دیگر وارد کنید
                  </p>
                )}

                {/* شماره کارت */}
                <label className="text-[10px] text-[var(--muted)] block mb-1.5">شماره کارت</label>
                <div
                  className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-2.5 mb-3 transition-all ${
                    cardNumber && !isCardValid
                      ? "border-red-500/50"
                      : isCardValid
                      ? "border-emerald-500/50"
                      : "border-[var(--border)] focus-within:border-[var(--gold)]"
                  }`}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatGroups(cardClean)}
                    onChange={e => handleCardChange(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-transparent text-center text-sm font-mono font-bold tracking-widest text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal outline-none"
                    dir="ltr"
                  />
                </div>
                {cardNumber && !isCardValid && (
                  <p className="text-[9.5px] text-red-400 mb-2 -mt-1.5">شماره کارت باید ۱۶ رقم باشد</p>
                )}

                {/* اطلاعات استعلام */}
                <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 mb-3 flex gap-2">
                  <span className="text-sm shrink-0">ℹ️</span>
                  <div className="text-[9.5px] text-sky-400 leading-relaxed">
                    با کلیک روی «استعلام»، شبا و کد ملی شما به‌صورت خودکار از سامانه <b>شاهکار</b> بررسی می‌شود. نیازی به کد پیامکی نیست.
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 mb-3 flex gap-2">
                    <span className="text-sm shrink-0">⚠️</span>
                    <div className="text-[9.5px] text-red-400 leading-relaxed">{error}</div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={verifyWithShahkar}
                  disabled={!isValid || !hasNationalId}
                  className="w-full h-10 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20"
                >
                  {!hasNationalId ? "ابتدا احراز هویت کنید" : "استعلام و ثبت کارت"}
                </button>
              </>
            )}

            {/* ===== مرحله استعلام ===== */}
            {step === "verifying" && (
              <div className="py-6 text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-[var(--gold)] opacity-30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin" />
                  </div>
                </div>

                <div className="text-sm font-bold mb-1.5">در حال استعلام از شاهکار</div>
                <div className="text-[11px] text-[var(--muted)] mb-4 leading-relaxed">
                  لطفاً صبر کنید، این فرآیند چند لحظه طول می‌کشد
                </div>

                {/* اطلاعات در حال بررسی */}
                <div className="bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-3 text-right space-y-1.5 text-[10px] max-w-xs mx-auto">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">کد ملی</span>
                    <span className="font-mono font-bold text-[var(--text)]" dir="ltr">{userNationalId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">شبا</span>
                    <span className="font-mono font-bold text-[var(--text)] text-[9px] truncate max-w-[140px]" dir="ltr">
                      {fullShaba.slice(0, 10)}...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ===== مرحله موفقیت ===== */}
            {step === "success" && (
              <div className="py-6 text-center">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-emerald-500 opacity-30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm font-bold mb-1">کارت با موفقیت اضافه شد</div>
                <div className="text-[10px] text-[var(--muted)]">
                  {selectedBank.name} · •••• {cardClean.slice(-4)}
                </div>
                <div className="mt-2 text-[9.5px] text-emerald-400">✓ تطبیق با کد ملی تایید شد</div>
              </div>
            )}

            {/* ===== مرحله خطا ===== */}
            {step === "error" && (
              <div className="py-6 text-center">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-red-500 opacity-30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm font-bold mb-1 text-red-400">استعلام ناموفق</div>
                <div className="text-[10px] text-[var(--muted)] mb-4 max-w-xs mx-auto leading-relaxed">
                  {error || "شبا وارد شده با کد ملی شما مطابقت ندارد"}
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4 max-w-xs mx-auto flex gap-2 text-right">
                  <span className="text-sm shrink-0">💡</span>
                  <div className="text-[9.5px] text-amber-400 leading-relaxed">
                    شبا باید به نام خودتان باشد (همان کد ملی). لطفاً اطلاعات حساب را دوباره بررسی کنید.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={retry}
                  className="w-full max-w-xs mx-auto h-10 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 transition"
                >
                  تلاش مجدد
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مودال انتخاب بانک */}
      {showBankPicker && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setShowBankPicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">انتخاب بانک</h3>
              <button
                type="button"
                onClick={() => setShowBankPicker(false)}
                className="text-[var(--muted)]"
                aria-label="بستن"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-1.5">
              {BANKS.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBank(b);
                    setShowBankPicker(false);
                  }}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition text-right ${
                    selectedBank.id === b.id
                      ? "border-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] hover:bg-[var(--panel-2)]"
                  }`}
                >
                  <span className="text-base">{b.icon}</span>
                  <span className="flex-1 text-[11px] font-bold">{b.name}</span>
                  {selectedBank.id === b.id && (
                    <span className="w-5 h-5 rounded-full bg-[var(--gold)] flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}