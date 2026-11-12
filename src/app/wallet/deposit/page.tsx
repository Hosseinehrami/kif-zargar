"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

// اطلاعات ثابت حساب پلتفرم
const PLATFORM_IBAN = "IR820170000000123456789012";
const PLATFORM_CARD = "6104-3378-1234-5678";
const PLATFORM_BANK = "بانک ملی ایران";
const MIN_DEPOSIT = 100_000;

type Tab = "gateway" | "manual" | "identifier";
type ManualStep = "form" | "success";
type IdentifierStep = "waiting" | "verified";

const QUICK_AMOUNTS = [500_000, 1_000_000, 5_000_000, 10_000_000];

// ================================================
// تولید شناسه ۸ رقمی ثابت و یکتا برای هر کاربر
// در بک‌اند واقعی: با چک کردن در DB انجام می‌شود
// ================================================
function generateUserDepositId(phone: string): string {
  // از شماره موبایل یک hash ثابت می‌سازیم
  // تا هر کاربر همیشه همان کد را داشته باشد
  let hash = 0;
  for (let i = 0; i < phone.length; i++) {
    hash = ((hash << 5) - hash) + phone.charCodeAt(i);
    hash = hash & hash; // تبدیل به 32bit
  }
  // تبدیل به ۸ رقم
  const absHash = Math.abs(hash);
  const eightDigit = String(absHash).padStart(10, "0").slice(2, 10);
  return eightDigit;
}

