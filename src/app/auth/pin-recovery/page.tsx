"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toFa, toEnDigits } from "@/lib/format";
import { COMPANY_INFO } from "@/lib/company-info";

type Screen = "choose" | "ticket" | "success" | "track";

type Ticket = {
  code: string;
  nationalId: string;
  phone: string;
  email: string;
  reason: string;
  preferredTime: string;
  createdAt: number;
  status: "pending";
};

const TIME_OPTIONS = [
  { id: "morning", label: "صبح", sub: "۸ - ۱۲" },
  { id: "noon", label: "ظهر", sub: "۱۲ - ۱۶" },
  { id: "evening", label: "عصر", sub: "۱۶ - ۲۰" },
  { id: "night", label: "شب", sub: "۲۰ - ۲۳" },
];

const TIME_LABELS: Record<string, string> = {
  morning: "صبح (۸ - ۱۲)",
  noon: "ظهر (۱۲ - ۱۶)",
  evening: "عصر (۱۶ - ۲۰)",
  night: "شب (۲۰ - ۲۳)",
};

function generateTicketCode(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `RCV-${year}-${num}`;
}

function saveTicket(t: Ticket) {
  try {
    const list = JSON.parse(localStorage.getItem("kif-recovery-tickets") || "[]");
    list.push(t);
    localStorage.setItem("kif-recovery-tickets", JSON.stringify(list));
  } catch {}
}

function loadTickets(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem("kif-recovery-tickets") || "[]");
  } catch {
    return [];
  }
}

