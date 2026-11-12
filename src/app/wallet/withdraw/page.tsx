"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

// قوانین
const MIN_WITHDRAW = 200_000;
const INSTANT_FEE_RATE = 0.01;
const INSTANT_START_HOUR = 3;
const INSTANT_END_HOUR = 12.5;
const AVAILABLE_BALANCE = 171_274_000;

const USER_CARDS = [
  { id: "card1", bank: "بانک ملی ایران", last4: "4589", isDefault: true },
  { id: "card2", bank: "بانک سامان", last4: "7823", isDefault: false },
];

type Tab = "instant" | "normal";
type Step = "form" | "pin" | "success";

type WindowStatus = {
  allowed: boolean;
  reason?: string;
};

function checkInstantWindow(): WindowStatus {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  if (hour < INSTANT_START_HOUR) {
    const remaining = Math.ceil(INSTANT_START_HOUR - hour);
    return {
      allowed: false,
      reason: `برداشت فوری از ساعت ۰۳:۰۰ صبح شروع می‌شود (${format(remaining)} ساعت دیگر)`,
    };
  }

  if (hour > INSTANT_END_HOUR) {
    return {
      allowed: false,
      reason: "ساعت مجاز برداشت فوری (۰۳:۰۰ - ۱۲:۳۰) به پایان رسیده است",
    };
  }

  return { allowed: true };
}

