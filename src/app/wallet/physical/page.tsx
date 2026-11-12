"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const GOLD_PRICE = 19_080_000;
const MIN_WEIGHT = 1;
const ADMIN_APPROVAL_THRESHOLD = 20;
const MINTING_FEE_RATE = 0.003;
const INSURANCE_RATE = 0.001;
const COURIER_FEE = 250_000;
const ENGRAVING_FEE = 75_000;
const MIN_NOTE_LENGTH = 10;

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const toFa = (s: string) =>
  s.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/\./g, "٫");

// ============================================================
// داده‌های نمونه
// ============================================================
type AssetType = "bar" | "coin" | "melted";
type CoinType = "full" | "half" | "quarter" | "gram";

const ASSET_OPTIONS: Record<AssetType, {
  label: string;
  icon: string;
  unit: string;
  sizes?: number[];
  available: number;
}> = {
  bar: {
    label: "شمش طلا",
    icon: "🧱",
    unit: "گرم",
    sizes: [1, 5, 10, 20, 50, 100],
    available: 12.45,
  },
  coin: {
    label: "سکه",
    icon: "🪙",
    unit: "عدد",
    available: 0, // از COIN_TYPES خوانده می‌شود
  },
  melted: {
    label: "آب‌شده",
    icon: "🔥",
    unit: "گرم",
    available: 12.45,
  },
};

// 🔽 جدید: انواع سکه با موجودی و قیمت مستقل
const COIN_TYPES: Record<CoinType, {
  label: string;
  weight: number; // گرم (جهت نمایش)
  available: number; // تعداد
  price: number; // تومان به ازای هر عدد
}> = {
  full:    { label: "تمام", weight: 8.13, available: 2, price: 195_000_000 },
  half:    { label: "نیم",  weight: 4.06, available: 1, price: 98_000_000  },
  quarter: { label: "ربع",  weight: 2.03, available: 1, price: 52_000_000  },
  gram:    { label: "گرمی", weight: 1.00, available: 3, price: 24_000_000  },
};

type Location = {
  id: string;
  type: "branch" | "agency";
  city: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  rating?: number;
  stock?: string;
};

const LOCATIONS: Location[] = [
  { id: "b1", type: "branch", city: "تهران", name: "شعبه مرکزی", address: "خیابان ولیعصر، پلاک ۱۲", phone: "۰۲۱-۹۱۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۰۰" },
  { id: "b2", type: "branch", city: "تهران", name: "شعبه بازار", address: "بازار بزرگ، پاساژ زرگرها", phone: "۰۲۱-۹۱۰۰۰۰۰۱", hours: "۹:۰۰ - ۱۷:۰۰" },
  { id: "b3", type: "branch", city: "مشهد", name: "شعبه احمدآباد", address: "بلوار احمدآباد، نبش چهارراه", phone: "۰۵۱-۳۸۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۰۰" },
  { id: "b4", type: "branch", city: "اصفهان", name: "شعبه چهارباغ", address: "چهارباغ بالا، مجتمع تجاری", phone: "۰۳۱-۳۲۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۰۰" },
  { id: "a1", type: "agency", city: "تهران", name: "طلافروشی زرین", address: "خیابان ولیعصر، کوچه بهار، پلاک ۴۵", phone: "۰۲۱-۸۸۷۷۶۶۵۵", hours: "۹:۳۰ - ۱۹:۰۰", rating: 4.8, stock: "۴۵ گرم موجود" },
  { id: "a2", type: "agency", city: "تهران", name: "گالری آریا", address: "میدان ونک، خیابان گاندی", phone: "۰۲۱-۸۸۶۶۵۵۴۴", hours: "۱۰:۰۰ - ۲۰:۰۰", rating: 4.6, stock: "۲۰ گرم موجود" },
  { id: "a3", type: "agency", city: "شیراز", name: "طلافروشی پارس", address: "خیابان زند، پاساژ آریا", phone: "۰۷۱-۳۲۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۳۰", rating: 4.9, stock: "۳۰ گرم موجود" },
  { id: "a4", type: "agency", city: "کرج", name: "طلا و جواهر نگین", address: "بلوار طالقانی، پلاک ۸", phone: "۰۲۶-۳۴۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۰۰", rating: 4.5, stock: "۱۵ گرم موجود" },
];

const DEFAULT_COURIER_ADDRESS = "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳";

type DeliveryMethod = "branch" | "agency" | "courier";
type Step = "form" | "otp" | "success";

// ============================================================
// توابع امنیتی
// ============================================================
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