export default function PinRecoveryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [screen, setScreen] = useState<Screen>("choose");
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);

  // فرم تیکت
  const [nationalId, setNationalId] = useState(user?.nationalId || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [preferredTime, setPreferredTime] = useState("morning");
  const [submitting, setSubmitting] = useState(false);

  // پیگیری
  const [trackCode, setTrackCode] = useState("");
  const [trackResult, setTrackResult] = useState<Ticket | null | "not-found">(null);
  const [tracking, setTracking] = useState(false);

  const reasonValid = reason.trim().length >= 20;
  const nationalIdValid = /^\d{10}$/.test(nationalId);
  const phoneValid = phone.replace(/\D/g, "").length >= 10;
  const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = nationalIdValid && phoneValid && reasonValid && emailValid;

  function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);

    setTimeout(() => {
      const ticket: Ticket = {
        code: generateTicketCode(),
        nationalId,
        phone,
        email: email.trim(),
        reason: reason.trim(),
        preferredTime,
        createdAt: Date.now(),
        status: "pending",
      };
      saveTicket(ticket);
      setCreatedTicket(ticket);
      setScreen("success");
      setSubmitting(false);
    }, 800);
  }

  function handleTrack() {
    if (!trackCode.trim()) return;
    setTracking(true);
    setTimeout(() => {
      const found = loadTickets().find(
        (t) => t.code.toUpperCase() === trackCode.trim().toUpperCase()
      );
      setTrackResult(found || "not-found");
      setTracking(false);
    }, 600);
  }

  async function copyCode(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function goBack() {
    if (screen === "choose") {
      router.push("/auth/pin");
    } else {
      setScreen("choose");
      setTrackResult(null);
      setTrackCode("");
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-6" dir="rtl">
      <div className="w-full max-w-md mx-auto">
        {/* هدر */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={goBack}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition"
            aria-label="بازگشت"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-base">بازیابی کد امن</h1>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">از طریق پشتیبانی</p>
          </div>
        </div>

        {/* ============ انتخاب روش ============ */}
        {screen === "choose" && (
          <>
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xl shrink-0">
                  🔒
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-amber-400">بازیابی فقط با تایید پشتیبانی</div>
                  <div className="text-[10px] text-[var(--muted)] leading-relaxed mt-1">
                    برای حفاظت از طلای شما، بازیابی کد امن تنها با تایید هویت توسط تیم پشتیبانی انجام می‌شه.
                  </div>
                </div>
              </div>
            </div>

            {/* گزینه ۱ — تماس فوری */}
            <a
              href={`tel:${COMPANY_INFO.phone.replace(/\D/g, "")}`}
              className="block rounded-2xl border border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-4 mb-2 hover:border-[var(--gold)] transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-xl shrink-0">
                  📞
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-[var(--gold)]">تماس فوری با پشتیبانی</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">۲۴ ساعته، ۷ روز هفته</div>
                  <div className="text-[11px] font-bold text-[var(--text)] mt-1 font-mono" dir="ltr">
                    {COMPANY_INFO.phone}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>

            {/* گزینه ۲ — تیکت */}
            <button
              onClick={() => setScreen("ticket")}
              className="w-full text-right rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-2 hover:border-[var(--gold)]/40 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xl shrink-0">
                  📝
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-[var(--text)]">ثبت تیکت آنلاین</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">پاسخ تا ۲۴ ساعت آینده</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>

            {/* گزینه ۳ — پیگیری */}
            <button
              onClick={() => setScreen("track")}
              className="w-full text-right rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3 hover:border-[var(--gold)]/40 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                  🔍
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-[var(--text)]">پیگیری درخواست قبلی</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">با کد رهگیری</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>

            <div className="rounded-xl bg-[var(--panel-2)] border border-[var(--border)] p-3">
              <div className="text-[10px] text-[var(--muted)] leading-relaxed">
                ⚠️ <span className="text-[var(--text)] font-bold">اگر گوشی شما گم شده:</span> لطفاً سریعاً با پشتیبانی تماس بگیرید تا حساب شما موقتاً قفل شود.
              </div>
            </div>
          </>
        )}

        {/* ============ فرم تیکت ============ */}
        {screen === "ticket" && (
          <>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-sky-500/10 border-2 border-sky-500/40 flex items-center justify-center text-2xl mb-2">
                  📝
                </div>
                <h2 className="text-sm font-bold mb-1">ثبت درخواست بازیابی</h2>
                <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                  اطلاعات زیر را با دقت پر کنید. پشتیبانی با این اطلاعات با شما تماس می‌گیرد.
                </p>
              </div>

              {/* کد ملی */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[var(--text)]">
                    کد ملی <span className="text-red-400">*</span>
                  </label>
                  <span className={`text-[9px] ${nationalIdValid ? "text-emerald-400" : "text-[var(--muted)]"}`}>
                    {toFa(String(nationalId.length))}/۱۰
                  </span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={nationalId}
                  onChange={(e) => setNationalId(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 10))}
                  placeholder="۱۰ رقم"
                  dir="ltr"
                  className={`w-full h-10 rounded-lg bg-[var(--bg)] border px-3 text-[11px] font-bold text-center outline-none transition ${
                    nationalId.length === 10
                      ? "border-emerald-500/50"
                      : nationalId.length > 0
                      ? "border-amber-500/50"
                      : "border-[var(--border)] focus:border-[var(--gold)]"
                  }`}
                />
              </div>

              {/* شماره موبایل */}
              <div className="mb-3">
                <label className="text-[10px] text-[var(--text)] block mb-1">
                  شماره موبایل ثبت‌شده <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 11))}
                  placeholder="09xxxxxxxxx"
                  dir="ltr"
                  className="w-full h-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 text-[11px] font-bold text-center outline-none focus:border-[var(--gold)] transition"
                />
                <div className="text-[9px] text-[var(--muted)] mt-1">
                  پشتیبانی با همین شماره تماس می‌گیرد.
                </div>
              </div>

              {/* ایمیل */}
              <div className="mb-3">
                <label className="text-[10px] text-[var(--text)] block mb-1">
                  ایمیل (اختیاری)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className={`w-full h-10 rounded-lg bg-[var(--bg)] border px-3 text-[11px] text-center outline-none transition ${
                    email && !emailValid
                      ? "border-red-500/50"
                      : "border-[var(--border)] focus:border-[var(--gold)]"
                  }`}
                />
                <div className="text-[9px] text-[var(--muted)] mt-1">
                  نتیجه درخواست به این ایمیل هم ارسال می‌شود.
                </div>
              </div>

              {/* زمان تماس */}
              <div className="mb-3">
                <label className="text-[10px] text-[var(--text)] block mb-1.5">
                  زمان مناسب تماس
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreferredTime(t.id)}
                      className={`rounded-lg p-2 transition border ${
                        preferredTime === t.id
                          ? "border-[var(--gold)] bg-[var(--gold)]/10"
                          : "border-[var(--border)] hover:border-[var(--gold)]/40"
                      }`}
                    >
                      <div className={`text-[10px] font-bold ${preferredTime === t.id ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>
                        {t.label}
                      </div>
                      <div className="text-[8.5px] text-[var(--muted)] mt-0.5">{t.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* توضیحات */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[var(--text)]">
                    توضیحات <span className="text-red-400">*</span>
                  </label>
                  <span className={`text-[9px] ${reasonValid ? "text-emerald-400" : "text-amber-400"}`}>
                    {toFa(String(reason.trim().length))}/۲۰
                  </span>
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 150))}
                  rows={3}
                  placeholder="مثلاً: کد امن را فراموش کرده‌ام و گوشی فعلی‌ام در دسترس است."
                  className={`w-full rounded-lg bg-[var(--bg)] border px-3 py-2 text-[10.5px] text-[var(--text)] placeholder:text-[var(--muted)] outline-none resize-none transition ${
                    reason.trim().length > 0 && !reasonValid
                      ? "border-amber-500/50"
                      : reasonValid
                      ? "border-emerald-500/50"
                      : "border-[var(--border)] focus:border-[var(--gold)]"
                  }`}
                />
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 mb-3">
                <div className="text-[9.5px] text-amber-400 leading-relaxed">
                  ⚠️ پشتیبانی ممکن است برای احراز هویت، مدارکی مانند کارت ملی یا سلفی درخواست کند.
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="w-full h-11 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  "ثبت درخواست"
                )}
              </button>
            </div>
          </>
        )}

        {/* ============ موفقیت ============ */}
        {screen === "success" && createdTicket && (
          <>
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 mb-3 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-sm font-bold mb-1">درخواست شما ثبت شد</h2>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                پشتیبانی تا ۲۴ ساعت آینده با شما تماس می‌گیرد.
              </p>
            </div>

            {/* کد رهگیری */}
            <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-[var(--bg)]/60 p-4 mb-3">
              <div className="text-[9px] text-[var(--muted)] text-center mb-1">کد رهگیری درخواست</div>
              <div className="text-xl font-black text-[var(--gold)] font-mono tracking-widest text-center mb-3" dir="ltr">
                {createdTicket.code}
              </div>
              <button
                onClick={() => copyCode(createdTicket.code)}
                className={`w-full h-9 rounded-lg text-[11px] font-bold transition ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 border border-[var(--gold)]/30"
                }`}
              >
                {copied ? "✓ کپی شد" : "کپی کد رهگیری"}
              </button>
            </div>

            {/* خلاصه */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3 space-y-2 text-[10.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">شماره تماس</span>
                <span className="font-bold font-mono" dir="ltr">{createdTicket.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">زمان مناسب تماس</span>
                <span className="font-bold">{TIME_LABELS[createdTicket.preferredTime]}</span>
              </div>
              {createdTicket.email && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">ایمیل</span>
                  <span className="font-bold text-[10px] truncate" dir="ltr">{createdTicket.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">وضعیت</span>
                <span className="font-bold text-amber-400">در انتظار بررسی</span>
              </div>
            </div>

            {/* مراحل بعدی */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <div className="text-[11px] font-bold mb-2.5">📋 مراحل بعدی</div>
              <div className="space-y-2">
                {[
                  "پشتیبانی با شما تماس می‌گیرد",
                  "هویت شما تایید می‌شود (ممکن است مدارک درخواست شود)",
                  "کد امن موقت به شماره شما ارسال می‌شود",
                  "با کد موقت وارد شوید و کد جدید تنظیم کنید",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-[9px] font-bold text-[var(--gold)]">
                      {toFa(String(i + 1))}
                    </span>
                    <span className="text-[10px] text-[var(--text)]/85 leading-relaxed flex-1 pt-0.5">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* هشدار */}
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 mb-3">
              <div className="text-[10px] text-red-400 leading-relaxed">
                🔒 <span className="font-bold">تا ۲۴ ساعت بعد از بازیابی:</span> امکان برداشت فیزیکی و انتقال طلا محدود خواهد بود. این کار برای حفاظت از حساب شماست.
              </div>
            </div>

            <button
              onClick={() => router.push("/auth/pin")}
              className="w-full h-11 rounded-xl bg-[var(--gold)] text-black font-bold text-xs hover:bg-[var(--gold)]/90 transition"
            >
              بازگشت به صفحه ورود
            </button>
          </>
        )}

        {/* ============ پیگیری ============ */}
        {screen === "track" && (
          <>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3">
              <div className="text-center mb-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-2xl mb-2">
                  🔍
                </div>
                <h2 className="text-sm font-bold mb-1">پیگیری درخواست</h2>
                <p className="text-[10px] text-[var(--muted)]">کد رهگیری را وارد کنید</p>
              </div>

              <label className="text-[10px] text-[var(--text)] block mb-1.5">کد رهگیری</label>
              <input
                type="text"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                placeholder="RCV-2025-0000"
                dir="ltr"
                className="w-full h-11 rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 text-[12px] font-mono font-bold text-center outline-none focus:border-[var(--gold)] transition mb-3"
              />
              <button
                onClick={handleTrack}
                disabled={!trackCode.trim() || tracking}
                className="w-full h-10 rounded-lg bg-[var(--gold)] text-black font-bold text-[11px] hover:bg-[var(--gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {tracking ? (
                  <>
                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    در حال جستجو...
                  </>
                ) : (
                  "پیگیری"
                )}
              </button>
            </div>

            {/* نتیجه — پیدا شد */}
            {trackResult && trackResult !== "not-found" && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-base">⏳</span>
                  <div>
                    <div className="text-[11px] font-bold">در انتظار بررسی</div>
                    <div className="text-[9.5px] text-[var(--muted)]">پشتیبانی به‌زودی با شما تماس می‌گیرد</div>
                  </div>
                </div>
                <div className="space-y-2 text-[10.5px] pt-3 border-t border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">کد رهگیری</span>
                    <span className="font-mono font-bold" dir="ltr">{trackResult.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">شماره تماس</span>
                    <span className="font-mono" dir="ltr">{trackResult.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">زمان مناسب</span>
                    <span className="font-bold">{TIME_LABELS[trackResult.preferredTime]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">ثبت شده</span>
                    <span className="font-bold">
                      {toFa(new Date(trackResult.createdAt).toLocaleDateString("fa-IR"))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* نتیجه — پیدا نشد */}
            {trackResult === "not-found" && (
              <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent p-4 text-center">
                <div className="text-3xl mb-2">❌</div>
                <div className="text-[11px] font-bold text-red-400 mb-1">درخواستی با این کد پیدا نشد</div>
                <div className="text-[10px] text-[var(--muted)] leading-relaxed">
                  لطفاً کد رهگیری را دوباره بررسی کنید یا با پشتیبانی تماس بگیرید.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}