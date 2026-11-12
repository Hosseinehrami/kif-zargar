"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const GOLD_PRICE = 19_080_000;
const MIN_TRANSFER = 0.01;
const MIN_NOTE_LENGTH = 10;
const FEE_RATE = 0.001;
const GOLD_BALANCE = 12.45;

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const toFa = (s: string) =>
  s.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/\./g, "٫");

const MOCK_USERS: Record<string, { name: string; phone: string; avatar: string }> = {
  "09121234567": { name: "علی رضایی", phone: "09121234567", avatar: "ع" },
  "09123456789": { name: "مریم احمدی", phone: "09123456789", avatar: "م" },
  "09134567890": { name: "رضا کریمی", phone: "09134567890", avatar: "ر" },
  "09141112233": { name: "سارا محمدی", phone: "09141112233", avatar: "س" },
};

const RECEIPT_SECRET = "KFZ_2025_SECRET";

function generateReceiptHash(data: Record<string, unknown>): string {
  const payload = JSON.stringify(data) + RECEIPT_SECRET;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  let hash2 = hash;
  for (let i = 0; i < payload.length; i++) {
    hash2 ^= payload.charCodeAt(i) ^ 0xa5;
    hash2 = Math.imul(hash2, 0x01000193) >>> 0;
  }
  return (hash.toString(16).padStart(8, "0") + hash2.toString(16).padStart(8, "0")).toUpperCase();
}

function generateVerificationCode(hash: string): string {
  return `KFZ-${hash.slice(0, 4)}-${hash.slice(8, 12)}`;
}

function generateQRPattern(seed: string, size = 21): boolean[][] {
  const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (ox + x < size && oy + y < size) grid[oy + y][ox + x] = isBorder || isCenter;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) continue;
      if (x < 8 && y < 8) continue;
      if (x >= size - 8 && y < 8) continue;
      if (x < 8 && y >= size - 8) continue;
      s = (s * 1103515245 + 12345) >>> 0;
      grid[y][x] = (s & 1) === 1;
    }
  }
  return grid;
}

type Step = "form" | "otp" | "success";