function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateSerialNumber(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 999999) + 1).padStart(6, "0");
  return `KZ-AU-${year}-${num}`;
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

// ============================================================
// انواع نتیجه
// ============================================================
type ReceiptResult = {
  trackingCode: string;
  pickupCode?: string;
  serialNumber?: string;
  dateTime: string;
  assetLabel: string;
  amount: number;
  unit: string;
  deliveryMethod: DeliveryMethod;
  locationName?: string;
  locationAddress?: string;
  locationPhone?: string;
  courierAddress?: string;
  unitPrice: number;
  mintingFeeGold: number;
  insuranceFeeGold: number;
  totalAssetDeducted: number;
  totalCashFee: number;
  needsAdminApproval: boolean;
  receiptHash: string;
  verificationCode: string;
  note: string;
  registeredOwnership: boolean;
};

// ============================================================
// کامپوننت
// ============================================================
export default function PhysicalWithdrawPage() {
  const router = useRouter();
  const { user, hasPin } = useAuth();

  const [step, setStep] = useState<Step>("form");
  const [assetType, setAssetType] = useState<AssetType>("bar");
  const [coinType, setCoinType] = useState<CoinType>("full"); // 🔽 جدید
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

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [copied, setCopied] = useState<"pickup" | "serial" | null>(null);

  const asset = ASSET_OPTIONS[assetType];
  const coin = COIN_TYPES[coinType];
  const isCoin = assetType === "coin";

  // 🔽 موجودی و قیمت واحد بر اساس حالت
  const availableAmount = isCoin ? coin.available : asset.available;
  const unitPrice = isCoin ? coin.price : GOLD_PRICE;
  const assetLabel = isCoin ? `سکه ${coin.label}` : asset.label;

  const weightNum = Number(weight) || 0;
  const noteValid = note.trim().length >= MIN_NOTE_LENGTH;

  // ============================================================
  // محاسبات
  // ============================================================
  const valueToman = weightNum * unitPrice;

  // کسر از موجودی طلا (فقط برای شمش/آب‌شده)
  const mintingFeeGold = isCoin ? 0 : weightNum * MINTING_FEE_RATE;
  const insuranceFeeGold = isCoin ? 0 : (includeInsurance && delivery === "courier" ? weightNum * INSURANCE_RATE : 0);
  const totalAssetDeducted = weightNum + mintingFeeGold + insuranceFeeGold;

  // هزینه نقدی (تومانی) — برای سکه، کارمزد ضرب از قیمت سکه
  const mintingFeeToman = isCoin ? valueToman * MINTING_FEE_RATE : 0;
  const insuranceFeeToman = isCoin && includeInsurance && delivery === "courier" ? valueToman * INSURANCE_RATE : 0;
  const courierFeeToman = delivery === "courier" ? COURIER_FEE : 0;
  const engravingFeeToman = registerOwnership && !isCoin ? ENGRAVING_FEE : 0;
  const totalCashFee = mintingFeeToman + insuranceFeeToman + courierFeeToman + engravingFeeToman;

  // اعتبارسنجی
  const needsAdminApproval = weightNum > ADMIN_APPROVAL_THRESHOLD;
  const enoughBalance = totalAssetDeducted <= availableAmount;
  const locationRequired = delivery === "branch" || delivery === "agency";
  const locationValid = !locationRequired || !!selectedLocation;
  const addressValid = delivery !== "courier" || courierAddress.trim().length >= 10;
  const isValid = weightNum >= MIN_WEIGHT && enoughBalance && noteValid && locationValid && addressValid;

  const filteredLocations = LOCATIONS.filter(l => l.type === delivery);

  function handleMax() {
    if (isCoin) {
      setWeight(String(Math.floor(availableAmount)));
      return;
    }
    const feeRate =
      MINTING_FEE_RATE +
      (includeInsurance && delivery === "courier" ? INSURANCE_RATE : 0);
    const raw = availableAmount / (1 + feeRate);
    const max = Math.floor(raw * 1000) / 1000;
    setWeight(String(max));
  }

  async function proceedToOtp() {
    if (!isValid || submitting) return;
    if (!hasPin) {
      await handleFinalSubmit();
      return;
    }
    setStep("otp");
    setOtpDigits(["", "", "", ""]);
    setOtpError("");
  }

  async function verifyOtp(codeOverride?: string) {
    const code = codeOverride ?? otpDigits.join("");
    if (code.length !== 4) return;
    setOtpVerifying(true);
    setOtpError("");
    await new Promise(r => setTimeout(r, 700));

    if (code === "1234" || code === (user as any)?.securityPin) {
      await handleFinalSubmit();
    } else {
      setOtpError("کد امن اشتباه است");
      setOtpShake(true);
      await new Promise(r => setTimeout(r, 450));
      setOtpDigits(["", "", "", ""]);
      setOtpShake(false);
      setOtpVerifying(false);
    }
  }

  async function handleFinalSubmit() {
    if (submitting) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateTime = `${toFa(pad(now.getHours()))}:${toFa(pad(now.getMinutes()))} · ${toFa(String(now.getFullYear()))}/${toFa(String(now.getMonth() + 1))}/${toFa(String(now.getDate()))}`;

    const trackingCode = "PHY-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const pickupCode = needsAdminApproval ? undefined : generatePickupCode();
    const serialNumber =
      !needsAdminApproval && registerOwnership && !isCoin ? generateSerialNumber() : undefined;

    const receiptHash = generateReceiptHash({
      trackingCode,
      weight: weightNum,
      delivery,
      dateTime,
      coinType: isCoin ? coinType : undefined, // 🔽 تفکیک هش سکه‌ها
    });
    const verificationCode = generateVerificationCode(receiptHash);

    setResult({
      trackingCode,
      pickupCode,
      serialNumber,
      dateTime,
      assetLabel,
      amount: weightNum,
      unit: asset.unit,
      deliveryMethod: delivery,
      locationName: delivery !== "courier" ? selectedLocation?.name : undefined,
      locationAddress: delivery !== "courier" ? selectedLocation?.address : undefined,
      locationPhone: delivery !== "courier" ? selectedLocation?.phone : undefined,
      courierAddress: delivery === "courier" ? courierAddress : undefined,
      unitPrice,
      mintingFeeGold,
      insuranceFeeGold,
      totalAssetDeducted,
      totalCashFee,
      needsAdminApproval,
      receiptHash,
      verificationCode,
      note: note.trim(),
      registeredOwnership: registerOwnership,
    });
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
      const ref = document.getElementById(`phy-otp-${idx + 1}`) as HTMLInputElement;
      ref?.focus();
    }
    const joined = next.join("");
    if (joined.length === 4) {
      setTimeout(() => verifyOtp(joined), 200);
    }
  }

  function handleOtpBackspace(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      const ref = document.getElementById(`phy-otp-${idx - 1}`) as HTMLInputElement;
      ref?.focus();
    }
  }

  async function copyText(text: string, type: "pickup" | "serial") {
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
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }

  async function shareReceipt() {
    if (!result || !result.pickupCode) return;
    const text = `🧾 رسید رسمی برداشت فیزیکی طلا — کیف زرگر
━━━━━━━━━━━━━━━━━━
شماره: ${result.trackingCode}
تاریخ: ${result.dateTime}

${result.assetLabel}: ${toFa(result.amount.toFixed(result.unit === "گرم" ? 4 : 0))} ${result.unit}
${result.serialNumber ? `شماره سریال: ${result.serialNumber}\n` : ""}
روش تحویل: ${result.deliveryMethod === "branch" ? "حضوری در شعبه" : result.deliveryMethod === "agency" ? "حضوری در نمایندگی" : "ارسال با پیک"}
${result.locationName ? `مکان: ${result.locationName}\n` : ""}
${result.locationAddress ? `${result.locationAddress}\n` : ""}
━━━━━━━━━━━━━━━━━━
کد تحویل: ${result.pickupCode}

🔍 استعلام: ${result.verificationCode}
🌐 kifzargar.com/verify/${result.trackingCode}

⚠️ برای دریافت طلا، کد تحویل و کارت ملی همراه داشته باشید.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "رسید برداشت فیزیکی", text });
      } else {
        await copyText(text, "pickup");
      }
    } catch {}
  }

  return (
    <>
      <div className="px-2.5 sm:px-4 pt-3 pb-8">
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
                  <div className="text-base font-black text-[var(--gold)]">
                    {toFa(availableAmount.toFixed(isCoin ? 0 : 3))}
                    <span className="text-[10px] font-normal text-[var(--muted)] mr-1">{asset.unit}</span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[9px] text-[var(--muted)]">معادل</div>
                  <div className="text-[11px] font-bold text-[var(--text)]">
                    {format(availableAmount * unitPrice)}
                  </div>
                  <div className="text-[9px] text-[var(--muted)]">تومان</div>
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
                        active
                          ? "border-[var(--gold)] bg-[var(--gold)]/10"
                          : "border-[var(--border)] hover:border-[var(--gold)]/40"
                      }`}
                      aria-pressed={active}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div className={`text-[10px] font-bold ${active ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>
                        {opt.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🔽 جدید: انتخاب نوع سکه */}
            {isCoin && (
              <div className="rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/5 to-transparent p-3 mb-3 fade-in">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-[var(--muted)]">نوع سکه</label>
                  <span className="text-[9px] text-[var(--muted)]">
                    قیمت هر عدد: {format(coin.price)} ت
                  </span>
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
                          active
                            ? "border-[var(--gold)] bg-[var(--gold)]/15"
                            : "border-[var(--border)] hover:border-[var(--gold)]/40"
                        }`}
                        aria-pressed={active}
                      >
                        <div className={`text-[11px] font-bold ${active ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>
                          {opt.label}
                        </div>
                        <div className="text-[8px] text-[var(--muted)] mt-0.5">
                          {toFa(String(opt.available))} عدد
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[9px] text-[var(--muted)] mt-2 leading-relaxed">
                  وزن تقریبی {coin.label}: {toFa(String(coin.weight))} گرم
                </div>
              </div>
            )}

            {/* وزن */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="phy-weight" className="text-[10px] text-[var(--muted)]">
                  مقدار ({asset.unit})
                </label>
                <button
                  onClick={handleMax}
                  className="text-[10px] font-bold text-[var(--gold)] hover:underline"
                >
                  همه
                </button>
              </div>
              <div className={`rounded-xl border-2 bg-[var(--bg)] px-3 py-3 transition-all ${
                weight && !enoughBalance
                  ? "border-red-500/50"
                  : weight && weightNum >= MIN_WEIGHT
                  ? "border-emerald-500/50"
                  : "border-[var(--border)] focus-within:border-[var(--gold)]"
              }`}>
                <input
                  id="phy-weight"
                  type="text"
                  inputMode={isCoin ? "numeric" : "decimal"}
                  value={weight}
                  onChange={e => {
                    let val = toEnDigits(e.target.value).replace(/[^\d.]/g, "");
                    if (isCoin) val = val.replace(/\./g, "");
                    setWeight(val);
                  }}
                  placeholder={`حداقل ${toFa(String(MIN_WEIGHT))}`}
                  className="w-full bg-transparent text-center text-xl font-black text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal placeholder:text-sm outline-none"
                  dir="ltr"
                  aria-describedby="phy-weight-hint"
                />
              </div>

              {assetType === "bar" && asset.sizes && (
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {asset.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setWeight(String(size))}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
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

              <div id="phy-weight-hint">
                {weightNum > 0 && (
                  <div className="text-[10px] text-center text-[var(--muted)] mt-2">
                    معادل {format(valueToman)} تومان
                  </div>
                )}
                {weightNum > 0 && weightNum < MIN_WEIGHT && (
                  <p className="text-[10px] text-red-400 mt-1.5 text-center">
                    حداقل {toFa(String(MIN_WEIGHT))} {asset.unit} است
                  </p>
                )}
                {weightNum > 0 && !enoughBalance && (
                  <p className="text-[10px] text-red-400 mt-1.5 text-center">
                    موجودی کافی نیست (شامل کارمزدها)
                  </p>
                )}
              </div>
            </div>

            {/* روش تحویل */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <label className="text-[10px] text-[var(--muted)] block mb-2">روش تحویل</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => { setDelivery("branch"); setSelectedLocation(null); }}
                  className={`rounded-xl p-2.5 transition border-2 text-center ${
                    delivery === "branch"
                      ? "border-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] hover:border-[var(--gold)]/40"
                  }`}
                  aria-pressed={delivery === "branch"}
                >
                  <div className="text-lg mb-1">🏛</div>
                  <div className={`text-[10px] font-bold ${delivery === "branch" ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>شعبه</div>
                  <div className="text-[8px] text-[var(--muted)] mt-0.5">رایگان</div>
                </button>
                <button
                  onClick={() => { setDelivery("agency"); setSelectedLocation(null); }}
                  className={`rounded-xl p-2.5 transition border-2 text-center ${
                    delivery === "agency"
                      ? "border-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] hover:border-[var(--gold)]/40"
                  }`}
                  aria-pressed={delivery === "agency"}
                >
                  <div className="text-lg mb-1">🏪</div>
                  <div className={`text-[10px] font-bold ${delivery === "agency" ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>نمایندگی</div>
                  <div className="text-[8px] text-[var(--muted)] mt-0.5">رایگان</div>
                </button>
                <button
                  onClick={() => { setDelivery("courier"); setSelectedLocation(null); }}
                  className={`rounded-xl p-2.5 transition border-2 text-center ${
                    delivery === "courier"
                      ? "border-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] hover:border-[var(--gold)]/40"
                  }`}
                  aria-pressed={delivery === "courier"}
                >
                  <div className="text-lg mb-1">🚚</div>
                  <div className={`text-[10px] font-bold ${delivery === "courier" ? "text-[var(--gold)]" : "text-[var(--text)]"}`}>پیک</div>
                  <div className="text-[8px] text-[var(--muted)] mt-0.5">{format(COURIER_FEE)} ت</div>
                </button>
              </div>

              {locationRequired && (
                <div className="mt-3">
                  <label className="text-[10px] text-[var(--muted)] block mb-1.5">
                    انتخاب {delivery === "branch" ? "شعبه" : "نمایندگی"}
                  </label>
                  <button
                    onClick={() => setShowLocationPicker(true)}
                    className={`w-full flex items-center gap-2.5 bg-[var(--bg)] border rounded-xl p-2.5 transition text-right ${
                      selectedLocation ? "border-emerald-500/50" : "border-[var(--border)] hover:border-[var(--gold)]/50"
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                        >
                          ذخیره
                        </button>
                        <button
                          onClick={() => { setTempAddress(courierAddress); setEditingAddress(false); }}
                          className="flex-1 h-7 rounded-lg border border-[var(--border)] text-[10px] font-bold text-[var(--muted)]"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`bg-[var(--bg)] border rounded-xl p-2.5 text-[10.5px] leading-relaxed ${
                      addressValid ? "border-[var(--border)]" : "border-red-500/50"
                    }`}>
                      <div className="text-[var(--text)]">{courierAddress}</div>
                      <button
                        onClick={() => { setTempAddress(courierAddress); setEditingAddress(true); }}
                        className="text-[10px] text-[var(--gold)] mt-1.5 hover:underline"
                      >
                        ویرایش آدرس
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* بیمه */}
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
                    <div className="text-[9.5px] text-[var(--muted)] mt-0.5 leading-relaxed">
                      ۰.۱٪ ارزش محموله — در صورت بروز مشکل جبران می‌شود
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-[var(--gold)] shrink-0">
                    +{format(isCoin ? insuranceFeeToman : insuranceFeeGold * GOLD_PRICE)} ت
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
                    <div className="text-[9.5px] text-[var(--muted)] mt-1 leading-relaxed">
                      طلای شما با سریال منحصربه‌فرد در سامانه ثبت می‌شود. در صورت سرقت یا گم شدن قابل پیگیری است.
                    </div>
                    <div className="text-[10px] text-[var(--gold)] mt-1.5 font-bold">
                      + هزینه حکاکی: {format(ENGRAVING_FEE)} تومان
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* توضیحات */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="phy-note" className="text-[10px] text-[var(--muted)]">
                  توضیحات <span className="text-red-400">*</span>
                </label>
                <span className={`text-[10px] font-bold ${noteValid ? "text-emerald-400" : "text-amber-400"}`}>
                  {toFa(String(note.trim().length))}/{toFa(String(MIN_NOTE_LENGTH))}
                </span>
              </div>
              <textarea
                id="phy-note"
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 100))}
                placeholder="بابت چه چیزی برداشت می‌کنید؟ (حداقل ۱۰ کاراکتر)"
                rows={2}
                className={`w-full bg-[var(--bg)] border rounded-lg px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)] outline-none resize-none transition ${
                  note.trim().length > 0 && !noteValid
                    ? "border-amber-500/50"
                    : noteValid
                    ? "border-emerald-500/50"
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
                    <span className="font-semibold">{format(valueToman)} ت</span>
                  </div>
                  {!isCoin && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">کارمزد ضرب (۰.۳٪)</span>
                      <span className="text-red-400">
                        {toFa(mintingFeeGold.toFixed(4))} گرم
                      </span>
                    </div>
                  )}
                  {!isCoin && includeInsurance && delivery === "courier" && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">بیمه (۰.۱٪)</span>
                      <span className="text-red-400">{toFa(insuranceFeeGold.toFixed(4))} گرم</span>
                    </div>
                  )}
                  {isCoin && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">کارمزد ضرب (۰.۳٪)</span>
                      <span className="text-red-400">+{format(mintingFeeToman)} ت</span>
                    </div>
                  )}
                  {isCoin && includeInsurance && delivery === "courier" && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">بیمه (۰.۱٪)</span>
                      <span className="text-red-400">+{format(insuranceFeeToman)} ت</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[var(--gold)]/20">
                    <span className="text-[var(--text)] font-bold">کسر از موجودی {isCoin ? "سکه" : "طلا"}</span>
                    <span className="font-bold text-[var(--gold)]">
                      {toFa(totalAssetDeducted.toFixed(isCoin ? 0 : 3))} {asset.unit}
                    </span>
                  </div>
                  {totalCashFee > 0 && (
                    <div className="flex justify-between pt-1">
                      <span className="text-[var(--muted)]">هزینه نقدی (تومان)</span>
                      <span className="text-amber-400 font-semibold">{format(totalCashFee)} ت</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {needsAdminApproval && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 mb-3">
                <div className="text-[10px] text-amber-400 leading-relaxed">
                  ⚠️ برداشت بیش از {toFa(String(ADMIN_APPROVAL_THRESHOLD))} {asset.unit} نیاز به تایید مدیریت دارد. پس از ارسال، در صف بررسی قرار می‌گیرد.
                </div>
              </div>
            )}

            <button
              onClick={proceedToOtp}
              disabled={!isValid || submitting}
              className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              )}
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
              <div className="w-14 h-14 mx-auto rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold)]/40 flex items-center justify-center text-2xl mb-3">
                🔐
              </div>
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
                  <span className="font-bold text-emerald-400">
                    {toFa(weightNum.toFixed(isCoin ? 0 : 3))} {asset.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">روش تحویل</span>
                  <span className="font-bold">
                    {delivery === "branch" ? `🏛 ${selectedLocation?.name}` : delivery === "agency" ? `🏪 ${selectedLocation?.name}` : "🚚 ارسال با پیک"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--gold)]/20">
                  <span className="text-[var(--text)] font-bold">کسر از موجودی</span>
                  <span className="font-black text-[var(--gold)]">
                    {toFa(totalAssetDeducted.toFixed(isCoin ? 0 : 3))} {asset.unit}
                  </span>
                </div>
                {totalCashFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">هزینه نقدی</span>
                    <span className="font-bold text-amber-400">{format(totalCashFee)} ت</span>
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
                  aria-label={`رقم ${i + 1} کد امن`}
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
              onClick={() => {
                setStep("form");
                setOtpDigits(["", "", "", ""]);
                setOtpError("");
              }}
              disabled={otpVerifying || submitting}
              className="w-full h-9 rounded-xl bg-transparent text-[var(--muted)] font-bold text-[11px] hover:text-[var(--text)] transition disabled:opacity-40"
            >
              ویرایش اطلاعات
            </button>
          </div>
        )}

        {/* ==================== موفقیت — در صف بررسی ==================== */}
        {step === "success" && result && result.needsAdminApproval && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-5 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-3xl mb-3">
                ⏳
              </div>
              <h2 className="text-base font-bold mb-1.5">درخواست شما ثبت شد</h2>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                به دلیل برداشت بیش از {toFa(String(ADMIN_APPROVAL_THRESHOLD))} {result.unit}، درخواست شما در صف بررسی مدیریت قرار گرفت.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-amber-500/30 bg-[var(--panel)] p-4">
              <div className="text-[9px] text-[var(--muted)] mb-1 text-center">شماره پیگیری</div>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-widest text-center" dir="ltr">
                {result.trackingCode}
              </div>
              <div className="text-[9px] text-[var(--muted)] mt-2 text-center">
                این شماره را برای پیگیری نگه دارید
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 space-y-2 text-[11px]">
              <div className="text-xs font-bold mb-1">خلاصه درخواست</div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">دارایی</span>
                <span className="font-bold">{result.assetLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">مقدار</span>
                <span className="font-bold">{toFa(result.amount.toFixed(result.unit === "گرم" ? 4 : 0))} {result.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">روش تحویل</span>
                <span className="font-bold">
                  {result.deliveryMethod === "branch" ? `🏛 ${result.locationName}` : result.deliveryMethod === "agency" ? `🏪 ${result.locationName}` : "🚚 ارسال با پیک"}
                </span>
              </div>
              {result.courierAddress && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="text-[var(--muted)] mb-0.5">آدرس تحویل:</div>
                  <div className="text-[10px] leading-relaxed">{result.courierAddress}</div>
                </div>
              )}
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

            <div className="flex gap-2">
              <button
                onClick={() => router.push("/wallet")}
                className="flex-1 h-10 rounded-xl bg-[var(--gold)] text-black font-bold text-[11px] hover:bg-[var(--gold)]/90 transition"
              >
                بازگشت به کیف پول
              </button>
            </div>
          </div>
        )}

        {/* ==================== موفقیت — رسید کامل ==================== */}
        {step === "success" && result && !result.needsAdminApproval && result.pickupCode && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-sm font-bold mb-1">درخواست برداشت ثبت شد</h2>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                {result.deliveryMethod === "courier"
                  ? "پیک تا ۲۴ ساعت آینده برای ارسال هماهنگ می‌کند"
                  : `با کد تحویل به ${result.locationName} مراجعه کنید`}
              </p>
            </div>

            {/* کد تحویل */}
            <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-4">
              <div className="text-center mb-3">
                <div className="text-[9px] text-[var(--muted)] mb-1">کد تحویل حضوری</div>
                <div className="text-3xl font-black text-[var(--gold)] font-mono tracking-[0.3em]" dir="ltr">
                  {result.pickupCode}
                </div>
                <div className="text-[9px] text-[var(--muted)] mt-1">این کد را در محل تحویل ارائه دهید</div>
              </div>
              <button
                onClick={() => copyText(result.pickupCode!, "pickup")}
                className={`w-full h-9 rounded-lg text-[11px] font-bold transition ${
                  copied === "pickup"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 border border-[var(--gold)]/30"
                }`}
              >
                {copied === "pickup" ? "✓ کپی شد" : "کپی کد تحویل"}
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
                  <div className="font-mono text-sm font-black text-sky-400 tracking-wider text-center" dir="ltr">
                    {result.serialNumber}
                  </div>
                </div>
                <button
                  onClick={() => copyText(result.serialNumber!, "serial")}
                  className={`w-full mt-2 h-8 rounded-lg text-[10.5px] font-bold transition ${
                    copied === "serial"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-sky-400 hover:bg-sky-500/10"
                  }`}
                >
                  {copied === "serial" ? "✓ کپی شد" : "کپی شماره سریال"}
                </button>
              </div>
            )}

            {/* رسید */}
            <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-[var(--panel)] overflow-hidden relative">
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.025]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="font-serif italic font-black whitespace-nowrap -rotate-[25deg] text-[var(--gold)]" style={{ fontSize: 48, letterSpacing: "0.15em" }}>
                    KIFE ZARGAR
                  </div>
                </div>
              </div>

              <div className="relative bg-gradient-to-l from-[var(--gold)]/20 to-[var(--gold)]/5 border-b-2 border-[var(--gold)]/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black text-[var(--gold)]">رسید رسمی برداشت فیزیکی</div>
                    <div className="text-[8px] text-[var(--muted)] mt-0.5">کیف زرگر · KIFE ZARGAR</div>
                    <div className="mt-2 space-y-0.5 text-[9px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--muted)]">شماره:</span>
                        <span className="font-mono font-bold text-[var(--text)]" dir="ltr">{result.trackingCode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--muted)]">تاریخ:</span>
                        <span className="font-mono text-[var(--text)]">{result.dateTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-center">
                    <div className="bg-white p-1 rounded inline-block">
                      <svg width="56" height="56" viewBox="0 0 21 21" shapeRendering="crispEdges">
                        {generateQRPattern(result.receiptHash).map((row, y) =>
                          row.map((filled, x) =>
                            filled ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" /> : null
                          )
                        )}
                      </svg>
                    </div>
                    <div className="text-[7px] text-[var(--muted)] mt-1">اسکن برای استعلام</div>
                  </div>
                </div>
              </div>

              <div className="relative p-3 border-b border-[var(--border)] bg-[var(--panel-2)]/20">
                <div className="text-[7.5px] font-bold text-[var(--gold)] uppercase tracking-wider mb-1">دریافت‌کننده</div>
                <div className="text-[11px] font-bold">{user?.firstName} {user?.lastName}</div>
                <div className="text-[9px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">{user?.nationalId || "—"}</div>
              </div>

              <div className="relative p-4 text-center border-b border-[var(--border)] bg-[var(--gold)]/5">
                <div className="text-[9px] text-[var(--muted)] mb-1">{result.assetLabel}</div>
                <div className="text-3xl font-black text-[var(--gold)]">
                  {toFa(result.amount.toFixed(result.unit === "گرم" ? 4 : 0))}
                  <span className="text-sm font-normal text-[var(--muted)] mr-1">{result.unit}</span>
                </div>
              </div>

              <div className="relative p-3 space-y-1.5 text-[10px] border-b border-[var(--border)]">
                {result.locationName && (
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--muted)]">مکان</span>
                    <div className="text-left">
                      <div className="font-bold">{result.locationName}</div>
                      <div className="text-[9px] text-[var(--muted)] mt-0.5">{result.locationAddress}</div>
                      {result.locationPhone && <div className="text-[9px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">{result.locationPhone}</div>}
                    </div>
                  </div>
                )}
                {result.courierAddress && (
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--muted)]">آدرس</span>
                    <div className="text-left text-[9px] leading-relaxed max-w-[65%]">{result.courierAddress}</div>
                  </div>
                )}
                {result.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">شماره سریال</span>
                    <span className="font-mono font-bold text-sky-400 text-[9.5px]" dir="ltr">{result.serialNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">ثبت مالکیت</span>
                  <span className={result.registeredOwnership ? "text-emerald-400 font-bold" : "text-[var(--muted)]"}>
                    {result.registeredOwnership ? "✓ ثبت شده" : "— ثبت نشده"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">کسر از موجودی</span>
                  <span className="font-bold text-[var(--gold)]">
                    {toFa(result.totalAssetDeducted.toFixed(result.unit === "گرم" ? 3 : 0))} {result.unit}
                  </span>
                </div>
                {result.totalCashFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">هزینه نقدی</span>
                    <span className="text-amber-400">{format(result.totalCashFee)} تومان</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-[var(--border)]">
                  <div className="text-[var(--muted)] mb-0.5">توضیحات:</div>
                  <div className="bg-[var(--panel-2)] rounded p-1.5 text-[9.5px] leading-relaxed">{result.note}</div>
                </div>
              </div>

              <div className="relative p-3 bg-[var(--panel-2)] border-t-2 border-[var(--gold)]/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">🔍</span>
                  <span className="text-[10px] font-bold text-[var(--gold)]">قابل استعلام</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[8.5px] text-[var(--muted)] mb-0.5">کد استعلام</div>
                    <div className="font-mono text-[11px] font-black text-[var(--gold)] tracking-wider bg-[var(--bg)] border border-[var(--gold)]/30 rounded px-2 py-1 text-center" dir="ltr">
                      {result.verificationCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8.5px] text-[var(--muted)] mb-0.5">لینک استعلام</div>
                    <div className="text-[9px] font-mono text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 truncate" dir="ltr">
                      kifzargar.com/verify/{result.trackingCode}
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-[7.5px] font-bold text-emerald-400">امضای دیجیتال</span>
                  </div>
                  <span className="text-[8px] text-[var(--muted)] font-mono" dir="ltr">
                    {result.receiptHash.slice(0, 16)}…
                  </span>
                </div>
              </div>

              <div className="relative border-t-2 border-dashed border-[var(--gold)]/30 bg-gradient-to-b from-transparent to-[var(--gold)]/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 text-[8px] text-[var(--muted)] leading-relaxed">
                    ⚠️ هرگونه تغییر در این رسید، با اسکن QR یا استعلام کد قابل تشخیص است.
                  </div>
                  <div className="shrink-0 w-20 h-14 rounded border border-dashed border-[var(--gold)]/30 flex flex-col items-center justify-center bg-[var(--bg)]/30">
                    <div className="text-[7px] font-black text-[var(--gold)]/50 leading-tight">KIFE ZARGAR</div>
                    <div className="text-[6px] text-[var(--gold)]/40 mt-0.5">مهر رسمی</div>
                  </div>
                </div>
              </div>
            </div>

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
              <h3 className="font-bold text-sm">
                انتخاب {delivery === "branch" ? "شعبه" : "نمایندگی"}
              </h3>
              <button
                onClick={() => setShowLocationPicker(false)}
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
              {filteredLocations.length === 0 && (
                <div className="text-center py-8 text-[11px] text-[var(--muted)]">
                  موردی یافت نشد
                </div>
              )}
              {filteredLocations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => { setSelectedLocation(loc); setShowLocationPicker(false); }}
                  className={`w-full flex items-start gap-2.5 p-3 rounded-xl border transition text-right ${
                    selectedLocation?.id === loc.id
                      ? "border-[var(--gold)] bg-[var(--gold)]/10"
                      : "border-[var(--border)] hover:bg-[var(--panel-2)]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-base shrink-0">
                    {loc.type === "branch" ? "🏛" : "🏪"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold">{loc.city} · {loc.name}</span>
                      {loc.rating && (
                        <span className="text-[8.5px] text-amber-400">⭐ {toFa(String(loc.rating))}</span>
                      )}
                    </div>
                    <div className="text-[9.5px] text-[var(--muted)] mt-0.5 truncate">{loc.address}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[8.5px] text-[var(--muted)]">
                      <span>🕐 {loc.hours}</span>
                      {loc.stock && <span className="text-emerald-400">• {loc.stock}</span>}
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