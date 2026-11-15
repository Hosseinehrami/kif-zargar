"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useMemo } from "react";
import TradeInvoice, { type TradeInvoiceData } from "@/components/TradeInvoice";
import { format, toFa, toEnDigits } from "@/lib/format";
import { SETTINGS } from "@/lib/settings";

const FEE_RATE = 0.01; // ۱ درصد کارمزد
const CASH_BALANCE = 245_000_000; // موجودی ریالی شبیه‌سازی شده

type SymbolKind = "gold" | "coin" | "currency";
type SymbolItem = {
  id: string;
  label: string;
  price: number;
  change: number;
  unit: string;
  kind: SymbolKind;
  balance: number;
};

// ==========================================
// آیکون‌ها
// ==========================================
function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}
function ExchangeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

type Side = "buy" | "sell";
type OrderType = "instant" | "limit";

export default function TradePage() {
  const { user } = useAuth();
  const marketGoldPrice = SETTINGS.fees.goldPrice;

  // دیتای نمادها
  const symbols: SymbolItem[] = useMemo(() => [
    { id: "gold18",      label: "طلای ۱۸ عیار", price: marketGoldPrice,  change:  1.25, unit: "گرم",  kind: "gold",     balance: 12.45 },
    { id: "coin-emami",  label: "سکه امامی",     price: 185_000_000,    change:  1.10, unit: "عدد",  kind: "coin",     balance: 2     },
    { id: "coin-bahar",  label: "بهار آزادی",    price: 175_000_000,    change:  0.95, unit: "عدد",  kind: "coin",     balance: 1     },
    { id: "coin-half",   label: "نیم سکه ۸۶",    price:  95_000_000,    change:  0.70, unit: "عدد",  kind: "coin",     balance: 3     },
    { id: "coin-quarter",label: "ربع سکه ۸۶",    price:  52_000_000,    change:  0.50, unit: "عدد",  kind: "coin",     balance: 5     },
    { id: "usd",         label: "دلار",          price:      62_000,    change: -0.15, unit: "دلار", kind: "currency", balance: 500   },
    { id: "usdt",        label: "USDT",          price:      61_500,    change:  0.10, unit: "تتر",  kind: "currency", balance: 1200  },
  ], [marketGoldPrice]);

  const [symbol, setSymbol] = useState<SymbolItem>(symbols[0]);
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("instant");
  const [price, setPrice] = useState(symbols[0].price);
  const [amountInput, setAmountInput] = useState(String(symbols[0].price));
  const [gramsInput, setGramsInput] = useState("1");
  const [lastEdited, setLastEdited] = useState<"amount" | "grams">("grams");
  const [percent, setPercent] = useState<number | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [completedTrade, setCompletedTrade] = useState<TradeInvoiceData | null>(null);

  const MARKET_PRICE = symbol.price;
  const GOLD_BALANCE = symbol.balance;
  const isIntegerUnit = symbol.kind === "coin" || symbol.kind === "currency";
  const unitStep = isIntegerUnit ? 1 : 0.1;

  const effectivePrice = orderType === "instant" ? MARKET_PRICE : price;
  const grams = Math.max(0, Number(gramsInput) || 0);
  const amount = grams * effectivePrice;
  const fee = amount * FEE_RATE;
  const total = side === "buy" ? amount + fee : amount - fee;
  const enoughBalance = side === "buy" ? total <= CASH_BALANCE : grams <= GOLD_BALANCE;

  const showPriceField = orderType === "limit";
  const showAmountField = orderType === "instant" || (orderType === "limit" && side === "buy");
  const showGramsField = orderType === "instant" || (orderType === "limit" && side === "sell");

  const unitWord = symbol.unit;
  const qtyLabel = symbol.kind === "gold" ? "مقدار طلا (گرم)" : symbol.kind === "coin" ? "تعداد سکه (عدد)" : `مقدار (${symbol.unit})`;
  const balanceLabel = symbol.kind === "gold" ? "موجودی طلا" : symbol.kind === "coin" ? "موجودی سکه" : "موجودی ارز";
  const percentLabel = side === "buy" ? "درصد از موجودی ریالی" : symbol.kind === "gold" ? "درصد از موجودی طلا" : symbol.kind === "coin" ? "درصد از موجودی سکه" : "درصد از موجودی ارز";

  const fmtQty = (n: number) => toFa(isIntegerUnit ? String(Math.round(n)) : n.toFixed(4));
  const fmtBalance = (n: number) => toFa(n.toFixed(symbol.kind === "gold" ? 3 : 0));

  function computeUnits(amountValue: number): number {
    if (!isIntegerUnit) return amountValue / effectivePrice;
    if (amountValue <= 0) return 0;
    const raw = amountValue / effectivePrice;
    const rounded = Math.round(raw);
    const floor = Math.floor(raw);
    const tolerance = Math.max(1000, effectivePrice * 0.01);
    if (side === "sell") {
      if (rounded > GOLD_BALANCE) return Math.min(floor, Math.floor(GOLD_BALANCE));
      if (rounded * effectivePrice <= amountValue + tolerance) return rounded;
      return floor;
    }
    const maxUnits = Math.floor(CASH_BALANCE / (effectivePrice * (1 + FEE_RATE)));
    if (rounded > maxUnits) return Math.min(floor, maxUnits);
    if (rounded * effectivePrice <= amountValue + tolerance) return rounded;
    return floor;
  }

  function updateAmount(v: string) {
    const clean = toEnDigits(v).replace(/,/g, "").replace(/\D/g, "");
    setAmountInput(clean);
    setLastEdited("amount");
    setPercent(null);
    if (clean === "") { setGramsInput(""); return; }
    const num = Number(clean);
    if (!Number.isFinite(num)) { setGramsInput(""); return; }
    if (isIntegerUnit) setGramsInput(String(computeUnits(num)));
    else setGramsInput((num / effectivePrice).toFixed(4));
  }

  function handleAmountBlur() {
    if (!isIntegerUnit || amountInput === "") return;
    const num = Number(amountInput);
    const units = Number(gramsInput);
    if (!Number.isFinite(num) || !Number.isFinite(units)) return;
    const actual = units * effectivePrice;
    if (Math.abs(actual - num) > 0.5) setAmountInput(String(actual));
  }

  function updateGrams(v: string) {
    let clean = v;
    if (isIntegerUnit) clean = v.split(".")[0].replace(/[^\d]/g, "");
    setGramsInput(clean);
    setLastEdited("grams");
    setPercent(null);
    if (clean === "") { setAmountInput(""); return; }
    const num = Number(clean);
    if (!Number.isFinite(num)) { setAmountInput(""); return; }
    setAmountInput(String(Math.round(num * effectivePrice)));
  }

  function changePrice(p: number) {
    setPrice(p);
    setPercent(null);
    if (lastEdited === "grams") {
      const num = Number(gramsInput);
      if (Number.isFinite(num)) setAmountInput(String(Math.round(num * p)));
    } else {
      const num = Number(amountInput);
      if (Number.isFinite(num)) {
        if (isIntegerUnit) {
          let units = Math.round(num / p);
          if (side === "sell" && units > GOLD_BALANCE) units = Math.floor(GOLD_BALANCE);
          if (side === "buy") {
            const maxU = Math.floor(CASH_BALANCE / (p * (1 + FEE_RATE)));
            if (units > maxU) units = maxU;
          }
          setGramsInput(String(units));
        } else setGramsInput((num / p).toFixed(4));
      }
    }
  }

  function applyPercent(p: number) {
    setPercent(p);
    if (side === "buy") {
      const maxAmount = CASH_BALANCE / (1 + FEE_RATE);
      const target = maxAmount * (p / 100);
      let units = target / effectivePrice;
      if (isIntegerUnit) units = Math.floor(units);
      setGramsInput(isIntegerUnit ? String(units) : units.toFixed(4));
      setAmountInput(String(Math.round(units * effectivePrice)));
      setLastEdited("grams");
    } else {
      let units = GOLD_BALANCE * (p / 100);
      if (isIntegerUnit) units = Math.floor(units);
      setGramsInput(isIntegerUnit ? String(units) : units.toFixed(4));
      setAmountInput(String(Math.round(units * effectivePrice)));
      setLastEdited("grams");
    }
  }

  function changeSide(next: Side) {
    setSide(next);
    setPercent(null);
    if (orderType === "limit") {
      const nextSource = next === "buy" ? "amount" : "grams";
      setLastEdited(nextSource);
      if (nextSource === "amount") {
        const num = Number(amountInput);
        if (Number.isFinite(num)) {
          if (isIntegerUnit) {
            let units = Math.round(num / price);
            const maxU = Math.floor(CASH_BALANCE / (price * (1 + FEE_RATE)));
            if (units > maxU) units = maxU;
            setGramsInput(String(units));
          } else setGramsInput((num / price).toFixed(4));
        }
      } else {
        const num = Number(gramsInput);
        if (Number.isFinite(num)) setAmountInput(String(Math.round(num * price)));
      }
    }
  }

  function changeOrderType(next: OrderType) {
    setOrderType(next);
    setTypeOpen(false);
    setPercent(null);
    if (next === "instant") {
      const num = Number(gramsInput);
      if (Number.isFinite(num)) setAmountInput(String(Math.round(num * MARKET_PRICE)));
    }
  }

  function changeSymbol(id: string) {
    const sym = symbols.find((s) => s.id === id);
    if (!sym) return;
    setSymbol(sym);
    setPrice(sym.price);
    setSymbolOpen(false);
    setPercent(null);
    if (sym.kind === "gold") {
      setGramsInput("1");
      setAmountInput(String(sym.price));
    } else {
      const affordable = side === "buy" ? Math.floor(CASH_BALANCE / (sym.price * (1 + FEE_RATE))) : Math.floor(sym.balance);
      const initial = Math.min(1, Math.max(0, affordable));
      setGramsInput(String(initial));
      setAmountInput(String(initial * sym.price));
    }
    setLastEdited("grams");
  }

  function handleConfirmTrade() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateTime = `${toFa(pad(now.getHours()))}:${toFa(pad(now.getMinutes()))} · ${toFa(String(now.getFullYear()))}/${toFa(String(now.getMonth() + 1))}/${toFa(String(now.getDate()))}`;
    const trackingCode = "TRD-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    const buyerName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "کاربر کیف زرگر";
    const buyerNationalId = (user?.nationalId || "").trim();
    const buyerPhone = (user?.phone || "").trim();

    setCompletedTrade({
      trackingCode, dateTime, side, orderType, symbolName: symbol.label, unit: symbol.unit,
      amount: grams, price: effectivePrice, total: amount, fee, finalAmount: total, paymentMethod: "rial",
      buyer: { name: buyerName, nationalId: buyerNationalId, phone: buyerPhone },
    });
    setShowConfirm(false);
  }

  const submitLabel = side === "buy" ? "خرید" : "فروش";
  const accentBg = side === "buy" ? "bg-[var(--green)] hover:bg-[var(--green)]/90" : "bg-[var(--red)] hover:bg-[var(--red)]/90";

  return (
    <div className="h-[calc(100dvh-130px)] flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans" dir="rtl">
      
      {/* هدر */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--panel)] shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm">خرید و فروش طلا</h1>
          <span className="text-[9px] bg-[var(--gold)]/10 text-[var(--gold)] px-1.5 py-0.5 rounded border border-[var(--gold)]/20">معامله نقدی</span>
        </div>
      </div>

      {/* بدنه اصلی */}
      <div className="flex-1 flex flex-col lg:flex-row items-start gap-3 p-3 overflow-hidden">
        
        {/* ستون راست: فرم سفارش */}
        <section className="flex-1 w-full max-w-md mx-auto lg:mx-0 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
          
          {/* تب‌های خرید و فروش */}
          <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-lg bg-[var(--panel-2)] mb-3">
            <button onClick={() => changeSide("buy")} className={`h-9 rounded-md text-[11px] font-bold transition ${side === "buy" ? "bg-[var(--green)] text-white shadow-md shadow-[var(--green)]/20" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>خرید</button>
            <button onClick={() => changeSide("sell")} className={`h-9 rounded-md text-[11px] font-bold transition ${side === "sell" ? "bg-[var(--red)] text-white shadow-md shadow-[var(--red)]/20" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>فروش</button>
          </div>

          {/* نوع سفارش */}
          <div className="relative mb-3">
            <button onClick={() => setTypeOpen(!typeOpen)} className="w-full h-9 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 text-[11px]">
              <span className="font-bold">{orderType === "instant" ? "آنی (قیمت لحظه‌ای)" : "سفارش قیمت (Limit)"}</span>
              <ChevronDown className={`text-[var(--muted)] transition-transform ${typeOpen ? "rotate-180" : ""}`} />
            </button>
            {typeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTypeOpen(false)} />
                <div className="absolute z-20 inset-x-0 mt-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-xl overflow-hidden">
                  <button onClick={() => { changeOrderType("instant"); setTypeOpen(false); }} className={`w-full text-right px-3 py-2 text-[11px] hover:bg-[var(--panel-2)] ${orderType === "instant" ? "text-[var(--gold)] font-bold" : ""}`}>آنی</button>
                  <button onClick={() => { changeOrderType("limit"); setTypeOpen(false); }} className={`w-full text-right px-3 py-2 text-[11px] hover:bg-[var(--panel-2)] border-t border-[var(--border)] ${orderType === "limit" ? "text-[var(--gold)] font-bold" : ""}`}>محدود</button>
                </div>
              </>
            )}
          </div>

          {/* قیمت دلخواه */}
          {showPriceField && (
            <div className="mb-3">
              <label className="text-[10px] text-[var(--muted)] mb-1 block">قیمت دلخواه (تومان)</label>
              <div className="flex items-center h-9 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] overflow-hidden">
                <button onClick={() => changePrice(Math.max(0, price - 10000))} className="h-full px-3 text-[var(--muted)] hover:text-[var(--text)]"><MinusIcon /></button>
                <input type="number" step={10000} min={0} value={price} onChange={(e) => changePrice(Math.max(0, Number(e.target.value) || 0))} className="flex-1 min-w-0 h-full bg-transparent text-center text-[12px] font-bold font-mono text-[var(--text)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button onClick={() => changePrice(price + 10000)} className="h-full px-3 text-[var(--muted)] hover:text-[var(--text)]"><PlusIcon /></button>
              </div>
            </div>
          )}

          {/* مبلغ ریالی */}
          {showAmountField && (
            <div className="mb-3">
              <label className="text-[10px] text-[var(--muted)] mb-1 block">مبلغ (تومان)</label>
              <div className="h-9 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 flex items-center">
                <input type="text" inputMode="numeric" value={amountInput === "" ? "" : Number(amountInput).toLocaleString("en-US")} onChange={(e) => updateAmount(e.target.value)} onBlur={handleAmountBlur} placeholder="۰" className="w-full bg-transparent text-center text-[12px] font-bold font-mono text-[var(--text)] outline-none" />
              </div>
            </div>
          )}

          {/* مقدار (وزن/تعداد) */}
          {showGramsField && (
            <div className="mb-3">
              <label className="text-[10px] text-[var(--muted)] mb-1 block">{qtyLabel}</label>
              <div className="flex items-center h-9 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] overflow-hidden">
                <button onClick={() => updateGrams(isIntegerUnit ? String(Math.round(Math.max(0, grams - unitStep))) : Math.max(0, grams - unitStep).toFixed(4))} className="h-full px-3 text-[var(--muted)] hover:text-[var(--text)]"><MinusIcon /></button>
                <input type={isIntegerUnit ? "text" : "number"} inputMode={isIntegerUnit ? "numeric" : "decimal"} value={gramsInput} onChange={(e) => updateGrams(e.target.value)} placeholder="۰" className="flex-1 min-w-0 h-full bg-transparent text-center text-[12px] font-bold font-mono text-[var(--text)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button onClick={() => updateGrams(isIntegerUnit ? String(Math.round(grams + unitStep)) : (grams + unitStep).toFixed(4))} className="h-full px-3 text-[var(--muted)] hover:text-[var(--text)]"><PlusIcon /></button>
              </div>
            </div>
          )}

          {/* درصدها */}
          <div className="mb-3">
            <div className="text-[10px] text-[var(--muted)] mb-1.5">{percentLabel}</div>
            <div dir="ltr" className="grid grid-cols-4 gap-1.5">
              {[25, 50, 75, 100].map((p) => (
                <button key={p} onClick={() => applyPercent(p)} className={`h-6 rounded-full text-[9px] font-bold border transition-all ${percent === p ? (side === "buy" ? "bg-[var(--green)] text-white border-[var(--green)]" : "bg-[var(--red)] text-white border-[var(--red)]") : "bg-[var(--panel-2)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--gold)]/50"}`}>{toFa(String(p))}٪</button>
              ))}
            </div>
          </div>

          {/* خلاصه */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2.5 text-[10px] space-y-1.5 mb-3">
            <div className="flex justify-between"><span className="text-[var(--muted)]">ارزش معامله</span><span className="font-bold font-mono">{format(amount)} ت</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">کارمزد (۱٪)</span><span className="text-amber-400 font-mono">{format(fee)} ت</span></div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1.5 mt-1">
              <span className="font-bold">{side === "buy" ? "مبلغ پرداختی" : "مبلغ دریافتی"}</span>
              <span className={`font-black text-[12px] font-mono ${side === "buy" ? "text-[var(--red)]" : "text-[var(--green)]"}`}>{format(total)} ت</span>
            </div>
          </div>

          {!enoughBalance && grams > 0 && <p className="text-[9px] text-red-400 mb-2">موجودی کافی نیست.</p>}

          <button onClick={() => setShowConfirm(true)} disabled={grams <= 0 || !enoughBalance} className={`w-full h-10 rounded-lg text-[11px] font-bold text-white transition disabled:opacity-50 ${accentBg}`}>
            {submitLabel} {symbol.label}
          </button>
        </section>

        {/* ستون چپ: اطلاعات و انتخاب دارایی (دقیقاً مثل طرح قبلی) */}
        <aside className="w-full lg:w-[260px] shrink-0 flex flex-col gap-2">
          {/* کارت انتخاب دارایی */}
          <button
            onClick={() => setSymbolOpen(true)}
            className="w-full text-right rounded-xl border border-[var(--gold)]/40 p-3 transition hover:border-[var(--gold)] hover:shadow-[0_0_0_3px_var(--gold)]/10 focus:outline-none"
            style={{ background: "rgba(196,168,117,0.08)" }}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-bold text-[var(--gold)]">{symbol.label}</span>
              <ExchangeIcon />
            </div>
            <div className="text-base font-black text-[var(--text)] font-mono">
              {format(symbol.price)} <span className="text-[9px] text-[var(--muted)] font-normal">تومان</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`font-bold text-[10px] font-mono ${symbol.change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                {symbol.change >= 0 ? "+" : ""}{toFa(String(symbol.change))}٪
              </span>
              <span className="text-[var(--muted)] text-[9px]">·</span>
              <ClockIcon className="text-[var(--muted)]" />
              <span className="text-[var(--muted)] text-[9px]">۰۹:۴۲</span>
            </div>
            <div className="mt-2 text-[9px] text-[var(--gold)]/80 flex items-center gap-1">
              <span>تغییر دارایی</span>
              <ChevronDown className="rotate-0" />
            </div>
          </button>

          {/* موجودی دارایی */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
            <div className="text-[10px] text-[var(--muted)] mb-1">{balanceLabel}</div>
            <div className="text-base font-black font-mono">{fmtBalance(GOLD_BALANCE)} <span className="text-[10px] text-[var(--muted)] font-normal">{unitWord}</span></div>
          </div>

          {/* موجودی ریالی */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
            <div className="text-[10px] text-[var(--muted)] mb-1">موجودی ریالی</div>
            <div className="text-base font-black font-mono">{format(CASH_BALANCE)} <span className="text-[10px] text-[var(--muted)] font-normal">تومان</span></div>
          </div>
        </aside>
      </div>

      {/* ====== مودال‌ها ====== */}
      
      {/* مودال انتخاب دارایی */}
      {symbolOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSymbolOpen(false)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">انتخاب دارایی</h2>
              <button onClick={() => setSymbolOpen(false)} className="text-[var(--muted)] text-xl leading-none w-8 h-8 grid place-items-center">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {symbols.map((sym) => (
                <button key={sym.id} onClick={() => changeSymbol(sym.id)} className={`text-right rounded-xl border p-2.5 transition ${sym.id === symbol.id ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--border)] hover:bg-[var(--panel-2)]"}`}>
                  <div className={`text-[11px] font-bold ${sym.id === symbol.id ? "text-[var(--gold)]" : ""}`}>{sym.label}</div>
                  <div className="text-[10px] font-mono mt-1">{format(sym.price)} <span className="text-[8px] text-[var(--muted)]">ت</span></div>
                  <div className={`text-[9px] mt-0.5 font-bold font-mono ${sym.change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                    {sym.change >= 0 ? "+" : ""}{toFa(String(sym.change))}٪
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* مودال تایید */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl mb-2 ${side === "buy" ? "bg-[var(--green)]/20 text-[var(--green)]" : "bg-[var(--red)]/20 text-[var(--red)]"}`}>
                {side === "buy" ? "↙" : "↗"}
              </div>
              <h2 className="font-bold text-sm mb-1">تأیید نهایی</h2>
              <p className="text-[10px] text-[var(--muted)]">آیا از انجام این معامله مطمئن هستید؟</p>
            </div>
            <div className="rounded-lg bg-[var(--bg)] p-3 mb-3 text-center">
              <div className="text-[11px] text-[var(--muted)] mb-1">{side === "buy" ? "خرید" : "فروش"} {symbol.label}</div>
              <div className="text-lg font-black font-mono">{fmtQty(grams)} {unitWord}</div>
              <div className="text-[10px] text-[var(--muted)] mt-1">به ارزش {format(total)} تومان</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 h-9 rounded-lg border border-[var(--border)] text-[10px] font-bold text-[var(--muted)]">انصراف</button>
              <button onClick={handleConfirmTrade} className={`flex-1 h-9 rounded-lg text-white text-[10px] font-bold ${accentBg}`}>تأیید و ثبت</button>
            </div>
          </div>
        </div>
      )}

      {/* فاکتور معامله */}
      {completedTrade && (
        <TradeInvoice trade={completedTrade} onClose={() => setCompletedTrade(null)} />
      )}
    </div>
  );
}