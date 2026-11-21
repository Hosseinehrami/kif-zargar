"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, toFa, toEnDigits } from "@/lib/format";
import { SETTINGS } from "@/lib/settings";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Modal";

// ═══════════════════════════════════════════════════════════════
// 📌 ثابت‌ها
// ═══════════════════════════════════════════════════════════════
const SPREAD_PERCENT = 0.0005;
const MAINTENANCE_MARGIN = 0.005;
const FEE_RATE = 0.001;
const FUNDING_RATE = 0.0001;
const MESGHAL_PRICE_INITIAL = 82_650_000;

// ═══════════════════════════════════════════════════════════════
// 📌 تایپ‌ها
// ═══════════════════════════════════════════════════════════════
type Side = "long" | "short";
type MarginMode = "cross" | "isolated";
type OrderType = "market" | "limit";
type BottomTab = "positions" | "orders" | "history";
type FundingType = "اجاره" | "بلوکه";

type Position = {
  id: string;
  pair: string;
  mode: string;
  side: Side;
  leverage: number;
  size: number; // گرم
  entry: number; // تومان به ازای هر گرم
  markPrice: number; // تومان به ازای هر گرم
  liqPrice: number;
  marginGold: number; // گرم
  valueGold: number; // گرم
  fundingType: FundingType;
  fundingAmountGold: number;
  fundingRate: number;
  fundingStatus: string;
};

type TradeCalc = {
  entryPrice: number;
  positionSizeGold: number;
  positionValueToman: number;
  feeGold: number;
  fundingFeeGold: number;
  liqPrice: number;
  isFundingLong: boolean;
};

// ═══════════════════════════════════════════════════════════════
// 📌 دیتای Mock (بعداً از API جایگزین می‌شه)
// ═══════════════════════════════════════════════════════════════
const MOCK_POSITIONS: Position[] = [
  {
    id: "p1",
    pair: "طلا / تومان",
    mode: "کل موجودی",
    side: "long",
    leverage: 10,
    size: 5.0,
    entry: 19_000_000,
    markPrice: 19_120_000,
    liqPrice: 17_267_400,
    marginGold: 0.5,
    valueGold: 5.0,
    fundingType: "اجاره",
    fundingAmountGold: 0.0012,
    fundingRate: 0.01,
    fundingStatus: "معاف (روز اول)",
  },
];

// ═══════════════════════════════════════════════════════════════
// 📌 Helper: محاسبه PnL و ROE از روی price
// ═══════════════════════════════════════════════════════════════
function computePnl(p: Position) {
  const direction = p.side === "long" ? 1 : -1;
  const priceDiff = p.markPrice - p.entry;
  const pnlToman = direction * priceDiff * p.size;
  const pnlGold = p.markPrice > 0 ? pnlToman / p.markPrice : 0;
  const marginToman = p.marginGold * p.entry;
  const roe = marginToman > 0 ? (pnlToman / marginToman) * 100 : 0;
  return { pnlToman, pnlGold, roe };
}

const generateOrderBook = (basePrice: number) => {
  const asks = []; const bids = [];
  let askTotal = 0; let bidTotal = 0;

  for (let i = 0; i < 6; i++) {
    const askPrice = basePrice + (i + 1) * 10_000;
    const askAmount = Math.random() * 2 + 0.1;
    askTotal += askAmount;
    asks.push({ price: askPrice, amount: askAmount, total: askTotal });

    const bidPrice = basePrice - (i + 1) * 10_000;
    const bidAmount = Math.random() * 2 + 0.1;
    bidTotal += bidAmount;
    bids.push({ price: bidPrice, amount: bidAmount, total: bidTotal });
  }

  return { asks: asks.reverse(), bids, maxTotal: Math.max(askTotal, bidTotal) };
};

const sanitizeNumeric = (val: string, isDecimal = true) => {
  const en = toEnDigits(val);
  const cleaned = isDecimal ? en.replace(/[^\d.]/g, "") : en.replace(/\D/g, "");
  if (!isDecimal) return cleaned;
  const parts = cleaned.split(".");
  if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
  if (parts[1] && parts[1].length > 3) return parts[0] + "." + parts[1].slice(0, 3);
  return parts.join(".");
};

const formatWithCommas = (val: string) => {
  if (!val) return "";
  return Number(val).toLocaleString("en-US");
};

