"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, toFa, toEnDigits } from "@/lib/format";
import { SETTINGS } from "@/lib/settings";
import { useToast } from "@/components/ui/Toast";

const SPREAD_PERCENT = 0.0005;
const MAINTENANCE_MARGIN = 0.005;
const FEE_RATE = 0.001;
const FUNDING_RATE = 0.0001;

type Side = "long" | "short";
type MarginMode = "cross" | "isolated";
type OrderType = "market" | "limit";
type BottomTab = "positions" | "orders" | "history";

const MOCK_HISTORY = [
  { id: "h1", pair: "طلا / تومان", side: "long" as Side, leverage: 20, size: 2.5, entry: 18_500_000, exit: 18_900_000, pnlGold: 0.12, date: "۱۴۰۴/۰۸/۱۲" },
  { id: "h2", pair: "طلا / تومان", side: "short" as Side, leverage: 5, size: 1.0, entry: 19_200_000, exit: 19_300_000, pnlGold: -0.05, date: "۱۴۰۴/۰۸/۱۰" },
];

const MOCK_POSITIONS = [
  { id: "p1", pair: "طلا / تومان", mode: "کل موجودی", side: "long" as Side, leverage: 10, size: 5.0, entry: 19_000_000, pnlGold: 0.345, liqPrice: 17_267_400, fundingStatus: "معاف (روز اول)" },
];