export default function WithdrawPage() {
  const router = useRouter();
  const { user, hasPin } = useAuth();

  const [tab, setTab] = useState<Tab>("normal");
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [selectedCard, setSelectedCard] = useState(USER_CARDS[0].id);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [instantWindow, setInstantWindow] = useState<WindowStatus>({ allowed: true });
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [pinShake, setPinShake] = useState(false);

  useEffect(() => {
    setInstantWindow(checkInstantWindow());
    const t = setInterval(() => setInstantWindow(checkInstantWindow()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (pinDigits.every(d => d) && step === "pin") {
      handlePinVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinDigits]);

  const amountNum = Number(amount) || 0;
  const fee = tab === "instant" ? amountNum * INSTANT_FEE_RATE : 0;
  const finalAmount = amountNum - fee;
  const enoughBalance = amountNum <= AVAILABLE_BALANCE;
  const isValid =
    amountNum >= MIN_WITHDRAW &&
    enoughBalance &&
    (tab === "normal" || instantWindow.allowed);

  const selectedCardObj = USER_CARDS.find(c => c.id === selectedCard);

  function proceedToPin() {
    if (!isValid) return;
    if (hasPin) {
      setStep("pin");
      setPinDigits(["", "", "", ""]);
      setPinError("");
    } else {
      handleFinalSubmit();
    }
  }

  async function handlePinVerify() {
    const pin = pinDigits.join("");
    await new Promise(r => setTimeout(r, 400));

    if (user?.securityPin === pin) {
      handleFinalSubmit();
    } else {
      setPinError("کد امن اشتباه است");
      setPinShake(true);
      await new Promise(r => setTimeout(r, 400));
      setPinDigits(["", "", "", ""]);
      setPinShake(false);
    }
  }

  async function handleFinalSubmit() {
    await new Promise(r => setTimeout(r, 800));
    setStep("success");
  }

  function handlePinDigit(idx: number, val: string) {
    const en = toEnDigits(val).replace(/\D/g, "");
    if (!en) {
      const next = [...pinDigits];
      next[idx] = "";
      setPinDigits(next);
      return;
    }
    const next = [...pinDigits];
    next[idx] = en[0];
    setPinDigits(next);
    if (idx < 3) {
      const ref = document.getElementById(`pin-${idx + 1}`) as HTMLInputElement;
      ref?.focus();
    }
  }

  function handlePinBackspace(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !pinDigits[idx] && idx > 0) {
      const ref = document.getElementById(`pin-${idx - 1}`) as HTMLInputElement;
      ref?.focus();
    }
  }

  return (
    <>
      <div className="px-2.5 sm:px-4 pt-3 pb-8">
        {/* هدر */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition"
            aria-label="بازگشت"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-base sm:text-lg">برداشت وجه</h1>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">انتقال پول به حساب بانکی شما</p>
          </div>
        </div>

        {step === "form" && (
          <>
            {/* موجودی قابل برداشت */}
            <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[var(--muted)] mb-0.5">موجودی قابل برداشت</div>
                  <div className="text-lg font-black text-[var(--text)]">
                    {format(AVAILABLE_BALANCE)}
                    <span className="text-[10px] font-normal text-[var(--muted)] mr-1">تومان</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(String(AVAILABLE_BALANCE))}
                  className="text-[10px] font-bold text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/30 px-2.5 py-1 rounded-lg hover:bg-[var(--gold)]/20 transition"
                >
                  همه
                </button>
              </div>
            </div>

            {/* تب‌ها */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTab("instant")}
                disabled={!instantWindow.allowed}
                className={`relative rounded-2xl p-3 text-right transition border-2 ${
                  tab === "instant"
                    ? "border-[var(--gold)] bg-[var(--gold)]/10"
                    : instantWindow.allowed
                    ? "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--gold)]/50"
                    : "border-[var(--border)] bg-[var(--panel)] opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">⚡</span>
                  <span className="text-xs font-bold">فوری</span>
                  {tab === "instant" && <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] mr-auto" />}
                </div>
                <div className="text-[9.5px] text-[var(--muted)] leading-relaxed">امروز واریز می‌شود</div>
                <div className="mt-2 text-[10px] font-bold text-red-400">کارمزد ۱٪</div>
                <div className="text-[9px] text-[var(--muted)] mt-0.5">۰۳:۰۰ - ۱۲:۳۰</div>
              </button>

              <button
                type="button"
                onClick={() => setTab("normal")}
                className={`relative rounded-2xl p-3 text-right transition border-2 ${
                  tab === "normal"
                    ? "border-[var(--gold)] bg-[var(--gold)]/10"
                    : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--gold)]/50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">🕐</span>
                  <span className="text-xs font-bold">عادی</span>
                  {tab === "normal" && <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] mr-auto" />}
                </div>
                <div className="text-[9.5px] text-[var(--muted)] leading-relaxed">۲۴ تا ۷۲ ساعت</div>
                <div className="mt-2 text-[10px] font-bold text-emerald-400">بدون کارمزد</div>
                <div className="text-[9px] text-[var(--muted)] mt-0.5">همیشه فعال</div>
              </button>
            </div>

            {/* هشدارها */}
            {tab === "instant" && !instantWindow.allowed && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex gap-2.5">
                <span className="text-base shrink-0">⏰</span>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-amber-400">برداشت فوری در دسترس نیست</div>
                  <div className="text-[10px] text-[var(--muted)] mt-1 leading-relaxed">{instantWindow.reason}</div>
                </div>
              </div>
            )}

            {tab === "normal" && (
              <div className="mb-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex gap-2.5">
                <span className="text-base shrink-0">ℹ️</span>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-sky-400">زمان واریز</div>
                  <div className="text-[10px] text-[var(--muted)] mt-1 leading-relaxed">
                    مبلغ تا ۲۴ تا ۷۲ ساعت کاری آینده به حساب شما واریز می‌شود. روزهای تعطیل محاسبه نمی‌شوند.
                  </div>
                </div>
              </div>
            )}

            {/* ورودی مبلغ */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-4">
              <label className="text-[10px] text-[var(--muted)] block mb-1.5">مبلغ برداشت (تومان)</label>
              <div className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-3 transition-all ${
                amount && !isValid
                  ? "border-red-500/50"
                  : isValid
                  ? "border-emerald-500/50"
                  : "border-[var(--border)] focus-within:border-[var(--gold)]"
              }`}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount ? Number(amount).toLocaleString("en-US") : ""}
                  onChange={e => setAmount(toEnDigits(e.target.value).replace(/\D/g, ""))}
                  placeholder="حداقل ۲۰۰,۰۰۰ تومان"
                  className="w-full bg-transparent text-center text-lg font-black text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal placeholder:text-sm outline-none"
                  dir="ltr"
                />
              </div>

              {amountNum > 0 && amountNum < MIN_WITHDRAW && (
                <p className="text-[10px] text-red-400 mt-1.5">حداقل مبلغ برداشت {format(MIN_WITHDRAW)} تومان است</p>
              )}
              {!enoughBalance && (
                <p className="text-[10px] text-red-400 mt-1.5">مبلغ بیشتر از موجودی قابل برداشت است</p>
              )}

              {amountNum > 0 && isValid && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--muted)]">مبلغ درخواستی</span>
                    <span className="font-semibold text-[var(--text)]">{format(amountNum)} تومان</span>
                  </div>
                  {tab === "instant" && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--muted)]">کارمزد فوری (۱٪)</span>
                      <span className="font-semibold text-red-400">−{format(fee)} تومان</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold border-t border-[var(--border)] pt-1.5">
                    <span className="text-[var(--text)]">مبلغ واریزی به حساب</span>
                    <span className="text-emerald-400">{format(finalAmount)} تومان</span>
                  </div>
                </div>
              )}
            </div>

            {/* انتخاب حساب */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-4">
              <div className="text-xs font-bold mb-3">حساب مقصد</div>
              <button
                type="button"
                onClick={() => setShowCardPicker(true)}
                className="w-full flex items-center gap-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 hover:border-[var(--gold)]/50 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-base shrink-0">
                  🏦
                </div>
                <div className="flex-1 text-right min-w-0">
                  <div className="text-[11px] font-bold">{selectedCardObj?.bank}</div>
                  <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">•••• {selectedCardObj?.last4}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={proceedToPin}
              disabled={!isValid}
              className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20"
            >
              برداشت {format(finalAmount)} تومان
            </button>

            <div className="text-[9.5px] text-[var(--muted)] text-center leading-relaxed mt-3 px-4">
              برداشت فقط به حساب‌های ثبت‌شده و به نام خودتان امکان‌پذیر است.
            </div>
          </>
        )}

        {step === "pin" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center text-2xl mb-3">
                🔒
              </div>
              <h2 className="text-base font-bold mb-1">تایید برداشت</h2>
              <p className="text-[11px] text-[var(--muted)]">
                برای امنیت، کد امن ۴ رقمی خود را وارد کنید
              </p>
            </div>

            <div className={`flex justify-center gap-2 mb-4 ${pinShake ? "animate-shake" : ""}`} dir="ltr">
              {pinDigits.map((d, i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handlePinDigit(i, e.target.value)}
                  onKeyDown={e => handlePinBackspace(i, e)}
                  autoFocus={i === 0}
                  className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all ${
                    pinError
                      ? "border-red-500 text-red-400"
                      : d
                      ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] text-[var(--text)] bg-[var(--bg)] focus:border-[var(--gold)]"
                  }`}
                />
              ))}
            </div>

            {pinError && <p className="text-[10px] text-red-400 text-center mb-3">{pinError}</p>}

            <div className="bg-[var(--panel-2)] rounded-lg p-2.5 mb-4 text-[10px] text-[var(--muted)]">
              <div className="flex justify-between">
                <span>مبلغ برداشت</span>
                <span className="text-[var(--text)] font-bold">{format(amountNum)} تومان</span>
              </div>
              {tab === "instant" && (
                <div className="flex justify-between mt-1">
                  <span>کارمزد</span>
                  <span className="text-red-400">−{format(fee)} تومان</span>
                </div>
              )}
              <div className="flex justify-between mt-1 pt-1 border-t border-[var(--border)]">
                <span>واریزی به حساب</span>
                <span className="text-emerald-400 font-bold">{format(finalAmount)} تومان</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setStep("form"); setPinDigits(["", "", "", ""]); setPinError(""); }}
              className="w-full h-10 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] font-bold text-xs hover:bg-[var(--panel)] transition"
            >
              انصراف
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-emerald-500 opacity-30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-base font-bold mb-2">درخواست برداشت ثبت شد</h2>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-5">
              {tab === "instant"
                ? "مبلغ حداکثر تا پایان وقت اداری امروز به حساب شما واریز می‌شود."
                : "مبلغ تا ۲۴ تا ۷۲ ساعت کاری آینده به حساب شما واریز می‌شود."}
            </p>

            <div className="bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-3 mb-5 text-right space-y-1.5">
              <div className="flex justify-between text-[10.5px]">
                <span className="text-[var(--muted)]">مبلغ</span>
                <span className="font-bold text-[var(--gold)]">{format(finalAmount)} تومان</span>
              </div>
              <div className="flex justify-between text-[10.5px]">
                <span className="text-[var(--muted)]">به حساب</span>
                <span className="font-mono font-bold text-[var(--text)]" dir="ltr">•••• {selectedCardObj?.last4}</span>
              </div>
              <div className="flex justify-between text-[10.5px]">
                <span className="text-[var(--muted)]">نوع برداشت</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  tab === "instant" ? "text-amber-400 bg-amber-500/10" : "text-sky-400 bg-sky-500/10"
                }`}>
                  {tab === "instant" ? "⚡ فوری" : "🕐 عادی"}
                </span>
              </div>
              <div className="flex justify-between text-[10.5px] pt-1.5 border-t border-[var(--border)]">
                <span className="text-[var(--muted)]">وضعیت</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">در حال پردازش</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/wallet")}
              className="w-full h-10 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 transition"
            >
              بازگشت به کیف پول
            </button>
          </div>
        )}
      </div>

      {/* مودال انتخاب کارت */}
      {showCardPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setShowCardPicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">انتخاب حساب مقصد</h3>
              <button
                type="button"
                onClick={() => setShowCardPicker(false)}
                className="text-[var(--muted)]"
                aria-label="بستن"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {USER_CARDS.map(card => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => { setSelectedCard(card.id); setShowCardPicker(false); }}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl border transition text-right ${
                    selectedCard === card.id
                      ? "border-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] hover:bg-[var(--panel-2)]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-base shrink-0">
                    🏦
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold">{card.bank}</div>
                    <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">•••• {card.last4}</div>
                  </div>
                  {selectedCard === card.id && (
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

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </>
  );
}