export default function TransferPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("form");
  const [recipient, setRecipient] = useState("");
  const [recipientData, setRecipientData] = useState<{ name: string; phone: string; avatar: string } | null>(null);
  const [recipientError, setRecipientError] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpShake, setOtpShake] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const [transaction, setTransaction] = useState<{
    trackingCode: string;
    dateTime: string;
    recipientName: string;
    recipientPhone: string;
    amount: number;
    fee: number;
    note: string;
    receiptHash: string;
    verificationCode: string;
  } | null>(null);

  const amountNum = Number(amount) || 0;
  const fee = amountNum * FEE_RATE;
  const totalFromSender = amountNum + fee;
  const noteLength = note.trim().length;

  const enoughBalance = totalFromSender <= GOLD_BALANCE;
  const noteValid = noteLength >= MIN_NOTE_LENGTH;
  const isValid = !!recipientData && amountNum >= MIN_TRANSFER && enoughBalance && noteValid;

  useEffect(() => {
    setRecipientError("");
    setRecipientData(null);
    if (!recipient) return;
    if (/^09\d{9}$/.test(recipient)) {
      if (recipient === user?.phone) {
        setRecipientError("نمی‌توانید به خودتان انتقال دهید");
        return;
      }
      const found = MOCK_USERS[recipient];
      if (found) setRecipientData(found);
      else setRecipientError("کاربری با این شماره یافت نشد");
    }
  }, [recipient, user?.phone]);

  function handleRecipientChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRecipient(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 11));
  }

  function proceedToOtp() {
    if (!isValid) return;
    setStep("otp");
    setOtpDigits(["", "", "", ""]);
    setOtpError("");
  }

  async function handleConfirm() {
    const otp = otpDigits.join("");
    if (otp.length !== 4) {
      setOtpError("کد ۴ رقمی را کامل وارد کنید");
      return;
    }

    setOtpVerifying(true);
    setOtpError("");
    await new Promise(r => setTimeout(r, 600));

    if (otp === "1234") {
      const now = new Date();
      const dateTime = `${toFa(String(now.getHours()).padStart(2, "0"))}:${toFa(
        String(now.getMinutes()).padStart(2, "0")
      )} · ${toFa(String(now.getFullYear()))}/${toFa(String(now.getMonth() + 1))}/${toFa(String(now.getDate()))}`;

      const trackingCode = "TRX-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const txData = {
        trackingCode,
        recipientPhone: recipientData!.phone,
        amount: amountNum,
        fee,
        timestamp: now.getTime(),
      };
      const receiptHash = generateReceiptHash(txData);
      const verificationCode = generateVerificationCode(receiptHash);

      setTransaction({
        trackingCode,
        dateTime,
        recipientName: recipientData!.name,
        recipientPhone: recipientData!.phone,
        amount: amountNum,
        fee,
        note: note.trim(),
        receiptHash,
        verificationCode,
      });
      setStep("success");
    } else {
      setOtpError("کد تایید اشتباه است");
      setOtpShake(true);
      await new Promise(r => setTimeout(r, 450));
      setOtpDigits(["", "", "", ""]);
      setOtpShake(false);
      setOtpVerifying(false);
    }
  }

  function handleOtpDigit(idx: number, val: string) {
    const en = toEnDigits(val).replace(/\D/g, "");
    if (!en) {
      const next = [...otpDigits];
      next[idx] = "";
      setOtpDigits(next);
      return;
    }
    const next = [...otpDigits];
    next[idx] = en[0];
    setOtpDigits(next);
    if (idx < 3) {
      const ref = document.getElementById(`otp-${idx + 1}`) as HTMLInputElement;
      ref?.focus();
    }
  }

  function handleOtpBackspace(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      const ref = document.getElementById(`otp-${idx - 1}`) as HTMLInputElement;
      ref?.focus();
    }
  }

  async function shareReceipt() {
    if (!transaction) return;
    const text = `🧾 رسید رسمی انتقال طلا — کیف زرگر
━━━━━━━━━━━━━━━━━━
گیرنده: ${transaction.recipientName}
شماره: ${transaction.recipientPhone}
مقدار: ${toFa(transaction.amount.toFixed(4))} گرم
کارمزد: ${toFa(transaction.fee.toFixed(4))} گرم
تاریخ: ${transaction.dateTime}
کد پیگیری: ${transaction.trackingCode}
${transaction.note ? `توضیحات: ${transaction.note}\n` : ""}
━━━━━━━━━━━━━━━━━━
🔍 کد استعلام: ${transaction.verificationCode}
🌐 استعلام آنلاین: kifzargar.com/verify/${transaction.trackingCode}
🔐 امضای دیجیتال: ${transaction.receiptHash.slice(0, 16)}…

⚠️ صحت این رسید را می‌توانید با مراجعه به لینک استعلام بررسی کنید.`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "رسید انتقال طلا", text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <div className="px-2.5 sm:px-4 pt-3 pb-8">
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
            <h1 className="font-bold text-base sm:text-lg">انتقال طلا</h1>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">ارسال طلا به کاربران دیگر</p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[var(--muted)] mb-0.5">موجودی طلای شما</div>
              <div className="text-lg font-black text-[var(--gold)]">
                {toFa(GOLD_BALANCE.toFixed(3))}
                <span className="text-[10px] font-normal text-[var(--muted)] mr-1">گرم</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-[9.5px] text-[var(--muted)]">معادل</div>
              <div className="text-[11px] font-bold text-[var(--text)]">{format(GOLD_BALANCE * GOLD_PRICE)}</div>
              <div className="text-[9px] text-[var(--muted)]">تومان</div>
            </div>
          </div>
        </div>

        {step === "form" && (
          <>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3">
              <label className="text-[10px] text-[var(--muted)] block mb-1.5">شماره موبایل گیرنده</label>
              <div
                className={`flex items-center gap-2 rounded-xl border-2 bg-[var(--bg)] px-3 py-2.5 transition-all ${
                  recipientError
                    ? "border-red-500/50"
                    : recipientData
                    ? "border-emerald-500/50"
                    : "border-[var(--border)] focus-within:border-[var(--gold)]"
                }`}
              >
                <span className="text-[10px] text-[var(--muted)] shrink-0 font-mono">+98</span>
                <div className="w-px h-3.5 bg-[var(--border)]" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={recipient}
                  onChange={handleRecipientChange}
                  placeholder="9121234567"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm font-bold tracking-wider text-left text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal"
                  dir="ltr"
                  autoFocus
                />
                {recipientData && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {recipientError && <p className="text-[10px] text-red-400 mt-1.5">{recipientError}</p>}
              {!recipient && <p className="text-[9.5px] text-[var(--muted)] mt-1.5">مثال: 09121234567</p>}

              {recipientData && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2.5 fade-in">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-base font-bold text-emerald-400 shrink-0">
                    {recipientData.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-[var(--text)]">{recipientData.name}</div>
                    <div className="text-[9.5px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">{recipientData.phone}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-[var(--muted)]">مقدار انتقال (گرم)</label>
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.max(0, GOLD_BALANCE / (1 + FEE_RATE) - 0.0001)))}
                  className="text-[10px] font-bold text-[var(--gold)] hover:underline"
                >
                  همه
                </button>
              </div>
              <div
                className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-3 transition-all ${
                  amount && !enoughBalance
                    ? "border-red-500/50"
                    : amount && amountNum >= MIN_TRANSFER
                    ? "border-emerald-500/50"
                    : "border-[var(--border)] focus-within:border-[var(--gold)]"
                }`}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => setAmount(toEnDigits(e.target.value).replace(/[^\d.]/g, ""))}
                  placeholder="۰.۰۰۰"
                  className="w-full bg-transparent text-center text-lg font-black text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal placeholder:text-sm outline-none"
                  dir="ltr"
                />
              </div>
              {amount && amountNum > 0 && (
                <div className="text-[10px] text-center text-[var(--muted)] mt-1.5">
                  معادل {format(amountNum * GOLD_PRICE)} تومان
                </div>
              )}
              {amountNum > 0 && amountNum < MIN_TRANSFER && (
                <p className="text-[10px] text-red-400 mt-1.5 text-center">
                  حداقل مقدار انتقال {toFa(String(MIN_TRANSFER))} گرم است
                </p>
              )}
              {!enoughBalance && (
                <p className="text-[10px] text-red-400 mt-1.5 text-center">موجودی کافی نیست (شامل کارمزد)</p>
              )}

              {amountNum > 0 && amountNum >= MIN_TRANSFER && enoughBalance && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1.5 text-[11px] fade-in">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">گیرنده دریافت می‌کند</span>
                    <span className="font-bold text-emerald-400">{toFa(amountNum.toFixed(4))} گرم</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">کارمزد (۰.۱٪)</span>
                    <span className="text-red-400">+{toFa(fee.toFixed(4))} گرم</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-[var(--border)]">
                    <span className="text-[var(--text)] font-bold">کل کسر از حساب شما</span>
                    <span className="font-bold text-[var(--gold)]">{toFa(totalFromSender.toFixed(4))} گرم</span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-[var(--muted)]">
                  توضیحات <span className="text-red-400">*</span>
                </label>
                <span className={`text-[10px] font-bold ${noteValid ? "text-emerald-400" : "text-amber-400"}`}>
                  {toFa(String(noteLength))}/{toFa(String(MIN_NOTE_LENGTH))}
                </span>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 100))}
                placeholder="بابت چه چیزی پرداخت می‌کنید؟ (حداقل ۱۰ کاراکتر)"
                rows={2}
                className={`w-full bg-[var(--bg)] border rounded-lg px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)] outline-none resize-none transition ${
                  noteLength > 0 && !noteValid
                    ? "border-amber-500/50"
                    : noteValid
                    ? "border-emerald-500/50"
                    : "border-[var(--border)] focus:border-[var(--gold)]"
                }`}
              />
              {noteLength > 0 && !noteValid && (
                <p className="text-[9.5px] text-amber-400 mt-1">
                  {toFa(String(MIN_NOTE_LENGTH - noteLength))} کاراکتر دیگر وارد کنید
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={proceedToOtp}
              disabled={!isValid}
              className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20"
            >
              {isValid ? "ادامه و دریافت کد تایید" : "اطلاعات را کامل کنید"}
            </button>

            <div className="text-[9.5px] text-[var(--muted)] text-center leading-relaxed mt-3 px-4">
              انتقال طلا غیرقابل برگشت است. قبل از تایید مطمئن شوید گیرنده صحیح است.
            </div>
          </>
        )}

        {step === "otp" && recipientData && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center text-2xl mb-3">
                🔐
              </div>
              <h2 className="text-base font-bold mb-1">تایید نهایی انتقال</h2>
              <p className="text-[11px] text-[var(--muted)]">کد ۴ رقمی ارسال‌شده را وارد کنید</p>
            </div>

            <div className="bg-gradient-to-br from-[var(--gold)]/10 to-[var(--gold)]/5 border border-[var(--gold)]/30 rounded-xl p-3 mb-5">
              <div className="text-[10px] text-[var(--gold)] font-bold mb-2 flex items-center gap-1">
                <span>⚠️</span>
                لطفاً قبل از تایید، اطلاعات را بررسی کنید
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-start">
                  <span className="text-[var(--muted)]">گیرنده</span>
                  <div className="text-left">
                    <div className="font-bold text-[var(--text)]">{recipientData.name}</div>
                    <div className="text-[9.5px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">{recipientData.phone}</div>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-[var(--gold)]/20">
                  <span className="text-[var(--muted)]">مقدار انتقال</span>
                  <span className="font-bold text-emerald-400">{toFa(amountNum.toFixed(4))} گرم</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">کارمزد</span>
                  <span className="text-red-400">+{toFa(fee.toFixed(4))} گرم</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-[var(--gold)]/20">
                  <span className="text-[var(--text)] font-bold">کل کسر از حساب شما</span>
                  <span className="font-black text-[var(--gold)]">{toFa(totalFromSender.toFixed(4))} گرم</span>
                </div>

                {note.trim() && (
                  <div className="pt-2 border-t border-[var(--gold)]/20">
                    <span className="text-[var(--muted)] block mb-1">توضیحات:</span>
                    <div className="text-[10px] text-[var(--text)] bg-[var(--bg)]/40 rounded p-1.5 leading-relaxed">{note.trim()}</div>
                  </div>
                )}
              </div>
            </div>

            <label className="text-[10px] text-[var(--muted)] block mb-2 text-center">کد تایید پیامکی</label>
            <div className={`flex justify-center gap-2 mb-4 ${otpShake ? "animate-shake" : ""}`} dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpDigit(i, e.target.value)}
                  onKeyDown={e => handleOtpBackspace(i, e)}
                  disabled={otpVerifying}
                  autoFocus={i === 0}
                  className={`w-14 h-16 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all ${
                    otpError
                      ? "border-red-500 text-red-400"
                      : d
                      ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] text-[var(--text)] bg-[var(--bg)] focus:border-[var(--gold)]"
                  }`}
                />
              ))}
            </div>

            {otpError && <p className="text-[10px] text-red-400 text-center mb-3">{otpError}</p>}

            <div className="text-[9.5px] text-[var(--muted)] text-center mb-3 bg-[var(--panel-2)] rounded-lg p-2">
              🔒 دمو: کد <span className="font-mono font-bold text-[var(--gold)]">1234</span> را وارد کنید
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={otpDigits.some(d => !d) || otpVerifying}
              className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-2"
            >
              {otpVerifying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  در حال انتقال...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  تایید و انتقال طلا
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtpDigits(["", "", "", ""]);
                setOtpError("");
              }}
              disabled={otpVerifying}
              className="w-full h-10 mt-2 rounded-xl bg-transparent text-[var(--muted)] font-bold text-xs hover:text-[var(--text)] transition"
            >
              ویرایش اطلاعات
            </button>
          </div>
        )}

        {step === "success" && transaction && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 text-center">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-emerald-500 opacity-30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-base font-bold mb-1">انتقال با موفقیت انجام شد</h2>
              <p className="text-[11px] text-[var(--muted)]">طلا بلافاصله به کیف پول گیرنده منتقل شد</p>
            </div>

            <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-[var(--panel)] overflow-hidden relative">
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.03]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="font-serif italic font-black whitespace-nowrap -rotate-[25deg] text-[var(--gold)]" style={{ fontSize: 60, letterSpacing: "0.15em" }}>
                    KIFE ZARGAR
                  </div>
                </div>
              </div>

              <div className="relative bg-gradient-to-l from-[var(--gold)]/20 to-[var(--gold)]/5 border-b-2 border-[var(--gold)]/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧾</span>
                  <div>
                    <div className="text-xs font-black text-[var(--gold)]">رسید رسمی انتقال طلا</div>
                    <div className="text-[9px] text-[var(--muted)] mt-0.5">کیف زرگر · KIFE ZARGAR</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 justify-end">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-[8.5px] text-emerald-400 font-bold">امضای دیجیتال معتبر</span>
                  </div>
                  <div className="text-[8px] text-[var(--muted)] mt-0.5 font-mono">{transaction.trackingCode}</div>
                </div>
              </div>

              <div className="relative p-4 text-center border-b border-[var(--border)] bg-[var(--gold)]/5">
                <div className="text-[10px] text-[var(--muted)] mb-1">مقدار منتقل شده</div>
                <div className="text-3xl font-black text-[var(--gold)]">
                  {toFa(transaction.amount.toFixed(4))}
                  <span className="text-sm font-normal text-[var(--muted)] mr-1">گرم</span>
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-1">
                  معادل {format(transaction.amount * GOLD_PRICE)} تومان
                </div>
              </div>

              <div className="relative p-3 space-y-2 text-[11px]">
                <div className="flex justify-between items-start">
                  <span className="text-[var(--muted)]">گیرنده</span>
                  <div className="text-left">
                    <div className="font-bold text-[var(--text)]">{transaction.recipientName}</div>
                    <div className="text-[9.5px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">{transaction.recipientPhone}</div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">کارمزد</span>
                  <span className="text-red-400">{toFa(transaction.fee.toFixed(4))} گرم</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--muted)]">تاریخ و ساعت</span>
                  <span className="font-mono text-[10.5px] text-[var(--text)]">{transaction.dateTime}</span>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--muted)] block mb-1">توضیحات:</span>
                  <div className="bg-[var(--panel-2)] rounded-lg p-2 text-[10.5px] text-[var(--text)] leading-relaxed">
                    {transaction.note}
                  </div>
                </div>
              </div>

              <div className="relative p-3 bg-[var(--panel-2)] border-t-2 border-[var(--gold)]/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">🔍</span>
                  <span className="text-[10px] font-bold text-[var(--gold)]">این رسید قابل استعلام است</span>
                </div>

                <div className="flex gap-3">
                  <div className="shrink-0">
                    <div className="bg-white p-1.5 rounded-lg inline-block">
                      <svg width="80" height="80" viewBox="0 0 21 21" shapeRendering="crispEdges">
                        {generateQRPattern(transaction.receiptHash).map((row, y) =>
                          row.map((filled, x) =>
                            filled ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" /> : null
                          )
                        )}
                      </svg>
                    </div>
                    <div className="text-[8px] text-center text-[var(--muted)] mt-1">اسکن کنید</div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div>
                      <div className="text-[9px] text-[var(--muted)] mb-0.5">کد استعلام</div>
                      <div className="font-mono text-[11px] font-black text-[var(--gold)] tracking-wider bg-[var(--bg)] border border-[var(--gold)]/30 rounded px-2 py-1 text-center" dir="ltr">
                        {transaction.verificationCode}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[var(--muted)] mb-0.5">لینک استعلام</div>
                      <div className="text-[9px] font-mono text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 truncate" dir="ltr">
                        kifzargar.com/verify/{transaction.trackingCode}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] text-[var(--muted)]">امضای دیجیتال (Hash)</span>
                    <span className="text-[8px] text-[var(--muted)] font-mono" dir="ltr">
                      {transaction.receiptHash.slice(0, 16)}…
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative bg-[var(--gold)]/5 border-t border-[var(--gold)]/20 p-2.5 text-center">
                <div className="text-[9px] text-[var(--muted)] leading-relaxed">
                  ⚠️ هرگونه تغییر در این رسید، با اسکن QR یا استعلام کد، قابل تشخیص است.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={shareReceipt}
              className="w-full h-10 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)] font-bold text-xs hover:bg-[var(--gold)]/20 transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  رسید کپی شد
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  اشتراک‌گذاری رسید
                </>
              )}
            </button>

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

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-shake { animation: shake 0.4s ease; }
        .fade-in { animation: fadeIn 0.3s ease; }
      `}</style>
    </>
  );
}