const generateOrderBook = (basePrice: number) => {
  const asks = [];
  const bids = [];
  let askTotal = 0;
  let bidTotal = 0;

  for (let i = 0; i < 7; i++) {
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

export default function LeverageTradingPage() {
  const router = useRouter();
  const toast = useToast();
  const marketPrice = SETTINGS.fees.goldPrice;

  const [side, setSide] = useState<Side>("long");
  const [marginMode, setMarginMode] = useState<MarginMode>("cross");
  const [showMarginInfo, setShowMarginInfo] = useState<MarginMode | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(10);
  const [collateralGold, setCollateralGold] = useState<string>("");
  const [activePercent, setActivePercent] = useState<number | null>(null);
  const [tpPrice, setTpPrice] = useState<string>("");
  const [slPrice, setSlPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("positions");

  const orderBook = useMemo(() => generateOrderBook(marketPrice), [marketPrice]);

  const userTotalGold = 12.45;
  const collateralNum = Number(collateralGold) || 0;

  const calc = useMemo(() => {
    const baseEntryPrice = orderType === "limit" && Number(limitPrice) > 0
      ? Number(limitPrice)
      : marketPrice;

    const entryPrice = side === "long"
      ? baseEntryPrice * (1 + SPREAD_PERCENT)
      : baseEntryPrice * (1 - SPREAD_PERCENT);

    const positionSizeGold = collateralNum * leverage;
    const positionValueToman = positionSizeGold * entryPrice;

    const feeToman = positionValueToman * FEE_RATE;
    const feeGold = feeToman / entryPrice;

    const fundingFeeGold = (positionValueToman * FUNDING_RATE) / entryPrice;

    const effectiveMargin = marginMode === "cross" ? collateralNum + userTotalGold : collateralNum;

    const liqPrice = side === "long"
      ? entryPrice * (1 - (effectiveMargin / positionSizeGold) + MAINTENANCE_MARGIN)
      : entryPrice * (1 + (effectiveMargin / positionSizeGold) - MAINTENANCE_MARGIN);

    return {
      entryPrice, positionSizeGold, positionValueToman,
      feeGold, fundingFeeGold, liqPrice,
      isFundingLong: side === "long"
    };
  }, [collateralNum, leverage, side, marketPrice, marginMode, userTotalGold, orderType, limitPrice]);

  const isValid = collateralNum >= 0.1;

  function setMarginPercent(percent: number) {
    const amount = (userTotalGold * percent) / 100;
    setCollateralGold(amount.toFixed(3));
    setActivePercent(percent);
  }

  function handleCollateralChange(val: string) {
    setCollateralGold(val);
    setActivePercent(null);
  }

  function handleSubmit() {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCollateralGold("");
      setActivePercent(null);
      setLimitPrice("");
      setTpPrice("");
      setSlPrice("");
      toast.success(`سفارش ${orderType === "market" ? "بازار" : "محدود"} با موفقیت ثبت شد`);
    }, 800);
  }

  const TradeSummary = () => {
    if (collateralNum <= 0) return null;
    const isLong = side === "long";

    return (
      <div className={`rounded-xl border p-3 text-[11px] space-y-2 h-fit shadow-lg shadow-black/20 ${
        isLong
          ? "border-[var(--green)]/40 bg-[var(--green)]/5"
          : "border-[var(--red)]/40 bg-[var(--red)]/5"
      }`}>
        <div className="flex justify-between items-center border-b border-[var(--border)] pb-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-[var(--text)]">خلاصه معامله</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isLong ? "bg-[var(--green)] text-white border-[var(--green)]" : "bg-[var(--red)] text-white border-[var(--red)]"}`}>
              {isLong ? "خرید" : "فروش"}
            </span>
          </div>
          <span className="text-[9px] bg-[var(--panel)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--muted)]">{orderType === "market" ? "بازار" : "محدود"}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--muted)]">حجم پوزیشن</span>
          <span className="font-bold text-[12px] font-mono">{toFa(calc.positionSizeGold.toFixed(3))} گرم</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--muted)]">ارزش پوزیشن</span>
          <span className="font-bold text-[12px] text-[var(--text)] font-mono">{format(calc.positionValueToman)} ت</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--muted)]">قیمت ورود</span>
          <span className="font-bold text-[var(--text)] font-mono">{format(calc.entryPrice)} ت</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--muted)]">کارمزد</span>
          <span className="text-[var(--red)] font-bold font-mono">{toFa(calc.feeGold.toFixed(4))} گرم</span>
        </div>

        <div className="flex justify-between items-start border-t border-[var(--border)] pt-2 mt-1">
          <div className="flex flex-col">
            <span className="text-[var(--muted)] flex items-center gap-1 font-bold text-[10px]">
              {calc.isFundingLong ? "اجاره (خرید می‌دهد)" : "بلوکه (فروش می‌دهد)"}
              <span className="text-[8px] bg-[var(--panel)] border border-[var(--border)] rounded px-1 py-0.5 text-[var(--text)]">۰.۰۱٪</span>
            </span>
            <span className="text-[8.5px] text-[var(--green)] mt-0.5">ℹ️ ۲۴ ساعت - روز اول معاف</span>
          </div>
          <span className={`${calc.isFundingLong ? "text-[var(--red)]" : "text-[var(--green)]"} font-bold text-[11px] font-mono`}>
            {calc.isFundingLong ? "-" : "+"}{toFa(calc.fundingFeeGold.toFixed(4))} گرم
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[var(--border)] mt-1">
          <span className="text-[var(--muted)] font-bold text-xs">قیمت لیکویید</span>
          <span className="text-[var(--red)] font-black text-[13px] font-mono bg-[var(--red)]/10 px-1.5 py-0.5 rounded border border-[var(--red)]/20">{format(calc.liqPrice)} ت</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100dvh-130px)] flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans" dir="rtl">

      {/* هدر قیمت */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] bg-[var(--panel)] shrink-0 h-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">طلا / تومان</span>
          <span className="text-sm font-black text-[var(--green)] font-mono">{format(marketPrice)}</span>
        </div>
        <span className="text-[9px] text-[var(--green)] bg-[var(--green)]/10 px-1.5 py-0.5 rounded font-mono">+۲.۴۵٪</span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* دفتر سفارشات - فقط دسکتاپ */}
        <div className="hidden lg:flex w-[260px] border-l border-[var(--border)] flex-col shrink-0 bg-[var(--panel)]">
          <div className="grid grid-cols-3 text-[8.5px] text-[var(--muted)] p-1 bg-[var(--panel-2)] border-b border-[var(--border)]">
            <span className="text-right">قیمت</span>
            <span className="text-center">مقدار</span>
            <span className="text-left">جمع</span>
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
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col overflow-y-auto p-2 lg:border-l lg:border-[var(--border)]">

          {/* موجودی */}
          <div className="flex justify-between items-center text-[10px] mb-1.5 bg-[var(--panel-2)] p-2 rounded border border-[var(--border)]">
            <div className="flex flex-col">
              <span className="text-[var(--muted)]">موجودی کیف:</span>
              <span className="font-bold text-[var(--text)] font-mono">{toFa(userTotalGold.toString())} گرم</span>
            </div>
            <div className="flex flex-col border-r border-[var(--border)] pr-2 text-left">
              <span className="text-[var(--muted)]">ارزش خالص:</span>
              <span className="font-bold text-[var(--green)] font-mono">{toFa(userTotalGold.toString())} گرم</span>
            </div>
          </div>

          {/* حالت margin */}
          <div className="mb-1.5">
            <div className="flex gap-1 bg-[var(--panel-2)] p-0.5 rounded border border-[var(--border)] h-7">
              <button onClick={() => { setMarginMode("cross"); setShowMarginInfo("cross"); }} className={`flex-1 text-[10px] font-bold rounded-sm transition-all ${marginMode === "cross" ? "bg-[var(--panel)] text-[var(--gold)] shadow-sm" : "text-[var(--muted)]"}`}>کل موجودی</button>
              <button onClick={() => { setMarginMode("isolated"); setShowMarginInfo("isolated"); }} className={`flex-1 text-[10px] font-bold rounded-sm transition-all ${marginMode === "isolated" ? "bg-[var(--panel)] text-[var(--gold)] shadow-sm" : "text-[var(--muted)]"}`}>مبلغ معامله</button>
            </div>
            {showMarginInfo && (
              <div className="mt-1 p-1.5 rounded bg-[var(--panel-2)] border border-[var(--border)] text-[9px] text-[var(--muted)] leading-relaxed relative fade-in">
                <button onClick={() => setShowMarginInfo(null)} className="absolute top-0.5 left-0.5 text-[var(--muted)] hover:text-white">✕</button>
                {showMarginInfo === "cross" ? <span>در حالت <b>کل موجودی</b>، تمام طلا پشتیبان است.</span> : <span>در حالت <b>مبلغ معامله</b>، فقط طلای این کادر در خطر است.</span>}
              </div>
            )}
          </div>

          {/* خرید/فروش */}
          <div className="flex gap-1.5 mb-2">
            <button onClick={() => setSide("long")} className={`flex-1 h-8 rounded font-bold text-[11px] transition ${side === "long" ? "bg-[var(--green)] text-white" : "bg-[var(--panel-2)] text-[var(--muted)]"}`}>خرید</button>
            <button onClick={() => setSide("short")} className={`flex-1 h-8 rounded font-bold text-[11px] transition ${side === "short" ? "bg-[var(--red)] text-white" : "bg-[var(--panel-2)] text-[var(--muted)]"}`}>فروش</button>
          </div>

          {/* اهرم */}
          <div className="mb-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[var(--muted)]">اهرم</span>
              <span className="font-bold text-[var(--gold)] font-mono">{toFa(String(leverage))}x</span>
            </div>
            <input type="range" min="1" max="20" step="1" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="w-full h-1 accent-[var(--gold)]" dir="ltr" />
            <div className="flex justify-between text-[8px] text-[var(--muted)] mt-1 font-mono" dir="ltr"><span>1x</span><span>5x</span><span>10x</span><span>15x</span><span>20x</span></div>
          </div>

          {/* نوع سفارش */}
          <div className="mb-2">
            <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 text-[10px] outline-none text-[var(--text)] focus:border-[var(--gold)]">
              <option value="market">نوع سفارش: بازار</option>
              <option value="limit">نوع سفارش: محدود</option>
            </select>
          </div>

          {orderType === "limit" && (
            <div className="mb-2 fade-in">
              <input type="text" dir="ltr" value={limitPrice} onChange={(e) => setLimitPrice(toEnDigits(e.target.value).replace(/\D/g, ""))} placeholder={`قیمت ورود: ${format(marketPrice)}`} className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 text-[11px] text-left font-mono outline-none focus:border-[var(--gold)]" />
            </div>
          )}

          {/* وجه تضمین */}
          <div className="mb-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[var(--muted)]">وجه تضمین (طلا)</span>
              <span className="text-[var(--muted)] text-[9px]">حداقل: ۰.۱ گرم</span>
            </div>
            <div className="relative flex items-center bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 focus-within:border-[var(--gold)]">
              <input type="text" dir="ltr" value={collateralGold} onChange={(e) => handleCollateralChange(toEnDigits(e.target.value).replace(/[^\d.]/g, ""))} placeholder="0.000" className="w-full bg-transparent text-left text-[12px] font-bold font-mono outline-none placeholder:text-[var(--muted)] placeholder:font-normal" />
              <span className="text-[9px] text-[var(--muted)] mr-1.5 border-r border-[var(--border)] pr-1.5">گرم</span>
            </div>

            <div className="flex flex-row-reverse gap-1.5 mt-2">
              {[25, 50, 75, 100].map((p) => {
                const isActive = activePercent === p;
                return (
                  <button key={p} onClick={() => setMarginPercent(p)} className={`flex-1 h-6 rounded-full text-[9px] font-bold border transition-all ${isActive ? (side === "long" ? "bg-[var(--green)] text-white border-[var(--green)]" : "bg-[var(--red)] text-white border-[var(--red)]") : "bg-[var(--panel-2)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--gold)]/50"}`}>
                    {toFa(String(p))}٪
                  </button>
                );
              })}
            </div>
          </div>

          {/* TP/SL */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input type="text" dir="ltr" value={tpPrice} onChange={(e) => setTpPrice(toEnDigits(e.target.value).replace(/\D/g, ""))} placeholder="حد سود" className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 text-[10px] font-mono outline-none focus:border-[var(--green)]" />
            <input type="text" dir="ltr" value={slPrice} onChange={(e) => setSlPrice(toEnDigits(e.target.value).replace(/\D/g, ""))} placeholder="حد ضرر" className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 text-[10px] font-mono outline-none focus:border-[var(--red)]" />
          </div>

          {/* خلاصه فشرده — فقط موبایل */}
          {collateralNum > 0 && (
            <div className="lg:hidden mt-1 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2 space-y-1 mb-2">
              <div className="flex justify-between text-[9.5px]">
                <span className="text-[var(--muted)]">حجم پوزیشن</span>
                <span className="font-bold font-mono text-[10px]">{toFa(calc.positionSizeGold.toFixed(3))} گرم</span>
              </div>
              <div className="flex justify-between text-[9.5px]">
                <span className="text-[var(--muted)]">قیمت لیکویید</span>
                <span className="font-bold font-mono text-[10px] text-[var(--red)]">{format(calc.liqPrice)} ت</span>
              </div>
            </div>
          )}

          {/* دکمه ثبت */}
          <div className="lg:mt-auto pt-2">
            <button onClick={handleSubmit} disabled={!isValid || isSubmitting} className={`w-full h-9 rounded font-bold text-[11px] text-white transition ${side === "long" ? "bg-[var(--green)] hover:bg-[var(--green)]/90" : "bg-[var(--red)] hover:bg-[var(--red)]/90"} disabled:opacity-50`}>
              {isSubmitting ? "در حال ارسال..." : `ثبت سفارش ${side === "long" ? "خرید" : "فروش"}`}
            </button>
          </div>
        </div>

        {/* خلاصه کامل — دسکتاپ */}
        <div className="hidden lg:flex flex-col w-[320px] shrink-0 bg-[var(--bg)] p-3 overflow-y-auto border-r border-[var(--border)]">
          <TradeSummary />
        </div>

        <div className="hidden lg:flex flex-1 bg-[var(--bg)]"></div>
      </div>

      {/* تب‌های پایین — ارتفاع کمتر در موبایل */}
      <div className="h-[150px] sm:h-[180px] lg:h-[240px] border-t border-[var(--border)] bg-[var(--panel)] flex flex-col shrink-0">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-1">
          <div className="flex overflow-x-auto">
            <button onClick={() => setBottomTab("positions")} className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold border-b-2 whitespace-nowrap transition ${bottomTab === "positions" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--muted)]"}`}>پوزیشن‌ها (۱)</button>
            <button onClick={() => setBottomTab("orders")} className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold border-b-2 whitespace-nowrap transition ${bottomTab === "orders" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--muted)]"}`}>سفارشات (۰)</button>
            <button onClick={() => setBottomTab("history")} className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold border-b-2 whitespace-nowrap transition ${bottomTab === "history" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--muted)]"}`}>تاریخچه</button>
          </div>
          {bottomTab === "positions" && (
            <button className="text-[8px] sm:text-[9px] text-[var(--red)] border border-[var(--red)]/30 bg-[var(--red)]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap shrink-0">بستن همه</button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-1">
          <div className="min-w-[750px]">

            {bottomTab === "positions" && (
              <>
                <div className="grid grid-cols-9 text-[9px] text-[var(--muted)] px-2 py-1.5 bg-[var(--panel-2)] rounded-t">
                  <span>جفت‌ارز</span><span>حالت</span><span>جهت</span><span>اهرم</span><span>حجم</span><span>ورود</span><span>سود/زیان</span><span>اجاره/بلوکه</span><span>عملیات</span>
                </div>
                {MOCK_POSITIONS.map((p) => (
                  <div key={p.id} className="grid grid-cols-9 items-center text-[10px] px-2 py-2 border-b border-[var(--border)] hover:bg-[var(--panel-2)] transition">
                    <span className="font-bold">{p.pair}</span>
                    <span className="text-[var(--gold)] text-[9px]">{p.mode}</span>
                    <span className={p.side === "long" ? "text-[var(--green)] font-bold" : "text-[var(--red)] font-bold"}>{p.side === "long" ? "خرید" : "فروش"}</span>
                    <span className="bg-[var(--panel)] border border-[var(--border)] rounded px-1 py-0.5 w-fit text-[9px] font-mono">{toFa(String(p.leverage))}x</span>
                    <span className="font-mono">{toFa(p.size.toFixed(3))}</span>
                    <span className="font-mono">{format(p.entry)}</span>
                    <span className="text-[var(--green)] font-bold font-mono">+{toFa(p.pnlGold.toFixed(3))}</span>
                    <span className="text-[8.5px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 w-fit">⏳ {p.fundingStatus}</span>
                    <div className="flex gap-2">
                      <button className="text-[var(--gold)] hover:underline">بستن</button>
                      <button className="text-[var(--muted)] hover:text-white">حد</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {bottomTab === "orders" && (
              <>
                <div className="grid grid-cols-7 text-[9px] text-[var(--muted)] px-2 py-1.5 bg-[var(--panel-2)] rounded-t">
                  <span>جفت‌ارز</span><span>نوع</span><span>جهت</span><span>قیمت</span><span>مقدار</span><span>پر شده</span><span>عملیات</span>
                </div>
                <div className="flex flex-col items-center justify-center h-[80px] text-[var(--muted)] space-y-1">
                  <span className="text-[10px]">سفارش فعالی ندارید.</span>
                </div>
              </>
            )}

            {bottomTab === "history" && (
              <>
                <div className="grid grid-cols-8 text-[9px] text-[var(--muted)] px-2 py-1.5 bg-[var(--panel-2)] rounded-t">
                  <span>جفت‌ارز</span><span>جهت</span><span>اهرم</span><span>حجم</span><span>ورود</span><span>خروج</span><span>سود/زیان</span><span>تاریخ</span>
                </div>
                {MOCK_HISTORY.map((h) => (
                  <div key={h.id} className="grid grid-cols-8 items-center text-[10px] px-2 py-2 hover:bg-[var(--panel-2)] border-b border-[var(--border)] transition">
                    <span className="font-bold">{h.pair}</span>
                    <span className={h.side === "long" ? "text-[var(--green)] font-bold" : "text-[var(--red)] font-bold"}>{h.side === "long" ? "خرید" : "فروش"}</span>
                    <span className="bg-[var(--panel)] border border-[var(--border)] rounded px-1 py-0.5 w-fit text-[9px] font-mono">{toFa(String(h.leverage))}x</span>
                    <span className="font-mono">{toFa(h.size.toFixed(3))}</span>
                    <span className="font-mono">{format(h.entry)}</span>
                    <span className="font-mono">{format(h.exit)}</span>
                    <span className={`font-bold font-mono ${h.pnlGold >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{h.pnlGold >= 0 ? "+" : ""}{toFa(h.pnlGold.toFixed(3))}</span>
                    <span className="text-[var(--muted)] font-mono text-[9px]">{h.date}</span>
                  </div>
                ))}
              </>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.2s ease; }
      `}</style>
    </div>
  );
}