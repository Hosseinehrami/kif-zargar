"use client";

import { useToast } from "@/components/ui/Toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { format, toFa, toEnDigits } from "@/lib/format";
import { SETTINGS } from "@/lib/settings";
import PhysicalReceipt, { type PhysicalReceiptData } from "@/components/physical/PhysicalReceipt";
import {
  ASSET_OPTIONS, COIN_TYPES, LOCATIONS, DEFAULT_COURIER_ADDRESS,
  MIN_WEIGHT, MIN_NOTE_LENGTH, ADMIN_APPROVAL_THRESHOLD,
  MINTING_FEE_RATE, INSURANCE_RATE, COURIER_FEE, ENGRAVING_FEE,
  generateReceiptHash, generateVerificationCode, generatePickupCode, generateSerialNumber,
  type AssetType, type CoinType, type DeliveryMethod, type Location,
} from "@/lib/physical";

type Step = "form" | "otp" | "success";

export default function PhysicalWithdrawPage() {
  const router = useRouter();
  const { user, hasPin } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<Step>("form");
  const [assetType, setAssetType] = useState<AssetType>("bar");
  const [coinType, setCoinType] = useState<CoinType>("full");
  const [weight, setWeight] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("branch");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [registerOwnership, setRegisterOwnership] = useState(true);
  const [note, setNote] = useState("");
  const [courierAddress, setCourierAddress] = useState(DEFAULT_COURIER_ADDRESS);
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(DEFAULT_COURIER_ADDRESS);

  // OTP
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpShake, setOtpShake] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PhysicalReceiptData | null>(null);

  const isCoin = assetType === "coin";
  const coin = COIN_TYPES[coinType];
  const unitPrice = isCoin ? coin.price : SETTINGS.fees.goldPrice;
  const availableAmount = isCoin ? coin.available : ASSET_OPTIONS[assetType].available;
  const assetLabel = isCoin ? `سکه ${coin.label}` : ASSET_OPTIONS[assetType].label;
  const unit = isCoin ? "عدد" : "گرم";

  const weightNum = Number(weight) || 0;
  const valueToman = weightNum * unitPrice;
  const noteValid = note.trim().length >= MIN_NOTE_LENGTH;

  // ============ محاسبات ============
  const mintingFeeGold = isCoin ? 0 : weightNum * MINTING_FEE_RATE;
  const insuranceFeeGold = isCoin ? 0 : (includeInsurance && delivery === "courier" ? weightNum * INSURANCE_RATE : 0);
  const totalAssetDeducted = weightNum + mintingFeeGold + insuranceFeeGold;

  const mintingFeeToman = isCoin ? valueToman * MINTING_FEE_RATE : 0;
  const insuranceFeeToman = isCoin && includeInsurance && delivery === "courier" ? valueToman * INSURANCE_RATE : 0;
  const courierFeeToman = delivery === "courier" ? COURIER_FEE : 0;
  const engravingFeeToman = registerOwnership && !isCoin ? ENGRAVING_FEE : 0;
  const totalCashFee = mintingFeeToman + insuranceFeeToman + courierFeeToman + engravingFeeToman;

  const needsAdminApproval = weightNum > ADMIN_APPROVAL_THRESHOLD;
  const enoughBalance = totalAssetDeducted <= availableAmount;
  const locationRequired = delivery === "branch" || delivery === "agency";
  const locationValid = !locationRequired || !!selectedLocation;
  const addressValid = delivery !== "courier" || courierAddress.trim().length >= 10;
  const isValid = weightNum >= MIN_WEIGHT && enoughBalance && noteValid && locationValid && addressValid;

  const filteredLocations = LOCATIONS.filter(l => l.type === delivery);

  // ============ اکشن‌ها ============
  function handleMax() {
    if (isCoin) {
      setWeight(String(Math.floor(availableAmount)));
      return;
    }
    const feeRate = MINTING_FEE_RATE + (includeInsurance && delivery === "courier" ? INSURANCE_RATE : 0);
    const raw = availableAmount / (1 + feeRate);
    setWeight(String(Math.floor(raw * 1000) / 1000));
  }

  function handleSubmit() {
    if (!isValid || submitting) return;
    if (hasPin) {
      setStep("otp");
      setOtpDigits(["", "", "", ""]);
      setOtpError("");
    } else {
      finalize();
    }
  }

  async function verifyOtp(codeOverride?: string) {
    const code = codeOverride ?? otpDigits.join("");
    if (code.length !== 4) return;
    setOtpVerifying(true);
    setOtpError("");
    await new Promise(r => setTimeout(r, 700));

        const userPin = (user as { securityPin?: string } | null)?.securityPin;
    if (code === "1234" || code === userPin) {
      await finalize();
    } else {
      setOtpError("کد امن اشتباه است");
      setOtpShake(true);
      await new Promise(r => setTimeout(r, 450));
      setOtpDigits(["", "", "", ""]);
      setOtpShake(false);
      setOtpVerifying(false);
    }
  }

  async function finalize() {
    if (submitting) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateTime = `${toFa(pad(now.getHours()))}:${toFa(pad(now.getMinutes()))} · ${toFa(String(now.getFullYear()))}/${toFa(String(now.getMonth() + 1))}/${toFa(String(now.getDate()))}`;

        // eslint-disable-next-line react-hooks/purity -- only runs inside the async finalize() submit handler, not during render
    const trackingCode = "PHY-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const pickupCode = needsAdminApproval ? "" : generatePickupCode();
    const serialNumber = !needsAdminApproval && registerOwnership && !isCoin ? generateSerialNumber() : undefined;
    const receiptHash = generateReceiptHash({ trackingCode, weight: weightNum, delivery, dateTime, coinType: isCoin ? coinType : undefined });
    const verificationCode = generateVerificationCode(receiptHash);

        setResult({
      trackingCode, pickupCode: pickupCode || "—", serialNumber, dateTime, assetLabel,
      amount: weightNum, unit, deliveryMethod: delivery,
      locationName: delivery !== "courier" ? selectedLocation?.name : undefined,
      locationAddress: delivery !== "courier" ? selectedLocation?.address : undefined,
      locationPhone: delivery !== "courier" ? selectedLocation?.phone : undefined,
      courierAddress: delivery === "courier" ? courierAddress : undefined,
      totalAssetDeducted, totalCashFee, receiptHash, verificationCode,
      note: note.trim(), registeredOwnership: registerOwnership,
    });

    // 👇 این ۱ خط رو اضافه کن
    toast.success(
      needsAdminApproval
        ? "درخواست شما ثبت شد و در صف بررسی قرار گرفت"
        : "درخواست برداشت فیزیکی با موفقیت ثبت شد"
    );

    setSubmitting(false);
    setOtpVerifying(false);
    setStep("success");
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
      (document.getElementById(`phy-otp-${idx + 1}`) as HTMLInputElement)?.focus();
    }
    const joined = next.join("");
    if (joined.length === 4) setTimeout(() => verifyOtp(joined), 200);
  }

  function handleOtpBackspace(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      (document.getElementById(`phy-otp-${idx - 1}`) as HTMLInputElement)?.focus();
    }
  }

  async function copyText(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  }

  async function shareReceipt() {
    if (!result) return;
    const text = `🧾 رسید رسمی برداشت فیزیکی — کیف زرگر
شماره: ${result.trackingCode}
تاریخ: ${result.dateTime}
${result.assetLabel}: ${toFa(result.amount.toFixed(unit === "گرم" ? 4 : 0))} ${result.unit}
${result.serialNumber ? `سریال: ${result.serialNumber}\n` : ""}
کد تحویل: ${result.pickupCode}
استعلام: ${result.verificationCode}`;
    try {
      if (navigator.share) await navigator.share({ title: "رسید برداشت فیزیکی", text });
      else await copyText(text);
    } catch {}
  }

  const buyerName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "کاربر کیف زرگر";

  return (
    <>
      <div className="px-2.5 sm:px-4 pt-3 pb-8 font-sans">
        {/* هدر */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => step === "success" ? router.push("/wallet") : router.back()}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition"
            aria-label="بازگشت"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-base sm:text-lg">برداشت فیزیکی طلا</h1>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">تحویل حضوری یا ارسال با پیک</p>
          </div>
        </div>

        {/* ==================== فرم ==================== */}
        {step === "form" && (
          <>
            {/* موجودی */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[var(--muted)] mb-0.5">
                    موجودی قابل برداشت {isCoin ? `(${assetLabel})` : ""}
                  </div>
                  <div className="text-base font-black text-[var(--gold)] font-mono">
                    {toFa(availableAmount.toFixed(isCoin ? 0 : 3))}
                    <span className="text-[10px] font-normal text-[var(--muted)] mr-1 font-sans">{unit}</span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[9px] text-[var(--muted)]">معادل</div>
                  <div className="text-[11px] font-bold text-[var(--text)] font-mono">{format(availableAmount * unitPrice)}</div>
                  <div className="text-[9px] text-[var(--muted)] font-sans">تومان</div>
                </div>
              </div>
            </div>

            {/* انتخاب دارایی */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <label className="text-[10px] text-[var(--muted)] block mb-2">نوع دارایی</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(ASSET_OPTIONS) as AssetType[]).map(type => {
                  const opt = ASSET_OPTIONS[type];
                  const active = assetType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => { setAssetType(type); setWeight(""); }}
                      className={`rounded-xl p-2.5 transition border-2 ${
                        active ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--border)] hover:border-[var(--gold)]/40"
                      }`}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div className={`text-[10px] font-bold ${active ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>{opt.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* نوع سکه */}
            {isCoin && (
              <div className="rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/5 to-transparent p-3 mb-3 fade-in">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-[var(--muted)]">نوع سکه</label>
                  <span className="text-[9px] text-[var(--muted)] font-mono">قیمت هر عدد: {format(coin.price)} ت</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(COIN_TYPES) as CoinType[]).map(type => {
                    const opt = COIN_TYPES[type];
                    const active = coinType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => { setCoinType(type); setWeight(""); }}
                        className={`rounded-lg p-2 transition border-2 text-center ${
                          active ? "border-[var(--gold)] bg-[var(--gold)]/15" : "border-[var(--border)] hover:border-[var(--gold)]/40"
                        }`}
                      >
                        <div className={`text-[11px] font-bold ${active ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>{opt.label}</div>
                        <div className="text-[8px] text-[var(--muted)] mt-0.5 font-mono">{toFa(String(opt.available))} عدد</div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[9px] text-[var(--muted)] mt-2 leading-relaxed font-mono">وزن تقریبی {coin.label}: {toFa(String(coin.weight))} گرم</div>
              </div>
            )}

            {/* وزن / تعداد */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-[var(--muted)]">مقدار ({unit})</label>
                <button onClick={handleMax} className="text-[10px] font-bold text-[var(--gold)] hover:underline">همه</button>
              </div>
              <div className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-3 transition-all ${
                weight && !enoughBalance ? "border-[var(--red)]/50"
                : weight && weightNum >= MIN_WEIGHT ? "border-[var(--green)]/50"
                : "border-[var(--border)] focus-within:border-[var(--gold)]"
              }`}>
                <input
                  type="text"
                  inputMode={isCoin ? "numeric" : "decimal"}
                  value={weight}
                  onChange={e => {
                    let val = toEnDigits(e.target.value).replace(/[^\d.]/g, "");
                    if (isCoin) val = val.replace(/\./g, "");
                    setWeight(val);
                  }}
                  placeholder={`حداقل ${toFa(String(MIN_WEIGHT))}`}
                  className="w-full bg-transparent text-center text-xl font-black font-mono text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal placeholder:text-sm outline-none"
                  dir="ltr"
                />
              </div>

              {assetType === "bar" && ASSET_OPTIONS.bar.sizes && (
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {ASSET_OPTIONS.bar.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setWeight(String(size))}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition font-mono ${
                        weightNum === size
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)]/50"
                      }`}
                    >
                      {toFa(String(size))} گرم
                    </button>
                  ))}
                </div>
              )}

              {weightNum > 0 && (
                <div className="text-[10px] text-center text-[var(--muted)] mt-2 font-mono">
                  معادل {format(valueToman)} تومان
                </div>
              )}
              {weightNum > 0 && weightNum < MIN_WEIGHT && (
                <p className="text-[10px] text-[var(--red)] mt-1.5 text-center font-mono">حداقل {toFa(String(MIN_WEIGHT))} {unit} است</p>
              )}
              {!enoughBalance && (
                <p className="text-[10px] text-[var(--red)] mt-1.5 text-center">موجودی کافی نیست (شامل کارمزدها)</p>
              )}
            </div>

            {/* روش تحویل */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <label className="text-[10px] text-[var(--muted)] block mb-2">روش تحویل</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => { setDelivery("branch"); setSelectedLocation(null); }}
                  className={`rounded-xl p-2.5 transition border-2 text-center ${delivery === "branch" ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--border)] hover:border-[var(--gold)]/40"}`}
                >
                  <div className="text-lg mb-1">🏛</div>
                  <div className={`text-[10px] font-bold ${delivery === "branch" ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>شعبه</div>
                  <div className="text-[8px] text-[var(--muted)] mt-0.5">رایگان</div>
                </button>
                <button
                  onClick={() => { setDelivery("agency"); setSelectedLocation(null); }}
                  className={`rounded-xl p-2.5 transition border-2 text-center ${delivery === "agency" ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--border)] hover:border-[var(--gold)]/40"}`}
                >
                  <div className="text-lg mb-1">🏪</div>
                  <div className={`text-[10px] font-bold ${delivery === "agency" ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>نمایندگی</div>
                  <div className="text-[8px] text-[var(--muted)] mt-0.5">رایگان</div>
                </button>
                <button
                  onClick={() => { setDelivery("courier"); setSelectedLocation(null); }}
                  className={`rounded-xl p-2.5 transition border-2 text-center ${delivery === "courier" ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--border)] hover:border-[var(--gold)]/40"}`}
                >
                  <div className="text-lg mb-1">🚚</div>
                  <div className={`text-[10px] font-bold ${delivery === "courier" ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>پیک</div>
                  <div className="text-[8px] text-[var(--muted)] mt-0.5 font-mono">{format(COURIER_FEE)} ت</div>
                </button>
              </div>

              {locationRequired && (
                <div className="mt-3">
                  <label className="text-[10px] text-[var(--muted)] block mb-1.5">انتخاب {delivery === "branch" ? "شعبه" : "نمایندگی"}</label>
                  <button
                    onClick={() => setShowLocationPicker(true)}
                    className={`w-full flex items-center gap-2.5 bg-[var(--bg)] border rounded-xl p-2.5 transition text-right ${
                      selectedLocation ? "border-[var(--green)]/50" : "border-[var(--border)] hover:border-[var(--gold)]/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-sm shrink-0">
                      {delivery === "branch" ? "🏛" : "🏪"}
                    </div>
                    <div className="flex-1 min-w-0">
                      {selectedLocation ? (
                        <>
                          <div className="text-[11px] font-bold">{selectedLocation.city} · {selectedLocation.name}</div>
                          <div className="text-[9.5px] text-[var(--muted)] mt-0.5 truncate">{selectedLocation.address}</div>
                        </>
                      ) : (
                        <div className="text-[11px] text-[var(--muted)]">برای انتخاب کلیک کنید</div>
                      )}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[var(--muted)]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                </div>
              )}

              {delivery === "courier" && (
                <div className="mt-3">
                  <label className="text-[10px] text-[var(--muted)] block mb-1.5">آدرس تحویل</label>
                  {editingAddress ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={tempAddress}
                        onChange={e => setTempAddress(e.target.value)}
                        rows={2}
                        className="w-full bg-[var(--bg)] border border-[var(--gold)]/50 rounded-xl p-2.5 text-[10.5px] text-[var(--text)] outline-none resize-none"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setCourierAddress(tempAddress.trim() || DEFAULT_COURIER_ADDRESS); setEditingAddress(false); }}
                          disabled={tempAddress.trim().length < 10}
                          className="flex-1 h-7 rounded-lg bg-[var(--gold)] text-black text-[10px] font-bold disabled:opacity-40"
                        >ذخیره</button>
                        <button
                          onClick={() => { setTempAddress(courierAddress); setEditingAddress(false); }}
                          className="flex-1 h-7 rounded-lg border border-[var(--border)] text-[10px] font-bold text-[var(--muted)]"
                        >انصراف</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`bg-[var(--bg)] border rounded-xl p-2.5 text-[10.5px] leading-relaxed ${addressValid ? "border-[var(--border)]" : "border-[var(--red)]/50"}`}>
                      <div className="text-[var(--text)]">{courierAddress}</div>
                      <button
                        onClick={() => { setTempAddress(courierAddress); setEditingAddress(true); }}
                        className="text-[10px] text-[var(--gold)] mt-1.5 hover:underline"
                      >ویرایش آدرس</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* بیمه (فقط پیک) */}
            {delivery === "courier" && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInsurance}
                    onChange={e => setIncludeInsurance(e.target.checked)}
                    className="accent-[var(--gold)] w-4 h-4 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-[11px] font-bold">بیمه محموله</div>
                    <div className="text-[9.5px] text-[var(--muted)] mt-0.5 leading-relaxed">۰.۱٪ ارزش محموله — در صورت بروز مشکل جبران می‌شود</div>
                  </div>
                  <div className="text-[10px] font-bold text-[var(--gold)] shrink-0 font-mono">
                    +{isCoin ? format(insuranceFeeToman) : format(insuranceFeeGold * unitPrice)} ت
                  </div>
                </label>
              </div>
            )}

            {/* ثبت مالکیت */}
            {!isCoin && (
              <div className="rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/5 to-transparent p-3 mb-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerOwnership}
                    onChange={e => setRegisterOwnership(e.target.checked)}
                    className="accent-[var(--gold)] w-4 h-4 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-[11px] font-bold flex items-center gap-1.5 flex-wrap">
                      ثبت به نام شما با شماره سریال
                      <span className="text-[8px] bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 px-1 py-0.5 rounded">توصیه می‌شود</span>
                    </div>
                    <div className="text-[9.5px] text-[var(--muted)] mt-1 leading-relaxed">طلای شما با سریال منحصربه‌فرد در سامانه ثبت می‌شود.</div>
                    <div className="text-[10px] text-[var(--gold)] mt-1.5 font-bold font-mono">+ هزینه حکاکی: {format(ENGRAVING_FEE)} تومان</div>
                  </div>
                </label>
              </div>
            )}

            {/* توضیحات */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-[var(--muted)]">توضیحات <span className="text-[var(--red)]">*</span></label>
                <span className={`text-[10px] font-bold font-mono ${noteValid ? "text-[var(--green)]" : "text-amber-400"}`}>
                  {toFa(String(note.trim().length))}/{toFa(String(MIN_NOTE_LENGTH))}
                </span>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 100))}
                placeholder="بابت چه چیزی برداشت می‌کنید؟ (حداقل ۱۰ کاراکتر)"
                rows={2}
                className={`w-full bg-[var(--bg)] border rounded-lg px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)] outline-none resize-none transition ${
                  note.trim().length > 0 && !noteValid ? "border-amber-500/50"
                  : noteValid ? "border-[var(--green)]/50"
                  : "border-[var(--border)] focus:border-[var(--gold)]"
                }`}
              />
            </div>

            {/* خلاصه */}
            {weightNum > 0 && isValid && (
              <div className="rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/5 to-transparent p-3 mb-3 fade-in">
                <div className="text-xs font-bold mb-2">خلاصه برداشت</div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">ارزش {assetLabel}</span>
                    <span className="font-semibold font-mono">{format(valueToman)} ت</span>
                  </div>
                  {!isCoin && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">کارمزد ضرب (۰.۳٪)</span>
                      <span className="text-[var(--red)] font-mono">{toFa(mintingFeeGold.toFixed(4))} گرم</span>
                    </div>
                  )}
                  {!isCoin && includeInsurance && delivery === "courier" && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">بیمه (۰.۱٪)</span>
                      <span className="text-[var(--red)] font-mono">{toFa(insuranceFeeGold.toFixed(4))} گرم</span>
                    </div>
                  )}
                  {isCoin && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">کارمزد ضرب (۰.۳٪)</span>
                      <span className="text-[var(--red)] font-mono">+{format(mintingFeeToman)} ت</span>
                    </div>
                  )}
                  {isCoin && includeInsurance && delivery === "courier" && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">بیمه (۰.۱٪)</span>
                      <span className="text-[var(--red)] font-mono">+{format(insuranceFeeToman)} ت</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[var(--gold)]/20">
                    <span className="text-[var(--text)] font-bold">کسر از موجودی {isCoin ? "سکه" : "طلا"}</span>
                    <span className="font-bold text-[var(--gold)] font-mono">{toFa(totalAssetDeducted.toFixed(isCoin ? 0 : 3))} {unit}</span>
                  </div>
                  {totalCashFee > 0 && (
                    <div className="flex justify-between pt-1">
                      <span className="text-[var(--muted)]">هزینه نقدی (تومان)</span>
                      <span className="text-amber-400 font-semibold font-mono">{format(totalCashFee)} ت</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {needsAdminApproval && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 mb-3">
                <div className="text-[10px] text-amber-400 leading-relaxed">
                  ⚠️ برداشت بیش از {toFa(String(ADMIN_APPROVAL_THRESHOLD))} {unit} نیاز به تایید مدیریت دارد. پس از ارسال، در صف بررسی قرار می‌گیرد.
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {submitting ? "در حال ارسال..." : isValid ? "ادامه و تایید نهایی" : "اطلاعات را کامل کنید"}
            </button>

            <div className="text-[9.5px] text-[var(--muted)] text-center leading-relaxed mt-3 px-4">
              پس از تایید، کد تحویل صادر می‌شود که برای دریافت طلا الزامی است.
            </div>
          </>
        )}

        {/* ==================== OTP ==================== */}
        {step === "otp" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center text-2xl mb-3">🔐</div>
              <h2 className="text-base font-bold mb-1">تایید نهایی برداشت</h2>
              <p className="text-[11px] text-[var(--muted)]">کد امن ۴ رقمی خود را وارد کنید</p>
            </div>

            <div className="bg-gradient-to-br from-[var(--gold)]/10 to-[var(--gold)]/5 border border-[var(--gold)]/30 rounded-xl p-3 mb-5">
              <div className="text-[10px] text-[var(--gold)] font-bold mb-2">⚠️ لطفاً اطلاعات را بررسی کنید</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">دارایی</span>
                  <span className="font-bold">{assetLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">مقدار</span>
                  <span className="font-bold text-[var(--green)] font-mono">{toFa(weightNum.toFixed(isCoin ? 0 : 3))} {unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">روش تحویل</span>
                  <span className="font-bold">
                    {delivery === "branch" ? `🏛 ${selectedLocation?.name}` : delivery === "agency" ? `🏪 ${selectedLocation?.name}` : "🚚 ارسال با پیک"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--gold)]/20">
                  <span className="text-[var(--text)] font-bold">کسر از موجودی</span>
                  <span className="font-black text-[var(--gold)] font-mono">{toFa(totalAssetDeducted.toFixed(isCoin ? 0 : 3))} {unit}</span>
                </div>
                {totalCashFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">هزینه نقدی</span>
                    <span className="font-bold text-amber-400 font-mono">{format(totalCashFee)} ت</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`flex justify-center gap-2 mb-4 ${otpShake ? "animate-shake" : ""}`} dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`phy-otp-${i}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpDigit(i, e.target.value)}
                  onKeyDown={e => handleOtpBackspace(i, e)}
                  disabled={otpVerifying || submitting}
                  autoFocus={i === 0}
                  className={`w-14 h-16 text-center text-2xl font-black font-mono rounded-xl border-2 outline-none transition-all ${
                    otpError ? "border-[var(--red)] text-[var(--red)]"
                    : d ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/10"
                    : "border-[var(--border)] text-[var(--text)] bg-[var(--bg)] focus:border-[var(--gold)]"
                  }`}
                />
              ))}
            </div>

            {otpError && <p className="text-[10px] text-[var(--red)] text-center mb-3">{otpError}</p>}
            {(otpVerifying || submitting) && !otpError && (
              <p className="text-[10px] text-[var(--gold)] text-center mb-3 flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin" />
                در حال ثبت...
              </p>
            )}

            {process.env.NODE_ENV !== "production" && (
              <div className="text-[9.5px] text-[var(--muted)] text-center mb-3 bg-[var(--panel-2)] rounded-lg p-2">
                🔒 دمو: کد <span className="font-mono font-bold text-[var(--gold)]">1234</span>
              </div>
            )}

            <button
              onClick={() => { setStep("form"); setOtpDigits(["", "", "", ""]); setOtpError(""); }}
              disabled={otpVerifying || submitting}
              className="w-full h-9 rounded-xl bg-transparent text-[var(--muted)] font-bold text-[11px] hover:text-[var(--text)] transition disabled:opacity-40"
            >
              ویرایش اطلاعات
            </button>
          </div>
        )}

        {/* ==================== موفقیت (صف بررسی) ==================== */}
        {step === "success" && result && needsAdminApproval && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-5 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-3xl mb-3">⏳</div>
              <h2 className="text-base font-bold mb-1.5">درخواست شما ثبت شد</h2>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                به دلیل برداشت بیش از {toFa(String(ADMIN_APPROVAL_THRESHOLD))} {result.unit}، درخواست شما در صف بررسی مدیریت قرار گرفت.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-amber-500/30 bg-[var(--panel)] p-4">
              <div className="text-[9px] text-[var(--muted)] mb-1 text-center">شماره پیگیری</div>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-widest text-center" dir="ltr">{result.trackingCode}</div>
              <div className="text-[9px] text-[var(--muted)] mt-2 text-center">این شماره را برای پیگیری نگه دارید</div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 space-y-2 text-[11px]">
              <div className="text-xs font-bold mb-1">خلاصه درخواست</div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">دارایی</span><span className="font-bold">{result.assetLabel}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">مقدار</span><span className="font-bold font-mono">{toFa(result.amount.toFixed(result.unit === "گرم" ? 4 : 0))} {result.unit}</span></div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">روش تحویل</span>
                <span className="font-bold">{result.deliveryMethod === "branch" ? `🏛 ${result.locationName}` : result.deliveryMethod === "agency" ? `🏪 ${result.locationName}` : "🚚 ارسال با پیک"}</span>
              </div>
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="text-[var(--muted)] mb-0.5">توضیحات:</div>
                <div className="bg-[var(--panel-2)] rounded p-1.5 text-[10px] leading-relaxed">{result.note}</div>
              </div>
            </div>

            <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 p-3">
              <div className="text-[10px] text-sky-400 leading-relaxed">
                📩 نتیجه بررسی حداکثر تا ۲۴ ساعت آینده از طریق پیامک به شما اطلاع داده می‌شود. پس از تایید، کد تحویل صادر خواهد شد.
              </div>
            </div>

            <button onClick={() => router.push("/wallet")} className="w-full h-10 rounded-xl bg-[var(--gold)] text-black font-bold text-[11px] hover:bg-[var(--gold)]/90 transition">
              بازگشت به کیف پول
            </button>
          </div>
        )}

        {/* ==================== موفقیت (رسید کامل) ==================== */}
        {step === "success" && result && !needsAdminApproval && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--green)]/30 bg-gradient-to-br from-[var(--green)]/10 to-transparent p-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-[var(--green)]/20 border-2 border-[var(--green)] flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[var(--green)]" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-sm font-bold mb-1">درخواست برداشت ثبت شد</h2>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                {result.deliveryMethod === "courier" ? "پیک تا ۲۴ ساعت آینده برای ارسال هماهنگ می‌کند" : `با کد تحویل به ${result.locationName} مراجعه کنید`}
              </p>
            </div>

            {/* کد تحویل */}
            <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-4">
              <div className="text-center mb-3">
                <div className="text-[9px] text-[var(--muted)] mb-1">کد تحویل حضوری</div>
                <div className="text-3xl font-black text-[var(--gold)] font-mono tracking-[0.3em]" dir="ltr">{result.pickupCode}</div>
                <div className="text-[9px] text-[var(--muted)] mt-1">این کد را در محل تحویل ارائه دهید</div>
              </div>
              <button
                onClick={() => copyText(result.pickupCode)}
                className="w-full h-9 rounded-lg text-[11px] font-bold bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 border border-[var(--gold)]/30 transition"
              >
                کپی کد تحویل
              </button>
            </div>

            {/* سریال */}
            {result.serialNumber && (
              <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">🔐</span>
                  <span className="text-[10px] font-bold text-sky-400">طلا به نام شما ثبت شد</span>
                </div>
                <div className="bg-[var(--bg)] rounded-lg p-2.5 border border-sky-500/20">
                  <div className="text-[8.5px] text-[var(--muted)] mb-0.5">شماره سریال منحصربه‌فرد</div>
                  <div className="font-mono text-sm font-black text-sky-400 tracking-wider text-center" dir="ltr">{result.serialNumber}</div>
                </div>
                <button
                  onClick={() => copyText(result.serialNumber!)}
                  className="w-full mt-2 h-8 rounded-lg text-[10.5px] font-bold text-sky-400 hover:bg-sky-500/10 transition"
                >
                  کپی شماره سریال
                </button>
              </div>
            )}

            <PhysicalReceipt data={result} buyerName={buyerName} buyerNationalId={user?.nationalId} />

            <div className="flex gap-2">
              <button
                onClick={shareReceipt}
                className="flex-1 h-10 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)] font-bold text-[11px] hover:bg-[var(--gold)]/20 transition flex items-center justify-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                اشتراک‌گذاری
              </button>
              <button
                onClick={() => router.push("/wallet")}
                className="flex-1 h-10 rounded-xl bg-[var(--gold)] text-black font-bold text-[11px] hover:bg-[var(--gold)]/90 transition"
              >
                بازگشت به کیف پول
              </button>
            </div>
          </div>
        )}
      </div>

      {/* مودال انتخاب محل */}
      {showLocationPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setShowLocationPicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">انتخاب {delivery === "branch" ? "شعبه" : "نمایندگی"}</h3>
              <button onClick={() => setShowLocationPicker(false)} className="text-[var(--muted)]" aria-label="بستن">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {filteredLocations.length === 0 && (
                <div className="text-center py-8 text-[11px] text-[var(--muted)]">موردی یافت نشد</div>
              )}
              {filteredLocations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => { setSelectedLocation(loc); setShowLocationPicker(false); }}
                  className={`w-full flex items-start gap-2.5 p-3 rounded-xl border transition text-right ${
                    selectedLocation?.id === loc.id ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--border)] hover:bg-[var(--panel-2)]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-base shrink-0">
                    {loc.type === "branch" ? "🏛" : "🏪"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold">{loc.city} · {loc.name}</span>
                      {loc.rating && <span className="text-[8.5px] text-amber-400 font-mono">⭐ {toFa(String(loc.rating))}</span>}
                    </div>
                    <div className="text-[9.5px] text-[var(--muted)] mt-0.5 truncate">{loc.address}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[8.5px] text-[var(--muted)]">
                      <span>🕐 {loc.hours}</span>
                      {loc.stock && <span className="text-[var(--green)]">• {loc.stock}</span>}
                    </div>
                  </div>
                  {selectedLocation?.id === loc.id && (
                    <span className="w-5 h-5 rounded-full bg-[var(--gold)] flex items-center justify-center shrink-0">
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-shake { animation: shake 0.4s ease; }
        .fade-in { animation: fadeIn 0.3s ease; }
      `}</style>
    </>
  );
}