// ═══════════════════════════════════════════════════════════════
// 📌 کامپوننت خلاصه معامله
// ═══════════════════════════════════════════════════════════════
function TradeSummary({ side, orderType, collateralNum, calc }: { side: Side; orderType: OrderType; collateralNum: number; calc: TradeCalc; }) {
  if (collateralNum <= 0) return null;
  const isLong = side === "long";

  return (
    <div className={`rounded-xl border p-2.5 lg:p-4 text-[10.5px] lg:text-[12px] space-y-1.5 lg:space-y-2.5 h-fit shadow-lg shadow-black/10 lg:shadow-black/20 transition-all duration-300 ${isLong ? "border-[var(--green)]/40 bg-[var(--green)]/5" : "border-[var(--red)]/40 bg-[var(--red)]/5"}`}>
      <div className="flex justify-between items-center border-b border-[var(--border)] pb-1.5 lg:pb-2.5 mb-1 lg:mb-1.5">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <span className="font-bold text-[11px] lg:text-sm text-[var(--text)]">خلاصه معامله</span>
          <span className={`text-[8.5px] lg:text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${isLong ? "bg-[var(--green)] text-white border-[var(--green)]" : "bg-[var(--red)] text-white border-[var(--red)]"}`}>
            {isLong ? "خرید" : "فروش"}
          </span>
        </div>
        <span className="text-[8.5px] lg:text-[10px] bg-[var(--panel)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--muted)]">{orderType === "market" ? "بازار" : "محدود"}</span>
      </div>
      <div className="flex justify-between items-center"><span className="text-[var(--muted)]">حجم پوزیشن</span><span className="font-bold text-[11px] lg:text-[13px] font-mono">{toFa(calc.positionSizeGold.toFixed(3))} گرم</span></div>
      <div className="flex justify-between items-center"><span className="text-[var(--muted)]">ارزش پوزیشن</span><span className="font-bold text-[11px] lg:text-[13px] text-[var(--text)] font-mono">{format(calc.positionValueToman)} ت</span></div>
      <div className="flex justify-between items-center"><span className="text-[var(--muted)]">قیمت ورود</span><span className="font-bold text-[var(--text)] font-mono">{format(calc.entryPrice)} ت</span></div>
      <div className="flex justify-between items-center"><span className="text-[var(--muted)]">کارمزد</span><span className="text-[var(--red)] font-bold font-mono">{toFa(calc.feeGold.toFixed(4))} گرم</span></div>

      <div className="flex justify-between items-start border-t border-[var(--border)] pt-1.5 lg:pt-2.5 mt-1 lg:mt-2">
        <div className="flex flex-col">
          <span className="text-[var(--muted)] flex items-center gap-1.5 font-bold">{calc.isFundingLong ? "اجاره (خرید می‌دهد)" : "بلوکه (فروش می‌دهد)"}</span>
        </div>
        <span className={`${calc.isFundingLong ? "text-[var(--red)]" : "text-[var(--green)]"} font-bold text-[11px] lg:text-[13px] font-mono`}>{calc.isFundingLong ? "-" : "+"}{toFa(calc.fundingFeeGold.toFixed(4))} گرم</span>
      </div>

      <div className="flex justify-between items-center pt-1.5 lg:pt-2.5 border-t border-[var(--border)] mt-1">
        <span className="text-[var(--muted)] font-bold">قیمت لیکویید</span>
        <span className="text-[var(--red)] font-black text-[11px] lg:text-[14px] font-mono bg-[var(--red)]/10 px-1.5 py-0.5 rounded-lg border border-[var(--red)]/20">{format(calc.liqPrice)} ت</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📌 کامپوننت دکمه‌های درصد
// ═══════════════════════════════════════════════════════════════
function PercentButtons({ side, activePercent, setMarginPercent, disabled }: { side: Side, activePercent: number | null, setMarginPercent: (p: number) => void, disabled?: boolean }) {
  return (
    <div dir="ltr" className="grid grid-cols-4 gap-1.5 mt-1.5">
      {[25, 50, 75, 100].map((p) => {
        const isActive = activePercent === p;
        return (
          <button
            key={p}
            onClick={() => setMarginPercent(p)}
            disabled={disabled}
            className={`h-7 rounded-full text-[10px] font-bold border transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive
                ? side === "long"
                  ? "bg-[var(--green)] text-white border-[var(--green)] shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  : "bg-[var(--red)] text-white border-[var(--red)] shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                : "bg-[var(--panel-2)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)]/50"
            }`}
          >
            {toFa(String(p))}%
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📌 صفحه اصلی
// ═══════════════════════════════════════════════════════════════
export default function LeverageTradingPage() {
  const toast = useToast();
  const marketPrice = SETTINGS.fees.goldPrice;

  // ─── states اصلی ───
  const [side, setSide] = useState<Side>("long");
  const [marginMode, setMarginMode] = useState<MarginMode>("cross");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(10);
  const [collateralGold, setCollateralGold] = useState<string>("");
  const [activePercent, setActivePercent] = useState<number | null>(null);
  const [tpPrice, setTpPrice] = useState<string>("");
  const [slPrice, setSlPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("positions");

  // ─── state داده‌ها (از API میان) ───
  const [positions, setPositions] = useState<Position[]>(MOCK_POSITIONS);
  const [mesghalPrice, setMesghalPrice] = useState<number>(MESGHAL_PRICE_INITIAL);

  // ─── state های UI ───
  const [mobileTpSl, setMobileTpSl] = useState(false);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [showMarginDropdown, setShowMarginDropdown] = useState(false);
  const [showMarginExplanation, setShowMarginExplanation] = useState(false);

  // ─── state بستن ───
  const [closingPosition, setClosingPosition] = useState<Position | null>(null);
  const [isClosingPosition, setIsClosingPosition] = useState(false);
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
  const [isClosingAll, setIsClosingAll] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // 🔌 WebSocket / Live Prices (فعلاً mock با setInterval)
  // TODO: Replace with WebSocket connection
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const interval = setInterval(() => {
      // آپدیت قیمت مثقال (نوسان ± 0.3%)
      setMesghalPrice(prev => {
        const delta = (Math.random() - 0.5) * 0.006 * prev;
        return Math.round(prev + delta);
      });

      // آپدیت markPrice پوزیشن‌ها (نوسان ± 0.2%)
      setPositions(prev =>
        prev.map(p => ({
          ...p,
          markPrice: Math.round(p.markPrice + (Math.random() - 0.5) * 0.004 * p.markPrice),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 📊 محاسبات فرم
  // ═══════════════════════════════════════════════════════════════
  const collateralNum = Number(collateralGold) || 0;
  const userTotalGold = 12.45;

  const calc = useMemo<TradeCalc>(() => {
    const baseEntryPrice = orderType === "limit" && Number(limitPrice) > 0 ? Number(limitPrice) : marketPrice;
    const entryPrice = side === "long" ? baseEntryPrice * (1 + SPREAD_PERCENT) : baseEntryPrice * (1 - SPREAD_PERCENT);
    const positionSizeGold = collateralNum * leverage;
    const positionValueToman = positionSizeGold * entryPrice;
    const feeToman = positionValueToman * FEE_RATE;
    const feeGold = feeToman / entryPrice;
    const fundingFeeGold = (positionValueToman * FUNDING_RATE) / entryPrice;
    const effectiveMargin = marginMode === "cross" ? collateralNum + userTotalGold : collateralNum;
    const liqPrice = side === "long"
      ? entryPrice * (1 - (effectiveMargin / positionSizeGold) + MAINTENANCE_MARGIN)
      : entryPrice * (1 + (effectiveMargin / positionSizeGold) - MAINTENANCE_MARGIN);
    return { entryPrice, positionSizeGold, positionValueToman, feeGold, fundingFeeGold, liqPrice, isFundingLong: side === "long" };
  }, [collateralNum, leverage, side, marketPrice, marginMode, userTotalGold, orderType, limitPrice]);

  const isValid = collateralNum >= 0.1;
  const orderBook = useMemo(() => generateOrderBook(marketPrice), [marketPrice]);

  // ═══════════════════════════════════════════════════════════════
  // 🎯 Handlers فرم
  // ═══════════════════════════════════════════════════════════════
  const handleSetSide = (newSide: Side) => {
    setSide(newSide);
    setActivePercent(null);
  };

  const handleSetMarginMode = (mode: MarginMode) => {
    setMarginMode(mode);
    setShowMarginDropdown(false);
    setShowMarginExplanation(true);
  };

  const setMarginPercent = useCallback((percent: number) => {
    const amount = (userTotalGold * percent) / 100;
    setCollateralGold(amount.toFixed(3));
    setActivePercent(percent);
  }, [userTotalGold]);

  const handleCollateralChange = (val: string) => {
    setCollateralGold(sanitizeNumeric(val));
    setActivePercent(null);
  };

  const handleIncreaseQty = () => {
    const val = Math.min(userTotalGold, collateralNum + 0.1);
    setCollateralGold(val.toFixed(3));
    setActivePercent(null);
  };

  const handleDecreaseQty = () => {
    const val = Math.max(0, collateralNum - 0.1);
    setCollateralGold(val.toFixed(3));
    setActivePercent(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔌 ثبت سفارش (Mock API)
  // TODO: POST /api/trade/order
  // ═══════════════════════════════════════════════════════════════
  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // TODO: const res = await fetch("/api/trade/order", { method: "POST", ... });
      // TODO: const data = await res.json();
      // TODO: setPositions(prev => [data.position, ...prev]);

      await new Promise(r => setTimeout(r, 800));

      toast.success(`سفارش ${side === "long" ? "خرید" : "فروش"} با موفقیت ثبت شد`);

      // ریست فرم
      setCollateralGold("");
      setActivePercent(null);
      setLimitPrice("");
      setTpPrice("");
      setSlPrice("");
      setMobileTpSl(false);
    } catch {
      toast.error("خطا در ثبت سفارش");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔌 بستن یک پوزیشن (Mock API)
  // TODO: POST /api/trade/positions/:id/close
  // ═══════════════════════════════════════════════════════════════
  const handleConfirmClose = async () => {
    if (!closingPosition) return;
    setIsClosingPosition(true);
    try {
      // TODO: await fetch(`/api/trade/positions/${closingPosition.id}/close`, { method: "POST" });
      await new Promise(r => setTimeout(r, 800));

      setPositions(prev => prev.filter(p => p.id !== closingPosition.id));
      toast.success(`پوزیشن ${closingPosition.pair} با موفقیت بسته شد`);
      setClosingPosition(null);
    } catch {
      toast.error("خطا در بستن پوزیشن");
    } finally {
      setIsClosingPosition(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔌 بستن همه پوزیشن‌ها (Mock API)
  // TODO: POST /api/trade/positions/close-all
  // ═══════════════════════════════════════════════════════════════
  const handleConfirmCloseAll = async () => {
    setIsClosingAll(true);
    try {
      // TODO: await fetch("/api/trade/positions/close-all", { method: "POST" });
      await new Promise(r => setTimeout(r, 800));

      setPositions([]);
      toast.success("همه پوزیشن‌ها با موفقیت بسته شدند");
      setShowCloseAllConfirm(false);
    } catch {
      toast.error("خطا در بستن همه پوزیشن‌ها");
    } finally {
      setIsClosingAll(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🖥️ RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 💻 DESKTOP VERSION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex h-[calc(100dvh-130px)] flex-col bg-[var(--bg)] text-[var(--text)] font-sans" dir="rtl">

        {/* هدر قیمت */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] bg-[var(--panel)] shrink-0 h-11">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">طلا / تومان</span>
              <span className="text-[9px] text-[var(--muted)]">XAU/IRT</span>
            </div>
            <div className="flex items-center gap-2 border-r border-[var(--border)] pr-3">
              <span className="text-sm font-black text-[var(--green)] font-mono">{format(marketPrice)}</span>
              <span className="text-[9px] text-[var(--green)] bg-[var(--green)]/10 px-1.5 py-0.5 rounded font-mono">+۲.۴۵٪</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden">
          {/* دفتر سفارشات */}
          <div className="flex w-[260px] border-l border-[var(--border)] flex-col shrink-0 bg-[var(--panel)]">
            <div className="grid grid-cols-3 text-[8.5px] text-[var(--muted)] p-1 bg-[var(--panel-2)] border-b border-[var(--border)]">
              <span className="text-right">قیمت</span><span className="text-center">مقدار</span><span className="text-left">جمع</span>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              {orderBook.asks.map((ask, i) => (
                <div key={i} onClick={() => { setOrderType("limit"); setLimitPrice(String(ask.price)); }} className="relative grid grid-cols-3 px-2 py-[3px] text-[9.5px] cursor-pointer hover:bg-white/5 transition">
                  <div className="absolute inset-y-0 right-0 bg-[var(--red)]/10" style={{ width: `${(ask.total / orderBook.maxTotal) * 100}%` }} />
                  <span className="text-[var(--red)] text-right z-10 font-mono">{format(ask.price)}</span>
                  <span className="text-[var(--text)] text-center z-10 font-mono" dir="ltr">{toFa(ask.amount.toFixed(3))}</span>
                  <span className="text-[var(--muted)] text-left z-10 font-mono" dir="ltr">{toFa(ask.total.toFixed(2))}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 px-2 py-1 bg-[var(--panel-2)] border-y border-[var(--border)] items-center">
              <span className="text-[12px] font-black text-[var(--green)] text-right font-mono">{format(marketPrice)}</span>
              <span className="text-[8px] text-[var(--muted)] text-center">اسپرد</span>
              <span className="text-[9px] text-[var(--muted)] text-left font-mono" dir="ltr">۲۰,۰۰۰</span>
            </div>
            <div className="flex-1 flex flex-col">
              {orderBook.bids.map((bid, i) => (
                <div key={i} onClick={() => { setOrderType("limit"); setLimitPrice(String(bid.price)); }} className="relative grid grid-cols-3 px-2 py-[3px] text-[9.5px] cursor-pointer hover:bg-white/5 transition">
                  <div className="absolute inset-y-0 right-0 bg-[var(--green)]/10" style={{ width: `${(bid.total / orderBook.maxTotal) * 100}%` }} />
                  <span className="text-[var(--green)] text-right z-10 font-mono">{format(bid.price)}</span>
                  <span className="text-[var(--text)] text-center z-10 font-mono" dir="ltr">{toFa(bid.amount.toFixed(3))}</span>
                  <span className="text-[var(--muted)] text-left z-10 font-mono" dir="ltr">{toFa(bid.total.toFixed(2))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* فرم */}
          <div className="w-[360px] shrink-0 flex flex-col overflow-y-auto p-2 border-l border-[var(--border)]">
            <div className="flex justify-between items-center text-[10px] mb-1.5 bg-[var(--panel-2)] p-2 rounded border border-[var(--border)]">
              <div className="flex flex-col"><span className="text-[var(--muted)]">موجودی کیف:</span><span className="font-bold text-[var(--text)] font-mono">{toFa(userTotalGold.toString())} گرم</span></div>
              <div className="flex flex-col border-r border-[var(--border)] pr-2 text-left"><span className="text-[var(--muted)]">ارزش خالص:</span><span className="font-bold text-[var(--green)] font-mono">{toFa(userTotalGold.toString())} گرم</span></div>
            </div>

            <div className="mb-2">
              <div className="flex gap-1 bg-[var(--panel-2)] p-0.5 rounded border border-[var(--border)] h-7">
                <button onClick={() => handleSetMarginMode("cross")} className={`flex-1 text-[10px] font-bold rounded-sm ${marginMode === "cross" ? "bg-[var(--panel)] text-[var(--gold)] shadow-sm" : "text-[var(--muted)]"}`}>کل موجودی</button>
                <button onClick={() => handleSetMarginMode("isolated")} className={`flex-1 text-[10px] font-bold rounded-sm ${marginMode === "isolated" ? "bg-[var(--panel)] text-[var(--gold)] shadow-sm" : "text-[var(--muted)]"}`}>مبلغ معامله</button>
              </div>
              <div className="mt-1 text-[9px] text-[var(--muted)] leading-relaxed bg-[var(--panel-2)] p-1.5 rounded border border-[var(--border)]">
                {marginMode === "cross"
                  ? "در این حالت تمام طلای شما به عنوان وجه تضمین پشتیبان پوزیشن است (ریسک کمتر)."
                  : "در این حالت فقط مقدار وارد شده در کادر وجه تضمین در خطر است (ریسک بیشتر)."}
              </div>
            </div>

            <div className="flex gap-1.5 mb-2">
              <button onClick={() => handleSetSide("long")} disabled={isSubmitting} className={`flex-1 h-8 rounded font-bold text-[11px] transition disabled:opacity-50 ${side === "long" ? "bg-[var(--green)] text-white shadow-md shadow-[var(--green)]/20" : "bg-[var(--panel-2)] text-[var(--muted)]"}`}>خرید</button>
              <button onClick={() => handleSetSide("short")} disabled={isSubmitting} className={`flex-1 h-8 rounded font-bold text-[11px] transition disabled:opacity-50 ${side === "short" ? "bg-[var(--red)] text-white shadow-md shadow-[var(--red)]/20" : "bg-[var(--panel-2)] text-[var(--muted)]"}`}>فروش</button>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-[10px] mb-1"><span className="text-[var(--muted)]">اهرم</span><span className="font-bold text-[var(--gold)] font-mono">{toFa(String(leverage))}x</span></div>
              <input type="range" min="1" max="20" step="1" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} disabled={isSubmitting} className="w-full h-1 accent-[var(--gold)]" dir="ltr" />
            </div>

            <div className="mb-2">
              <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} disabled={isSubmitting} className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 text-[10px] outline-none text-[var(--text)] focus:border-[var(--gold)]">
                <option value="market">نوع سفارش: بازار</option><option value="limit">نوع سفارش: محدود</option>
              </select>
            </div>

            {orderType === "limit" && (
              <div className="mb-2">
                <div className="relative flex items-center bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 focus-within:border-[var(--gold)]">
                  <input
                    type="text"
                    dir="ltr"
                    value={formatWithCommas(limitPrice)}
                    onChange={(e) => setLimitPrice(sanitizeNumeric(e.target.value, false))}
                    placeholder={`قیمت ورود`}
                    className="w-full bg-transparent text-left text-[11px] font-mono outline-none placeholder:text-[var(--muted)]"
                  />
                  <span className="text-[9px] text-[var(--muted)] mr-1.5 border-r border-[var(--border)] pr-1.5">تومان</span>
                </div>
              </div>
            )}

            <div className="mb-2">
              <div className="flex justify-between text-[10px] mb-1"><span className="text-[var(--muted)]">وجه تضمین (طلا)</span><span className="text-[var(--muted)] text-[9px]">حداقل: ۰.۱ گرم</span></div>
              <div className="relative flex items-center bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 focus-within:border-[var(--gold)]">
                <input type="text" dir="ltr" value={collateralGold} onChange={(e) => handleCollateralChange(e.target.value)} placeholder="0.000" className="w-full bg-transparent text-left text-[12px] font-bold font-mono outline-none placeholder:text-[var(--muted)]" />
                <span className="text-[9px] text-[var(--muted)] mr-1.5 border-r border-[var(--border)] pr-1.5">گرم</span>
              </div>
              <PercentButtons side={side} activePercent={activePercent} setMarginPercent={setMarginPercent} disabled={isSubmitting} />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="relative flex items-center bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 focus-within:border-[var(--green)]">
                  <input type="text" dir="ltr" value={formatWithCommas(tpPrice)} onChange={(e) => setTpPrice(sanitizeNumeric(e.target.value, false))} placeholder="حد سود" className="w-full bg-transparent text-left text-[10px] font-mono outline-none placeholder:text-[var(--muted)]" />
                  <span className="text-[8px] text-[var(--muted)] mr-1 border-r border-[var(--border)] pr-1">ت</span>
                </div>
              </div>
              <div>
                <div className="relative flex items-center bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 focus-within:border-[var(--red)]">
                  <input type="text" dir="ltr" value={formatWithCommas(slPrice)} onChange={(e) => setSlPrice(sanitizeNumeric(e.target.value, false))} placeholder="حد ضرر" className="w-full bg-transparent text-left text-[10px] font-mono outline-none placeholder:text-[var(--muted)]" />
                  <span className="text-[8px] text-[var(--muted)] mr-1 border-r border-[var(--border)] pr-1">ت</span>
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={!isValid || isSubmitting} className={`w-full h-9 rounded font-bold text-[11px] text-white transition ${side === "long" ? "bg-[var(--green)] hover:bg-[var(--green)]/90" : "bg-[var(--red)] hover:bg-[var(--red)]/90"} disabled:opacity-50`}>
              {isSubmitting ? "در حال ارسال..." : `ثبت سفارش`}
            </button>
          </div>

          {/* خلاصه */}
          <div className="flex flex-col w-[320px] shrink-0 bg-[var(--bg)] p-3 overflow-y-auto border-r border-[var(--border)]">
            <TradeSummary side={side} orderType={orderType} collateralNum={collateralNum} calc={calc} />
          </div>
          <div className="flex flex-1 bg-[var(--bg)]"></div>
        </div>

        {/* پایین دسکتاپ */}
        <div className="h-[240px] border-t border-[var(--border)] bg-[var(--panel)] flex flex-col shrink-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-1">
            <div className="flex">
              <button onClick={() => setBottomTab("positions")} className={`px-3 py-2 text-[10px] font-bold border-b-2 transition ${bottomTab === "positions" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--muted)]"}`}>پوزیشن‌های باز ({toFa(String(positions.length))})</button>
              <button onClick={() => setBottomTab("orders")} className={`px-3 py-2 text-[10px] font-bold border-b-2 transition ${bottomTab === "orders" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--muted)]"}`}>سفارشات (۰)</button>
              <button onClick={() => setBottomTab("history")} className={`px-3 py-2 text-[10px] font-bold border-b-2 transition ${bottomTab === "history" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--muted)]"}`}>تاریخچه معاملات</button>
            </div>
            {positions.length > 0 && bottomTab === "positions" && (
              <button onClick={() => setShowCloseAllConfirm(true)} className="text-[9px] text-[var(--red)] border border-[var(--red)]/30 bg-[var(--red)]/10 px-2 py-1 rounded hover:bg-[var(--red)]/20 transition">بستن همه</button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-1">
            <div className="min-w-[750px]">
              {bottomTab === "positions" && (
                <>
                  {positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[180px] text-[11px] text-[var(--muted)]">
                      <div className="text-3xl mb-2 opacity-50">📭</div>
                      پوزیشن بازی ندارید
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-9 text-[9px] text-[var(--muted)] px-2 py-1.5 bg-[var(--panel-2)] rounded-t"><span>جفت‌ارز</span><span>حالت</span><span>جهت</span><span>اهرم</span><span>حجم (گرم)</span><span>ورود</span><span>سود/زیان</span><span>اجاره/بلوکه</span><span>عملیات</span></div>
                      {positions.map((p) => {
                        const pnl = computePnl(p);
                        return (
                          <div key={p.id} className="grid grid-cols-9 items-center text-[10px] px-2 py-2 border-b border-[var(--border)] hover:bg-[var(--panel-2)] transition">
                            <span className="font-bold">{p.pair}</span>
                            <span className="text-[var(--gold)] text-[9px]">{p.mode}</span>
                            <span className={p.side === "long" ? "text-[var(--green)] font-bold" : "text-[var(--red)] font-bold"}>{p.side === "long" ? "خرید" : "فروش"}</span>
                            <span className="bg-[var(--panel)] border border-[var(--border)] rounded px-1 py-0.5 w-fit text-[9px] font-mono">{toFa(String(p.leverage))}x</span>
                            <span className="font-mono">{toFa(p.size.toFixed(3))}</span>
                            <span className="font-mono">{format(p.entry)}</span>
                            <span className={`font-bold font-mono ${pnl.pnlGold >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                              {pnl.pnlGold >= 0 ? "+" : ""}{toFa(pnl.pnlGold.toFixed(3))}
                            </span>
                            <span className="text-[8.5px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 w-fit">⏳ {p.fundingStatus}</span>
                            <div className="flex gap-2">
                              <button onClick={() => setClosingPosition(p)} className="text-[var(--gold)] hover:underline">بستن</button>
                              <button className="text-[var(--muted)] hover:text-white">حد سود/ضرر</button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📱 MOBILE VERSION - SCROLLABLE LAYOUT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className="lg:hidden flex flex-col h-[calc(100dvh-245px)] min-h-0 overflow-y-auto overflow-x-hidden bg-[var(--bg)] text-[var(--text)] font-sans relative z-[100]"
        dir="rtl"
      >

        {/* هدر موبایل */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--border)] bg-[var(--panel)] shrink-0 h-11 relative z-20">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                onClick={() => setShowMarginDropdown(!showMarginDropdown)}
                className="flex items-center justify-between gap-1 border border-[var(--border)] rounded-lg px-2 h-8 bg-[var(--panel-2)] hover:bg-[var(--panel)] transition text-[10px] font-bold text-[var(--text)] w-[110px]"
              >
                <span className="truncate">
                  {marginMode === "cross" ? "کل موجودی" : "مبلغ معامله"}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" className="shrink-0">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showMarginDropdown && (
                <div className="absolute top-full mt-1 right-0 w-full bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-xl z-[60] overflow-hidden">
                  <button
                    onClick={() => handleSetMarginMode("cross")}
                    className={`w-full text-right px-3 py-2 text-[10px] border-b border-[var(--border)] ${
                      marginMode === "cross"
                        ? "text-[var(--gold)] font-bold bg-[var(--panel-2)]"
                        : "text-[var(--text)]"
                    }`}
                  >
                    کل موجودی
                  </button>
                  <button
                    onClick={() => handleSetMarginMode("isolated")}
                    className={`w-full text-right px-3 py-2 text-[10px] ${
                      marginMode === "isolated"
                        ? "text-[var(--gold)] font-bold bg-[var(--panel-2)]"
                        : "text-[var(--text)]"
                    }`}
                  >
                    مبلغ معامله
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLeverageModal(true)}
              className="flex items-center justify-between gap-1 border border-[var(--border)] rounded-lg px-1.5 h-8 bg-[var(--panel-2)] hover:bg-[var(--panel)] transition text-[10px] font-bold text-[var(--text)] w-[60px]"
            >
              <span>{toFa(String(leverage))}x</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" className="shrink-0">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-start justify-center">
            <span className="text-[9px] text-[var(--muted)] font-bold leading-none mb-1">
              مثقال طلا
            </span>
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[11px] font-black text-[var(--green)] font-mono">
                {format(mesghalPrice)}
              </span>
              <span className="text-[8px] font-bold text-[var(--green)] bg-[var(--green)]/10 px-1 py-0.5 rounded">
                +۰.۳٪
              </span>
            </div>
          </div>
        </div>

        {/* بدنه اصلی موبایل */}
        <div className="flex flex-row items-start shrink-0">

          {/* فرم سفارش */}
          <div className="w-[55%] flex flex-col bg-[var(--bg)] p-1.5 border-l border-[var(--border)]">

            <div className="flex bg-[var(--panel-2)] rounded p-[2px] mb-2">
              <button
                onClick={() => handleSetSide("long")}
                disabled={isSubmitting}
                className={`flex-1 py-1 text-[10.5px] font-bold rounded-sm transition disabled:opacity-50 ${
                  side === "long"
                    ? "bg-[var(--green)] text-white shadow"
                    : "text-[var(--muted)]"
                }`}
              >
                خرید
              </button>
              <button
                onClick={() => handleSetSide("short")}
                disabled={isSubmitting}
                className={`flex-1 py-1 text-[10.5px] font-bold rounded-sm transition disabled:opacity-50 ${
                  side === "short"
                    ? "bg-[var(--red)] text-white shadow"
                    : "text-[var(--muted)]"
                }`}
              >
                فروش
              </button>
            </div>

            {/* نوع سفارش */}
            <div className="mb-1.5 relative">
              <div className="bg-[var(--panel-2)] rounded flex items-center justify-between px-2 py-1.5">
                <span className="text-[10.5px] text-[var(--text)]">
                  {orderType === "limit" ? "محدود" : "بازار"}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                disabled={isSubmitting}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                <option value="limit">محدود</option>
                <option value="market">بازار</option>
              </select>
            </div>

            {/* قیمت سفارش محدود */}
            {orderType === "limit" && (
              <div className="mb-1.5">
                <div className="bg-[var(--panel-2)] rounded flex items-center px-1 py-0.5 relative">
                  <button
                    aria-label="کاهش قیمت"
                    onClick={() => setLimitPrice(String(Math.max(0, Number(limitPrice) - 10000)))}
                    className="w-7 h-7 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] text-base"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    dir="ltr"
                    value={formatWithCommas(limitPrice)}
                    onChange={(e) => setLimitPrice(sanitizeNumeric(e.target.value, false))}
                    className="w-full bg-transparent text-center text-[12px] text-[var(--text)] font-mono outline-none placeholder:text-[var(--muted)] placeholder:text-[10px]"
                    placeholder="قیمت"
                  />
                  <span className="absolute left-7 text-[9px] text-[var(--muted)]">ت</span>
                  <button
                    aria-label="افزایش قیمت"
                    onClick={() => setLimitPrice(String(Number(limitPrice) + 10000))}
                    className="w-7 h-7 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] text-base"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* مقدار وجه تضمین */}
            <div className="mb-1.5">
              <div className="bg-[var(--panel-2)] rounded flex items-center px-1 py-0.5">
                <button
                  aria-label="کاهش مقدار"
                  onClick={handleDecreaseQty}
                  className="w-7 h-7 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] text-base"
                >
                  -
                </button>
                <input
                  type="text"
                  dir="ltr"
                  value={collateralGold}
                  onChange={(e) => handleCollateralChange(e.target.value)}
                  placeholder="مقدار"
                  className="w-full bg-transparent text-center text-[12px] text-[var(--text)] font-mono outline-none placeholder:text-[var(--muted)] placeholder:text-[10px]"
                />
                <button
                  aria-label="افزایش مقدار"
                  onClick={handleIncreaseQty}
                  className="w-7 h-7 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] text-base"
                >
                  +
                </button>
              </div>
            </div>

            <PercentButtons
              side={side}
              activePercent={activePercent}
              setMarginPercent={setMarginPercent}
              disabled={isSubmitting}
            />

            {/* حد سود و ضرر */}
            <label className="flex items-center gap-1.5 mb-1.5 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mobileTpSl}
                onChange={(e) => setMobileTpSl(e.target.checked)}
                className="w-3 h-3 rounded border-[var(--border)] bg-[var(--panel-2)] accent-[var(--gold)]"
              />
              <span className="text-[9.5px] text-[var(--text)]">
                حد سود / حد ضرر (TP/SL)
              </span>
            </label>

            {mobileTpSl && (
              <div className="grid grid-cols-2 gap-1.5 mb-2 fade-in">
                <div>
                  <div className="relative bg-[var(--panel-2)] rounded flex items-center px-1.5 py-1 border border-[var(--border)] focus-within:border-[var(--green)] transition">
                    <input
                      type="text"
                      dir="ltr"
                      value={formatWithCommas(tpPrice)}
                      onChange={(e) => setTpPrice(sanitizeNumeric(e.target.value, false))}
                      placeholder="TP"
                      className="w-full bg-transparent text-center text-[9.5px] text-[var(--text)] font-mono outline-none placeholder:text-[var(--muted)]"
                    />
                    <span className="absolute left-1.5 text-[8px] text-[var(--muted)]">ت</span>
                  </div>
                </div>
                <div>
                  <div className="relative bg-[var(--panel-2)] rounded flex items-center px-1.5 py-1 border border-[var(--border)] focus-within:border-[var(--red)] transition">
                    <input
                      type="text"
                      dir="ltr"
                      value={formatWithCommas(slPrice)}
                      onChange={(e) => setSlPrice(sanitizeNumeric(e.target.value, false))}
                      placeholder="SL"
                      className="w-full bg-transparent text-center text-[9.5px] text-[var(--text)] font-mono outline-none placeholder:text-[var(--muted)]"
                    />
                    <span className="absolute left-1.5 text-[8px] text-[var(--muted)]">ت</span>
                  </div>
                </div>
              </div>
            )}

            {/* موجودی */}
            <div className="flex flex-col gap-0.5 text-[8.5px] text-[var(--muted)] mb-1.5">
              <div className="flex justify-between">
                <span>موجودی:</span>
                <span className="text-[var(--text)] font-mono">
                  {toFa(userTotalGold.toString())} گرم
                </span>
              </div>
              <div className="flex justify-between">
                <span>بهترین خرید:</span>
                <span className="text-[var(--green)] font-mono">
                  {format(marketPrice - 10000)}
                </span>
              </div>
            </div>

            {/* خلاصه معامله */}
            <div className="mb-2">
              <TradeSummary
                side={side}
                orderType={orderType}
                collateralNum={collateralNum}
                calc={calc}
              />
            </div>

            {/* ثبت سفارش */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={`w-full py-2 rounded text-[12px] font-bold text-white transition shadow-lg ${
                side === "long"
                  ? "bg-[var(--green)] hover:bg-[var(--green)]/90"
                  : "bg-[var(--red)] hover:bg-[var(--red)]/90"
              } disabled:opacity-50`}
            >
              {isSubmitting ? "..." : side === "long" ? "خرید / Long" : "فروش / Short"}
            </button>
          </div>

          {/* دفتر سفارشات */}
          <div className="w-[45%] h-[360px] shrink-0 flex flex-col bg-[var(--bg)]">

            <div className="grid grid-cols-2 text-[8.5px] text-[var(--muted)] px-2 py-1 bg-[var(--panel)]">
              <span className="text-right">قیمت</span>
              <span className="text-left">مقدار</span>
            </div>

            <div className="flex-1 flex flex-col justify-end pb-1">
              {orderBook.asks.slice(0, 6).map((ask, i) => (
                <div key={i} className="relative grid grid-cols-2 px-1.5 py-[1px] text-[9.5px]">
                  <div
                    className="absolute inset-y-0 right-0 bg-[var(--red)]/10"
                    style={{ width: `${(ask.total / orderBook.maxTotal) * 100}%` }}
                  />
                  <span className="text-[var(--red)] text-right z-10 font-mono">
                    {format(ask.price)}
                  </span>
                  <span className="text-[var(--text)] text-left z-10 font-mono" dir="ltr">
                    {ask.amount.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-2 py-1 border-y border-[var(--border)] bg-[var(--panel)]">
              <div className="text-[13px] font-black text-[var(--green)] font-mono">
                {format(marketPrice)}
              </div>
              <div className="text-[8px] text-[var(--muted)] font-mono" dir="ltr">
                ≈ ${toFa("19200")}
              </div>
            </div>

            <div className="flex-1 flex flex-col pt-1">
              {orderBook.bids.slice(0, 6).map((bid, i) => (
                <div key={i} className="relative grid grid-cols-2 px-1.5 py-[1px] text-[9.5px]">
                  <div
                    className="absolute inset-y-0 right-0 bg-[var(--green)]/10"
                    style={{ width: `${(bid.total / orderBook.maxTotal) * 100}%` }}
                  />
                  <span className="text-[var(--green)] text-right z-10 font-mono">
                    {format(bid.price)}
                  </span>
                  <span className="text-[var(--text)] text-left z-10 font-mono" dir="ltr">
                    {bid.amount.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* بخش پایین صفحه: سفارشات، پوزیشن‌ها و تاریخچه */}
        {/* ═══════════════════════════════════════════════════════ */}

        <div className="flex flex-col border-t border-[var(--border)] bg-[var(--panel)] shrink-0 mt-2">

          {/* تب‌ها */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-2 bg-[var(--panel-2)] sticky top-0 z-10">
            <div className="flex gap-3">
              <button
                onClick={() => setBottomTab("orders")}
                className={`py-2 text-[10px] font-bold whitespace-nowrap transition ${
                  bottomTab === "orders"
                    ? "text-[var(--gold)] border-b-2 border-[var(--gold)]"
                    : "text-[var(--muted)] border-b-2 border-transparent"
                }`}
              >
                سفارشات باز (۰)
              </button>

              <button
                onClick={() => setBottomTab("positions")}
                className={`py-2 text-[10px] font-bold whitespace-nowrap transition ${
                  bottomTab === "positions"
                    ? "text-[var(--gold)] border-b-2 border-[var(--gold)]"
                    : "text-[var(--muted)] border-b-2 border-transparent"
                }`}
              >
                پوزیشن‌ها ({toFa(String(positions.length))})
              </button>

              <button
                onClick={() => setBottomTab("history")}
                className={`py-2 text-[10px] font-bold whitespace-nowrap transition ${
                  bottomTab === "history"
                    ? "text-[var(--gold)] border-b-2 border-[var(--gold)]"
                    : "text-[var(--muted)] border-b-2 border-transparent"
                }`}
              >
                تاریخچه
              </button>
            </div>

            {positions.length > 0 && bottomTab === "positions" && (
              <button
                onClick={() => setShowCloseAllConfirm(true)}
                className="text-[9px] text-[var(--red)] bg-[var(--red)]/10 px-2 py-1 rounded whitespace-nowrap"
              >
                بستن همه
              </button>
            )}
          </div>

          {/* محتوای تب‌ها */}
          <div className="p-2">

            {/* سفارشات باز */}
            {bottomTab === "orders" && (
              <div className="text-center py-8 text-[11px] text-[var(--muted)]">
                <div className="text-3xl mb-2 opacity-50">📭</div>
                سفارش بازی ندارید.
              </div>
            )}

            {/* پوزیشن‌های باز */}
            {bottomTab === "positions" && (
              <>
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-[var(--muted)]">
                    <div className="text-3xl mb-2 opacity-50">📭</div>
                    پوزیشن بازی ندارید.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {positions.map((p) => {
                      const pnl = computePnl(p);

                      return (
                        <div
                          key={p.id}
                          className="py-3 border-b border-[var(--border)] last:border-b-0"
                        >

                          {/* عنوان پوزیشن */}
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[var(--text)]">
                                {p.pair}
                              </span>

                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                p.side === "long"
                                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                                  : "bg-[var(--red)]/10 text-[var(--red)]"
                              }`}>
                                {p.side === "long" ? "خرید" : "فروش"} {toFa(String(p.leverage))}x
                              </span>
                            </div>

                            <button
                              onClick={() => setClosingPosition(p)}
                              className="text-[10px] text-[var(--gold)] font-bold bg-[var(--gold)]/10 px-2 py-1 rounded-md hover:bg-[var(--gold)]/20 transition"
                            >
                              بستن پوزیشن
                            </button>
                          </div>

                          {/* اطلاعات اصلی */}
                          <div className="grid grid-cols-3 gap-y-3 gap-x-2 text-center">

                            <div className="flex flex-col">
                              <span className="text-[8.5px] text-[var(--muted)] mb-0.5">
                                قیمت ورود
                              </span>
                              <span className="text-[10px] font-mono text-[var(--text)]">
                                {format(p.entry)}
                              </span>
                            </div>

                            <div className="flex flex-col border-x border-[var(--border)]">
                              <span className="text-[8.5px] text-[var(--muted)] mb-0.5">
                                قیمت لحظه‌ای
                              </span>
                              <span className="text-[10px] font-mono text-[var(--green)]">
                                {format(p.markPrice)}
                              </span>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[8.5px] text-[var(--muted)] mb-0.5">
                                قیمت لیکویید
                              </span>
                              <span className="text-[10px] font-mono text-[var(--red)]">
                                {format(p.liqPrice)}
                              </span>
                            </div>

                            <div className="flex flex-col pt-2 border-t border-[var(--border)]">
                              <span className="text-[8.5px] text-[var(--muted)] mb-0.5">
                                حجم معامله
                              </span>
                              <span className="text-[10px] font-mono text-[var(--gold)]">
                                {toFa(p.size.toFixed(3))} گرم
                              </span>
                            </div>

                            <div className="flex flex-col pt-2 border-t border-x border-[var(--border)]">
                              <span className="text-[8.5px] text-[var(--muted)] mb-0.5">
                                مارجین
                              </span>
                              <span className="text-[10px] font-mono text-[var(--gold)]">
                                {toFa(p.marginGold.toFixed(3))} گرم
                              </span>
                            </div>

                            <div className="flex flex-col pt-2 border-t border-[var(--border)]">
                              <span className="text-[8.5px] text-[var(--muted)] mb-0.5">
                                ارزش کل
                              </span>
                              <span className="text-[10px] font-mono text-[var(--gold)]">
                                {toFa(p.valueGold.toFixed(3))} گرم
                              </span>
                            </div>

                            {/* اجاره و بلوکه */}
                            <div className="col-span-3 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-2 mt-1">
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    p.fundingType === "اجاره"
                                      ? "bg-[var(--green)]/15 text-[var(--green)]"
                                      : "bg-[var(--red)]/15 text-[var(--red)]"
                                  }`}>
                                    {p.fundingType}
                                  </span>
                                  <span className="text-[8px] text-[var(--muted)]">
                                    (تعیین مدیریت)
                                  </span>
                                </div>

                                <span className="text-[10px] font-mono text-[var(--gold)]">
                                  {toFa(p.fundingAmountGold.toFixed(4))} گرم
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-[8.5px] text-[var(--muted)] pt-1 border-t border-[var(--border)]">
                                <span>
                                  نرخ: {toFa(p.fundingRate.toFixed(2))}% (۲۴ ساعت)
                                </span>
                                <span className="text-amber-400">
                                  ⏳ {p.fundingStatus}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* سود و زیان */}
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-[var(--border)]">
                            <span className="text-[9px] text-[var(--muted)]">
                              سود/زیان شناور (گرم)
                            </span>

                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold font-mono ${
                                pnl.pnlGold >= 0
                                  ? "text-[var(--green)]"
                                  : "text-[var(--red)]"
                              }`}>
                                {pnl.pnlGold >= 0 ? "+" : ""}
                                {toFa(pnl.pnlGold.toFixed(3))}
                              </span>

                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                pnl.roe >= 0
                                  ? "bg-[var(--green)]/15 text-[var(--green)]"
                                  : "bg-[var(--red)]/15 text-[var(--red)]"
                              }`}>
                                {pnl.roe >= 0 ? "+" : ""}
                                {toFa(pnl.roe.toFixed(2))}٪
                              </span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* تاریخچه */}
            {bottomTab === "history" && (
              <div className="text-center py-8 text-[11px] text-[var(--muted)]">
                <div className="text-3xl mb-2 opacity-50">🕒</div>
                تاریخچه‌ای موجود نیست.
              </div>
            )}
          </div>
        </div>

        {/* پاپ‌آپ توضیحات مارجین */}
        {showMarginExplanation && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowMarginExplanation(false)}
          >
            <div
              className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>

              <h3 className="font-bold text-sm mb-2">
                {marginMode === "cross" ? "حالت کل موجودی (Cross)" : "حالت مبلغ معامله (Isolated)"}
              </h3>

              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                {marginMode === "cross"
                  ? "در این حالت تمام طلای شما به عنوان وجه تضمین پشتیبان پوزیشن است. اگر ضرر کنید، از کل موجودی شما کسر می‌شود (ریسک کمتر)."
                  : "در این حالت فقط مقدار وارد شده در کادر وجه تضمین در خطر است. اگر ضرر کنید، فقط همان مقدار از بین می‌رود (ریسک بیشتر)."}
              </p>

              <div className="mt-4 text-[10px] text-[var(--muted)] bg-[var(--panel-2)] py-2 rounded-lg border border-[var(--border)]">
                برای بستن، هر جای صفحه کلیک کنید
              </div>
            </div>
          </div>
        )}

        {/* مودال تنظیم اهرم - نسخه موبایل */}
{showLeverageModal && (
  <div
    className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
    onClick={() => setShowLeverageModal(false)}
    onPointerDown={(e) => e.stopPropagation()}
  >
    <div
      className="relative w-full max-w-md bg-[var(--panel)] rounded-t-2xl px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--border)] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* عنوان */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[var(--text)]">
          تنظیم اهرم (Leverage)
        </h3>

        <button
          type="button"
          onClick={() => setShowLeverageModal(false)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--panel-2)]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* مقدار اهرم */}
      <div className="text-center mb-4">
        <span className="text-2xl font-black text-[var(--gold)] font-mono">
          {toFa(String(leverage))}x
        </span>
      </div>

      {/* اسلایدر */}
      <div className="mb-5 px-1">
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--gold)] bg-[var(--border)]"
          dir="ltr"
        />

        <div
          className="flex justify-between text-[10px] text-[var(--muted)] mt-2 font-mono"
          dir="ltr"
        >
          <span>1x</span>
          <span>5x</span>
          <span>10x</span>
          <span>15x</span>
          <span>20x</span>
        </div>
      </div>

      {/* انتخاب سریع اهرم */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 5, 10, 20].map((val) => (
          <button
            type="button"
            key={val}
            onClick={() => setLeverage(val)}
            className={`h-9 rounded-lg border text-xs font-bold transition ${
              leverage === val
                ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                : "bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)]"
            }`}
          >
            {val}x
          </button>
        ))}
      </div>

      {/* تایید */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowLeverageModal(false);
        }}
        className="w-full h-10 rounded-lg bg-[var(--gold)] text-black font-bold text-sm active:scale-[0.99] transition"
      >
        تایید
      </button>
    </div>
  </div>
)}

        {/* دیالوگ تایید بستن یک پوزیشن */}
        <ConfirmDialog
          open={!!closingPosition}
          onClose={() => !isClosingPosition && setClosingPosition(null)}
          onConfirm={handleConfirmClose}
          title="بستن پوزیشن"
          description={`آیا از بستن پوزیشن ${closingPosition?.pair} مطمئن هستید؟`}
          confirmText="بستن پوزیشن"
          cancelText="انصراف"
          variant="danger"
          loading={isClosingPosition}
        />

        {/* دیالوگ تایید بستن همه */}
        <ConfirmDialog
          open={showCloseAllConfirm}
          onClose={() => !isClosingAll && setShowCloseAllConfirm(false)}
          onConfirm={handleConfirmCloseAll}
          title="بستن همه پوزیشن‌ها"
          description={`آیا از بستن تمام ${toFa(String(positions.length))} پوزیشن باز خود مطمئن هستید؟ این عمل قابل بازگشت نیست.`}
          confirmText="بستن همه"
          cancelText="انصراف"
          variant="danger"
          loading={isClosingAll}
        />
      </div>
    </>
  );
}