export default function DepositPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("identifier");
  
  // فرم مبلغ
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState<"iban" | "card" | "identifier" | null>(null);

  // درگاه بانکی
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<"idle" | "loading" | "success">("idle");

  // واریز دستی (فیش)
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualStep, setManualStep] = useState<ManualStep>("form");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // واریز شناسه‌دار
  const [identifierStep, setIdentifierStep] = useState<IdentifierStep>("waiting");
  const [identifierAmount, setIdentifierAmount] = useState("");

  // شناسه ثابت کاربر — از شماره موبایل تولید می‌شود
  const userDepositId = generateUserDepositId(user?.phone || "09000000000");
  const formattedId = `${userDepositId.slice(0, 4)}-${userDepositId.slice(4, 8)}`;

  const amountNum = Number(amount) || 0;
  const amountValid = amountNum >= MIN_DEPOSIT;
  const manualAmountNum = Number(manualAmount) || 0;
  const manualValid =
    !!receiptImage &&
    /^\d{8,}$/.test(trackingNumber) &&
    manualAmountNum >= MIN_DEPOSIT;
  const identifierAmountNum = Number(identifierAmount) || 0;
  const identifierValid = identifierAmountNum >= MIN_DEPOSIT;

  function copyToClipboard(text: string, type: "iban" | "card" | "identifier") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function pickReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("حجم فایل باید کمتر از ۵ مگابایت باشد");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setReceiptImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleGateway() {
    if (!amountValid) return;
    setGatewayOpen(true);
    setGatewayStatus("loading");
    await new Promise(r => setTimeout(r, 2000));
    setGatewayStatus("success");
  }

  async function handleManualSubmit() {
    if (!manualValid) return;
    setManualStep("success");
  }

  async function handleIdentifierConfirm() {
    if (!identifierValid) return;
    // شبیه‌سازی: در بک‌اند، بعد از تایید بانک، اینجا چک می‌شود
    setIdentifierStep("verified");
  }

  return (
    <>
      <div className="px-2.5 sm:px-4 pt-3 pb-8">
        {/* هدر */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition"
            aria-label="بازگشت"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-base sm:text-lg">واریز وجه</h1>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">افزایش موجودی ریالی کیف پول</p>
          </div>
        </div>

        {/* هشدار مهم */}
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex gap-2.5">
          <span className="text-base shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-amber-400">واریز فقط از حساب شخصی</div>
            <div className="text-[10px] text-[var(--muted)] mt-1 leading-relaxed">
              واریز باید <b className="text-[var(--text)]">فقط از حسابی به نام خودتان</b> انجام شود. در صورت واریز از حساب شخص ثالث، وجه برگشت داده شده و حساب شما مسدود می‌شود.
            </div>
          </div>
        </div>

        {/* تب‌ها */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--panel)] border border-[var(--border)] mb-4">
          <button
            onClick={() => setTab("identifier")}
            className={`py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
              tab === "identifier" ? "bg-[var(--gold)] text-black shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            ⚡ شناسه‌دار
          </button>
          <button
            onClick={() => setTab("gateway")}
            className={`py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
              tab === "gateway" ? "bg-[var(--gold)] text-black shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            💳 درگاه
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
              tab === "manual" ? "bg-[var(--gold)] text-black shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            📄 فیش
          </button>
        </div>

        {/* ============= تب واریز شناسه‌دار ============= */}
        {tab === "identifier" && identifierStep === "waiting" && (
          <div className="space-y-3">
            {/* کارت شناسه اختصاصی */}
            <div className="relative rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-4 overflow-hidden">
              <div className="absolute -right-6 -top-6 text-8xl opacity-10 pointer-events-none">🏷️</div>
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-bold text-[var(--gold)]">شناسه واریز اختصاصی شما</div>
                </div>
                <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-3">
                  این کد ۸ رقمی مخصوص شماست و در تمام واریزهایتان ثابت است.
                </p>

                <div className="bg-[var(--bg)] rounded-xl p-3 border border-[var(--gold)]/20 flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] text-[var(--muted)] mb-1">شناسه واریز</span>
                    <span className="font-mono text-xl font-black text-[var(--gold)] tracking-[0.2em]" dir="ltr">
                      {formattedId}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(userDepositId, "identifier")}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition ${
                      copied === "identifier"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90"
                    }`}
                    title="کپی شناسه"
                  >
                    {copied === "identifier" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* اطلاعات حساب مقصد */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] flex items-center justify-center text-[10px] font-bold">۱</div>
                <div className="text-xs font-bold">به حساب زیر واریز کنید</div>
              </div>

              <div className="space-y-2">
                <div className="bg-[var(--bg)] rounded-lg p-2.5 border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] text-[var(--muted)]">شماره شبا</span>
                    <span className="text-[9px] text-[var(--gold)] font-bold">{PLATFORM_BANK}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] font-bold text-[var(--text)] break-all" dir="ltr">{PLATFORM_IBAN}</span>
                    <button onClick={() => copyToClipboard(PLATFORM_IBAN, "iban")} className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition ${copied === "iban" ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--panel)] text-[var(--gold)] hover:bg-[var(--panel-2)]"}`}>
                      {copied === "iban" ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--bg)] rounded-lg p-2.5 border border-[var(--border)]">
                  <div className="text-[9.5px] text-[var(--muted)] mb-1">شماره کارت</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--text)]" dir="ltr">{PLATFORM_CARD}</span>
                    <button onClick={() => copyToClipboard(PLATFORM_CARD.replace(/-/g, ""), "card")} className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition ${copied === "card" ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--panel)] text-[var(--gold)] hover:bg-[var(--panel-2)]"}`}>
                      {copied === "card" ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* نحوه واریز */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] flex items-center justify-center text-[10px] font-bold">۲</div>
                <div className="text-xs font-bold">مبلغ واریزی خود را وارد کنید</div>
              </div>

              <label className="text-[10px] text-[var(--muted)] block mb-1.5">مبلغ (تومان)</label>
              <div className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-3 transition-all ${
                identifierAmount && !identifierValid
                  ? "border-red-500/50"
                  : identifierValid
                  ? "border-emerald-500/50"
                  : "border-[var(--border)] focus-within:border-[var(--gold)]"
              }`}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={identifierAmount ? Number(identifierAmount).toLocaleString("en-US") : ""}
                  onChange={e => setIdentifierAmount(toEnDigits(e.target.value).replace(/\D/g, ""))}
                  placeholder="حداقل ۱۰۰,۰۰۰ تومان"
                  className="w-full bg-transparent text-center text-lg font-black text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal placeholder:text-sm outline-none"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {QUICK_AMOUNTS.map(q => (
                  <button
                    key={q}
                    onClick={() => setIdentifierAmount(String(q))}
                    className={`py-2 rounded-lg border text-[11px] font-bold transition ${
                      identifierAmountNum === q
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)]/50"
                    }`}
                  >
                    + {format(q)}
                  </button>
                ))}
              </div>
            </div>

            {/* هشدار مهم */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
              <div className="text-[10.5px] font-bold text-amber-400 mb-1.5">⚠️ نکته مهم</div>
              <ul className="text-[10px] text-[var(--muted)] space-y-1 leading-relaxed list-disc list-inside">
                <li>در فیلد «شرح تراکنش» یا «بابت»، <b className="text-[var(--text)]">حتماً شناسه {formattedId} را بنویسید</b></li>
                <li>واریز بدون شناسه، شناسایی نمی‌شود و پول برنمی‌گردد</li>
                <li>بلافاصله بعد از واریز، پول در حساب شما شارژ می‌شود (معمولاً کمتر از ۳۰ ثانیه)</li>
              </ul>
            </div>

            <button
              onClick={handleIdentifierConfirm}
              disabled={!identifierValid}
              className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20"
            >
              واریز کردم، بررسی شود
            </button>
          </div>
        )}

        {/* ============= حالت انتظار تایید بانک ============= */}
        {tab === "identifier" && identifierStep === "verified" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-amber-500 opacity-30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" style={{ borderWidth: "3px" }} />
              </div>
            </div>
            <h2 className="text-base font-bold mb-2">در حال بررسی واریز</h2>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-5">
              سیستم در حال تطبیق تراکنش بانکی با شناسه شماست. این فرآیند معمولاً کمتر از ۳۰ ثانیه طول می‌کشد.
            </p>

            <div className="bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-3 mb-5 text-right space-y-1.5">
              <div className="flex justify-between text-[10.5px]">
                <span className="text-[var(--muted)]">شناسه واریز</span>
                <span className="font-mono font-bold text-[var(--gold)]" dir="ltr">{formattedId}</span>
              </div>
              <div className="flex justify-between text-[10.5px]">
                <span className="text-[var(--muted)]">مبلغ اعلامی</span>
                <span className="font-bold text-[var(--text)]">{format(identifierAmountNum)} تومان</span>
              </div>
              <div className="flex justify-between text-[10.5px] pt-1.5 border-t border-[var(--border)]">
                <span className="text-[var(--muted)]">وضعیت</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">در انتظار بانک</span>
              </div>
            </div>

            <div className="text-[9.5px] text-[var(--muted)] mb-4 leading-relaxed">
              💡 در نسخه نمایشی، این فرآیند شبیه‌سازی شده است
            </div>

            {/* دکمه شبیه‌سازی — برای دمو */}
            <button
              onClick={() => router.push("/wallet")}
              className="w-full h-10 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition mb-2"
            >
              ✓ شبیه‌سازی تایید بانک (دمو)
            </button>
            <button
              onClick={() => { setIdentifierStep("waiting"); setIdentifierAmount(""); }}
              className="w-full h-10 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] font-bold text-xs hover:bg-[var(--panel)] transition"
            >
              انصراف و بازگشت
            </button>
          </div>
        )}

        {/* ============= تب درگاه بانکی ============= */}
        {tab === "gateway" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl mb-2">⚡</div>
              <div className="text-xs font-bold mb-0.5">واریز آنی با درگاه</div>
              <div className="text-[10px] text-[var(--muted)]">مبلغ بلافاصله به کیف پول شما اضافه می‌شود</div>
            </div>

            <label className="text-[10px] text-[var(--muted)] block mb-1.5">مبلغ (تومان)</label>
            <div className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-3 transition-all ${amount && !amountValid ? "border-red-500/50" : amountValid ? "border-emerald-500/50" : "border-[var(--border)] focus-within:border-[var(--gold)]"}`}>
              <input
                type="text"
                inputMode="numeric"
                value={amount ? Number(amount).toLocaleString("en-US") : ""}
                onChange={e => setAmount(toEnDigits(e.target.value).replace(/\D/g, ""))}
                placeholder="حداقل ۱۰۰,۰۰۰ تومان"
                className="w-full bg-transparent text-center text-lg font-black text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal placeholder:text-sm outline-none"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {QUICK_AMOUNTS.map(q => (
                <button key={q} onClick={() => setAmount(String(q))} className={`py-2 rounded-lg border text-[11px] font-bold transition ${amountNum === q ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)]/50"}`}>
                  + {format(q)} تومان
                </button>
              ))}
            </div>

            <button onClick={handleGateway} disabled={!amountValid} className="w-full h-11 mt-4 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20">
              پرداخت از طریق درگاه
            </button>
          </div>
        )}

        {/* ============= تب واریز دستی (فیش) ============= */}
        {tab === "manual" && manualStep === "form" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] flex items-center justify-center text-[10px] font-bold">۱</div>
                <div className="text-xs font-bold">اطلاعات فیش واریزی</div>
              </div>

              <label className="text-[10px] text-[var(--muted)] block mb-1.5">مبلغ واریزی (تومان)</label>
              <div className={`rounded-lg border-2 bg-[var(--bg)] px-3 py-2.5 mb-3 ${manualAmount && manualAmountNum < MIN_DEPOSIT ? "border-red-500/50" : "border-[var(--border)] focus-within:border-[var(--gold)]"}`}>
                <input type="text" inputMode="numeric" value={manualAmount ? Number(manualAmount).toLocaleString("en-US") : ""} onChange={e => setManualAmount(toEnDigits(e.target.value).replace(/\D/g, ""))} placeholder="مبلغ دقیق واریز شده" className="w-full bg-transparent text-center text-sm font-bold text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal outline-none" dir="ltr" />
              </div>

              <label className="text-[10px] text-[var(--muted)] block mb-1.5">شماره پیگیری تراکنش</label>
              <div className="rounded-lg border-2 bg-[var(--bg)] px-3 py-2.5 mb-3 border-[var(--border)] focus-within:border-[var(--gold)]">
                <input type="text" inputMode="numeric" value={trackingNumber} onChange={e => setTrackingNumber(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 20))} placeholder="حداقل ۸ رقم" className="w-full bg-transparent text-center text-sm font-bold text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal outline-none font-mono" dir="ltr" />
              </div>

              <label className="text-[10px] text-[var(--muted)] block mb-1.5">تصویر فیش واریزی</label>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)]/50 bg-[var(--bg)] flex flex-col items-center justify-center gap-1.5 transition overflow-hidden">
                {receiptImage ? (
                  <img src={receiptImage} alt="فیش واریزی" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <div className="text-[10px] text-[var(--muted)]">برای آپلود تصویر کلیک کنید</div>
                    <div className="text-[9px] text-[var(--muted)] opacity-60">حداکثر ۵ مگابایت</div>
                  </>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickReceipt} />
            </div>

            <button onClick={handleManualSubmit} disabled={!manualValid} className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20">
              ارسال برای بررسی
            </button>
          </div>
        )}

        {/* ============= موفقیت واریز دستی ============= */}
        {tab === "manual" && manualStep === "success" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-emerald-500 opacity-30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            </div>
            <h2 className="text-base font-bold mb-2">فیش شما دریافت شد</h2>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-5">
              درخواست واریز شما برای بررسی به واحد حسابداری ارسال شد. حداکثر تا ۲ ساعت کاری نتیجه از طریق پیامک اطلاع داده می‌شود.
            </p>
            <button onClick={() => router.push("/wallet")} className="w-full h-10 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 transition">
              بازگشت به کیف پول
            </button>
          </div>
        )}
      </div>

      {/* مودال درگاه */}
      {gatewayOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl p-6">
            {gatewayStatus === "loading" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin" />
                </div>
                <div className="text-sm font-bold mb-1.5">در حال انتقال به درگاه</div>
              </div>
            )}
            {gatewayStatus === "success" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="text-sm font-bold mb-1.5">پرداخت موفق</div>
                <div className="text-lg font-black text-[var(--gold)] mb-4">{format(amountNum)} <span className="text-[10px] font-normal">تومان</span></div>
                <button onClick={() => { setGatewayOpen(false); router.push("/wallet"); }} className="w-full h-10 rounded-xl bg-[var(--gold)] text-black font-bold text-xs">بازگشت به کیف پول</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}