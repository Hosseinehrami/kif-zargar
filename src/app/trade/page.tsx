"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { format, toFa, toEnDigits } from "@/lib/format";
import { SETTINGS } from "@/lib/settings";
import { useToast } from "@/components/ui/Toast";
import TradeInvoice, { type TradeInvoiceData } from "@/components/TradeInvoice";

const FEE_RATE = 0.01;
const CASH_BALANCE = 245_000_000;

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


type Side = "buy" | "sell";
type OrderType = "instant" | "limit";

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function ExchangeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export default function TradePage() {
  const { user } = useAuth();
  const toast = useToast();
  const marketGoldPrice = SETTINGS.fees.goldPrice;

  const symbols: SymbolItem[] = useMemo(() => [
    { id: "gold18", label: "طلای ۱۸ عیار", price: marketGoldPrice, change: 1.25, unit: "گرم", kind: "gold", balance: 12.45 },
    { id: "coin-emami", label: "سکه امامی", price: 185_000_000, change: 1.10, unit: "عدد", kind: "coin", balance: 2 },
    { id: "coin-bahar", label: "بهار آزادی", price: 175_000_000, change: 0.95, unit: "عدد", kind: "coin", balance: 1 },
    { id: "coin-half", label: "نیم سکه", price: 95_000_000, change: 0.70, unit: "عدد", kind: "coin", balance: 3 },
    { id: "coin-quarter", label: "ربع سکه", price: 52_000_000, change: 0.50, unit: "عدد", kind: "coin", balance: 5 },
    { id: "usd", label: "دلار", price: 62_000, change: -0.15, unit: "دلار", kind: "currency", balance: 500 },
    { id: "usdt", label: "USDT", price: 61_500, change: 0.10, unit: "تتر", kind: "currency", balance: 1200 },
  ], [marketGoldPrice]);

  const [symbol, setSymbol] = useState<SymbolItem>(symbols[0]);
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("instant");
  const [price, setPrice] = useState(symbols[0].price);
  const [amountInput, setAmountInput] = useState(String(symbols[0].price));
  const [gramsInput, setGramsInput] = useState("1");
  const [percent, setPercent] = useState<number | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [completedTrade, setCompletedTrade] = useState<TradeInvoiceData | null>(null);

  const MARKET_PRICE = symbol.price;
  const GOLD_BALANCE = symbol.balance;
  const isIntegerUnit = symbol.kind === "coin" || symbol.kind === "currency";

  const effectivePrice = orderType === "instant" ? MARKET_PRICE : price;
  const grams = Math.max(0, Number(gramsInput) || 0);
  const amount = grams * effectivePrice;
  const fee = amount * FEE_RATE;
  const total = side === "buy" ? amount + fee : amount - fee;
  const enoughBalance = side === "buy" ? total <= CASH_BALANCE : grams <= GOLD_BALANCE;

  const showAmountField = orderType === "instant" || (orderType === "limit" && side === "buy");
  const showGramsField = orderType === "instant" || (orderType === "limit" && side === "sell");

  const unitWord = symbol.unit;
  const qtyLabel = symbol.kind === "gold" ? "مقدار طلا (گرم)" : symbol.kind === "coin" ? "تعداد سکه (عدد)" : `مقدار (${symbol.unit})`;
  const balanceLabel = symbol.kind === "gold" ? "موجودی طلا" : symbol.kind === "coin" ? "موجودی سکه" : "موجودی ارز";

  function setMarginPercent(p: number) {
    setPercent(p);
    if (side === "buy") {
      const maxAmount = CASH_BALANCE / (1 + FEE_RATE);
      const target = maxAmount * (p / 100);
      let units = target / effectivePrice;
      if (isIntegerUnit) units = Math.floor(units);
            setGramsInput(isIntegerUnit ? String(units) : units.toFixed(4));
      setAmountInput(String(Math.round(units * effectivePrice)));
    } else {
      let units = GOLD_BALANCE * (p / 100);
      if (isIntegerUnit) units = Math.floor(units);
            setGramsInput(isIntegerUnit ? String(units) : units.toFixed(4));
      setAmountInput(String(Math.round(units * effectivePrice)));
    }
  }

  function handleConfirmTrade() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateTime = `${toFa(pad(now.getHours()))}:${toFa(pad(now.getMinutes()))} · ${toFa(String(now.getFullYear()))}/${toFa(String(now.getMonth() + 1))}/${toFa(String(now.getDate()))}`;
    const trackingCode = "TRD-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    setCompletedTrade({
      trackingCode, dateTime, side, orderType, symbolName: symbol.label, unit: symbol.unit,
      amount: grams, price: effectivePrice, total: amount, fee, finalAmount: total, paymentMethod: "rial",
      buyer: { name: `${user?.firstName} ${user?.lastName}`, nationalId: user?.nationalId || "", phone: user?.phone || "" },
    });
    setShowConfirm(false);
    toast.success("سفارش با موفقیت ثبت شد");
  }

  return (
    <div className="px-2.5 sm:px-4 pt-3 pb-8 font-sans" dir="rtl">
      
      {/* هدر */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-base sm:text-lg">خرید و فروش طلا</h1>
        <span className="text-[9px] bg-[var(--gold)]/10 text-[var(--gold)] px-1.5 py-0.5 rounded border border-[var(--gold)]/20">معامله نقدی</span>
      </div>

      {/* چیدمان دو ستونی */}
      <div className="flex flex-row items-start gap-2 sm:gap-3">
        
        {/* ستون راست: فرم سفارش */}
        <section className="flex-1 min-w-0 rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-2 sm:p-3">
          
          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[var(--panel-2)] mb-2">
            <button onClick={() => setSide("buy")} className={`h-8 rounded-md text-[10px] font-bold transition ${side === "buy" ? "bg-[var(--green)] text-white" : "text-[var(--muted)]"}`}>خرید</button>
            <button onClick={() => setSide("sell")} className={`h-8 rounded-md text-[10px] font-bold transition ${side === "sell" ? "bg-[var(--red)] text-white" : "text-[var(--muted)]"}`}>فروش</button>
          </div>

          <div className="relative mb-1.5">
            <button onClick={() => setTypeOpen(!typeOpen)} className="w-full h-8 flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 text-[10px]">
              <span className="font-semibold">{orderType === "instant" ? "آنی" : "محدود"}</span>
              <ChevronDown className={`text-[var(--muted)] transition-transform ${typeOpen ? "rotate-180" : ""}`} />
            </button>
            {typeOpen && (
              <div className="absolute z-20 inset-x-0 mt-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-xl overflow-hidden">
                <button onClick={() => { setOrderType("instant"); setTypeOpen(false); }} className={`w-full text-right px-3 py-2 text-[10px] ${orderType === "instant" ? "text-[var(--gold)] font-bold" : ""}`}>آنی</button>
                <button onClick={() => { setOrderType("limit"); setTypeOpen(false); }} className={`w-full text-right px-3 py-2 text-[10px] border-t border-[var(--border)] ${orderType === "limit" ? "text-[var(--gold)] font-bold" : ""}`}>محدود</button>
              </div>
            )}
          </div>

          {showAmountField && (
            <div className="mb-1.5">
              <label className="text-[9px] text-[var(--muted)] mb-0.5 block">مبلغ (تومان)</label>
              <div className="h-9 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 flex items-center">
                <input type="text" inputMode="numeric" value={amountInput ? Number(amountInput).toLocaleString("en-US") : ""} onChange={(e) => setAmountInput(toEnDigits(e.target.value).replace(/\D/g, ""))} className="w-full bg-transparent text-center text-[11px] font-bold font-mono text-[var(--text)] outline-none" dir="ltr" />
              </div>
            </div>
          )}

          {showGramsField && (
            <div className="mb-1.5">
              <label className="text-[9px] text-[var(--muted)] mb-0.5 block">{qtyLabel}</label>
              <div className="flex items-center h-9 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 overflow-hidden">
                <input type="text" inputMode={isIntegerUnit ? "numeric" : "decimal"} value={gramsInput} onChange={(e) => setGramsInput(toEnDigits(e.target.value).replace(/[^\d.]/g, ""))} className="w-full bg-transparent text-center text-[11px] font-bold font-mono text-[var(--text)] outline-none" dir="ltr" />
              </div>
            </div>
          )}

          <div className="mb-2">
            <div className="text-[9px] text-[var(--muted)] mb-1">درصد موجودی</div>
            <div dir="ltr" className="grid grid-cols-4 gap-1">
              {[25, 50, 75, 100].map((p) => (
                <button key={p} onClick={() => setMarginPercent(p)} className={`h-6 rounded-full text-[8.5px] font-bold border transition ${percent === p ? (side === "buy" ? "bg-[var(--green)] text-white border-[var(--green)]" : "bg-[var(--red)] text-white border-[var(--red)]") : "bg-[var(--panel-2)] border-[var(--border)] text-[var(--muted)]"}`}>{toFa(String(p))}٪</button>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-[9.5px] mb-2 border-t border-[var(--border)] pt-1.5">
            <div className="flex justify-between text-[var(--muted)]"><span>کارمزد (۱٪)</span><span className="font-mono">{format(fee)} ت</span></div>
            <div className="flex justify-between font-bold border-t border-[var(--border)] pt-1 text-[10px]"><span>{side === "buy" ? "پرداختی" : "دریافتی"}</span><span className={`font-mono ${side === "buy" ? "text-[var(--red)]" : "text-[var(--green)]"}`}>{format(total)} ت</span></div>
          </div>

          <button onClick={() => setShowConfirm(true)} disabled={grams <= 0 || !enoughBalance} className={`w-full h-9 rounded-lg text-[10px] font-bold text-white transition ${side === "buy" ? "bg-[var(--green)]" : "bg-[var(--red)]"} disabled:opacity-40`}>
            {side === "buy" ? "خرید" : "فروش"} {symbol.label}
          </button>
        </section>

        {/* ستون چپ: کارت اطلاعات دارایی */}
        <aside className="w-[120px] sm:w-40 shrink-0 space-y-1.5">
          <button onClick={() => setSymbolOpen(true)} className="w-full text-right rounded-xl border border-[var(--gold)]/40 p-2 transition hover:border-[var(--gold)]" style={{ background: "rgba(196,168,117,0.08)" }}>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold text-[var(--gold)] truncate">{symbol.label}</span>
              <ExchangeIcon />
            </div>
            <div className="text-[11px] font-bold font-mono text-[var(--text)] break-words">{format(symbol.price)}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`font-bold text-[9px] font-mono ${symbol.change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{symbol.change >= 0 ? "+" : ""}{toFa(String(symbol.change))}٪</span>
            </div>
          </button>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5">
            <div className="text-[9px] text-[var(--muted)]">{balanceLabel}</div>
            <div className="text-[11px] font-bold font-mono mt-0.5">{isIntegerUnit ? toFa(String(Math.round(GOLD_BALANCE))) : toFa(GOLD_BALANCE.toFixed(3))}</div>
            <div className="text-[8px] text-[var(--muted)]">{unitWord}</div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5">
            <div className="text-[9px] text-[var(--muted)]">موجودی ریال</div>
            <div className="text-[11px] font-bold font-mono mt-0.5">{format(CASH_BALANCE)}</div>
            <div className="text-[8px] text-[var(--muted)]">تومان</div>
          </div>
        </aside>
      </div>

      {/* مودال انتخاب نماد (همون قبلی) */}
      {symbolOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSymbolOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">انتخاب دارایی</h2>
              <button onClick={() => setSymbolOpen(false)} className="text-[var(--muted)] text-xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {symbols.map((sym) => (
                <button key={sym.id} onClick={() => { setSymbol(sym); setPrice(sym.price); setSymbolOpen(false); }} className={`text-right rounded-lg border p-2 transition ${sym.id === symbol.id ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--border)] hover:bg-[var(--panel-2)]"}`}>
                  <div className="text-[11px] font-bold">{sym.label}</div>
                  <div className="text-[10px] font-mono mt-1">{format(sym.price)} <span className="text-[8px] text-[var(--muted)]">ت</span></div>
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
              <h2 className="font-bold text-sm mb-1">تأیید نهایی</h2>
              <p className="text-[10px] text-[var(--muted)]">آیا از انجام این معامله مطمئن هستید؟</p>
            </div>
            <div className="rounded-lg bg-[var(--bg)] p-3 mb-3 text-center">
              <div className="text-lg font-black font-mono">{toFa(grams.toFixed(isIntegerUnit ? 0 : 3))} {unitWord}</div>
              <div className="text-[10px] text-[var(--muted)] mt-1">به ارزش {format(total)} تومان</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 h-9 rounded-lg border border-[var(--border)] text-[10px] font-bold text-[var(--muted)]">انصراف</button>
              <button onClick={handleConfirmTrade} className={`flex-1 h-9 rounded-lg text-white text-[10px] font-bold ${side === "buy" ? "bg-[var(--green)]" : "bg-[var(--red)]"}`}>تأیید</button>
            </div>
          </div>
        </div>
      )}

      {completedTrade && <TradeInvoice trade={completedTrade} onClose={() => setCompletedTrade(null)} />}
    </div>
  );
}