"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import TradeInvoice, { type TradeInvoiceData } from "@/components/TradeInvoice";

const FEE_RATE = 0.01;
const CASH_BALANCE = 245_000_000;
const LAST_UPDATE = "۰۹:۴۲";

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

const SYMBOLS: SymbolItem[] = [
  { id: "gold18",      label: "طلای ۱۸ عیار", price: 19_080_000,  change:  1.25, unit: "گرم",  kind: "gold",     balance: 12.45 },
  { id: "coin-emami",  label: "سکه امامی",     price: 185_000_000, change:  1.10, unit: "عدد",  kind: "coin",     balance: 2     },
  { id: "coin-bahar",  label: "بهار آزادی",    price: 175_000_000, change:  0.95, unit: "عدد",  kind: "coin",     balance: 1     },
  { id: "coin-half",   label: "نیم سکه ۸۶",    price:  95_000_000, change:  0.70, unit: "عدد",  kind: "coin",     balance: 3     },
  { id: "coin-quarter",label: "ربع سکه ۸۶",    price:  52_000_000, change:  0.50, unit: "عدد",  kind: "coin",     balance: 5     },
  { id: "usd",         label: "دلار",          price:      62_000, change: -0.15, unit: "دلار", kind: "currency", balance: 500   },
  { id: "usdt",        label: "USDT",          price:      61_500, change:  0.10, unit: "تتر",  kind: "currency", balance: 1200  },
];

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toFa = (s: string) =>
  s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/\./g, "٫");
const toFaInt = (s: string) =>
  s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}
function ExchangeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
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
  const [symbol, setSymbol] = useState<SymbolItem>(SYMBOLS[0]);
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("instant");
  const [price, setPrice] = useState(SYMBOLS[0].price);
  const [amountInput, setAmountInput] = useState(String(SYMBOLS[0].price));
  const [gramsInput, setGramsInput] = useState("1");
  const [lastEdited, setLastEdited] = useState<"amount" | "grams">("grams");
  const [percent, setPercent] = useState<number | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
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
  const enoughBalance =
    side === "buy" ? total <= CASH_BALANCE : grams <= GOLD_BALANCE;

  const showPriceField = orderType === "limit";
  const showAmountField =
    orderType === "instant" || (orderType === "limit" && side === "buy");
  const showGramsField =
    orderType === "instant" || (orderType === "limit" && side === "sell");

  const unitWord = symbol.unit;
  const qtyLabel =
    symbol.kind === "gold"
      ? "مقدار طلا (گرم)"
      : symbol.kind === "coin"
      ? "تعداد سکه (عدد)"
      : `مقدار (${symbol.unit})`;
  const balanceLabel =
    symbol.kind === "gold"
      ? "موجودی طلا"
      : symbol.kind === "coin"
      ? "موجودی سکه"
      : "موجودی ارز";
  const percentLabel =
    side === "buy"
      ? "درصد از موجودی ریالی"
      : symbol.kind === "gold"
      ? "درصد از موجودی طلا"
      : symbol.kind === "coin"
      ? "درصد از موجودی سکه"
      : "درصد از موجودی ارز";

  const fmtQty = (n: number) =>
    toFa(isIntegerUnit ? String(Math.round(n)) : n.toFixed(4));
  const fmtBalance = (n: number) =>
    toFa(n.toFixed(symbol.kind === "gold" ? 3 : 0));

  function computeUnits(amountValue: number): number {
    if (!isIntegerUnit) return amountValue / effectivePrice;
    if (amountValue <= 0) return 0;

    const raw = amountValue / effectivePrice;
    const rounded = Math.round(raw);
    const floor = Math.floor(raw);
    const tolerance = Math.max(1000, effectivePrice * 0.01);

    if (side === "sell") {
      if (rounded > GOLD_BALANCE) {
        return Math.min(floor, Math.floor(GOLD_BALANCE));
      }
      if (rounded * effectivePrice <= amountValue + tolerance) {
        return rounded;
      }
      return floor;
    }

    const maxUnits = Math.floor(
      CASH_BALANCE / (effectivePrice * (1 + FEE_RATE))
    );
    if (rounded > maxUnits) {
      return Math.min(floor, maxUnits);
    }
    if (rounded * effectivePrice <= amountValue + tolerance) {
      return rounded;
    }
    return floor;
  }

  function updateAmount(v: string) {
    const clean = v.replace(/,/g, "").replace(/\D/g, "");
    setAmountInput(clean);
    setLastEdited("amount");
    setPercent(null);
    setShowConfirm(false);
    setMessage("");
    if (clean === "") {
      setGramsInput("");
      return;
    }
    const num = Number(clean);
    if (!Number.isFinite(num)) {
      setGramsInput("");
      return;
    }
    if (isIntegerUnit) {
      setGramsInput(String(computeUnits(num)));
    } else {
      setGramsInput((num / effectivePrice).toFixed(4));
    }
  }

  function handleAmountBlur() {
    if (!isIntegerUnit || amountInput === "") return;
    const num = Number(amountInput);
    const units = Number(gramsInput);
    if (!Number.isFinite(num) || !Number.isFinite(units)) return;
    const actual = units * effectivePrice;
    if (Math.abs(actual - num) > 0.5) {
      setAmountInput(String(actual));
    }
  }

  function updateGrams(v: string) {
    let clean = v;
    if (isIntegerUnit) {
      clean = v.split(".")[0].replace(/[^\d]/g, "");
    }
    setGramsInput(clean);
    setLastEdited("grams");
    setPercent(null);
    setShowConfirm(false);
    setMessage("");
    if (clean === "") {
      setAmountInput("");
      return;
    }
    const num = Number(clean);
    if (!Number.isFinite(num)) {
      setAmountInput("");
      return;
    }
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
          if (side === "sell" && units > GOLD_BALANCE) {
            units = Math.floor(GOLD_BALANCE);
          }
          if (side === "buy") {
            const maxU = Math.floor(CASH_BALANCE / (p * (1 + FEE_RATE)));
            if (units > maxU) units = maxU;
          }
          setGramsInput(String(units));
        } else {
          setGramsInput((num / p).toFixed(4));
        }
      }
    }
    setShowConfirm(false);
    setMessage("");
  }

  function applyPercent(p: number) {
    setPercent(p);
    setShowConfirm(false);
    setMessage("");
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
    setShowConfirm(false);
    setMessage("");
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
          } else {
            setGramsInput((num / price).toFixed(4));
          }
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
    setShowConfirm(false);
    setMessage("");
    if (next === "instant") {
      const num = Number(gramsInput);
      if (Number.isFinite(num))
        setAmountInput(String(Math.round(num * MARKET_PRICE)));
    } else {
      const nextSource = side === "buy" ? "amount" : "grams";
      setLastEdited(nextSource);
      if (nextSource === "amount") {
        const num = Number(amountInput);
        if (Number.isFinite(num)) {
          if (isIntegerUnit) {
            let units = Math.round(num / price);
            const maxU = Math.floor(CASH_BALANCE / (price * (1 + FEE_RATE)));
            if (units > maxU) units = maxU;
            setGramsInput(String(units));
          } else {
            setGramsInput((num / price).toFixed(4));
          }
        }
      } else {
        const num = Number(gramsInput);
        if (Number.isFinite(num)) setAmountInput(String(Math.round(num * price)));
      }
    }
  }

  function changeSymbol(id: string) {
    const sym = SYMBOLS.find((s) => s.id === id);
    if (!sym) return;
    setSymbol(sym);
    setPrice(sym.price);
    setSymbolOpen(false);
    setPercent(null);
    setShowConfirm(false);
    setMessage("");
    if (sym.kind === "gold") {
      setGramsInput("1");
      setAmountInput(String(sym.price));
    } else {
      const affordable =
        side === "buy"
          ? Math.floor(CASH_BALANCE / (sym.price * (1 + FEE_RATE)))
          : Math.floor(sym.balance);
      const initial = Math.min(1, Math.max(0, affordable));
      setGramsInput(String(initial));
      setAmountInput(String(initial * sym.price));
    }
    setLastEdited("grams");
  }

    function handleConfirmTrade() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateTime = `${toFa(pad(now.getHours()))}:${toFa(pad(now.getMinutes()))} · ${toFa(
      String(now.getFullYear())
    )}/${toFa(String(now.getMonth() + 1))}/${toFa(String(now.getDate()))}`;
    const trackingCode = "TRD-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    // نرمال‌سازی اطلاعات کاربر با fallback
    const buyerName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "کاربر کیف زرگر";
    const buyerNationalId = (user?.nationalId || "").trim();
    const buyerPhone = (user?.phone || "").trim();

    // دیباگ — بعد از تست حذف کن
    console.log("🔍 Buyer Info:", { buyerName, buyerNationalId, buyerPhone, rawUser: user });

    setCompletedTrade({
      trackingCode,
      dateTime,
      side,
      orderType,
      symbolName: symbol.label,
      unit: symbol.unit,
      amount: grams,
      price: effectivePrice,
      total: amount,
      fee,
      finalAmount: total,
      paymentMethod: "rial",
      buyer: {
        name: buyerName,
        nationalId: buyerNationalId,
        phone: buyerPhone,
      },
    });
    setShowConfirm(false);
  }

  const submitLabel = side === "buy" ? "خرید" : "فروش";
  const accentBg =
    side === "buy"
      ? "bg-emerald-500 hover:bg-emerald-600"
      : "bg-red-500 hover:bg-red-600";

  const amountDiffers =
    isIntegerUnit &&
    showAmountField &&
    amountInput !== "" &&
    Math.abs(amount - Number(amountInput)) > 0.5;

  return (
    <>
      <div dir="rtl" className="flex flex-row items-start gap-2 sm:gap-3">
        <section className="flex-1 min-w-0 rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-2 sm:p-2.5">
          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[var(--panel-2)] mb-2">
            <button
              onClick={() => changeSide("buy")}
              className={`h-10 rounded-md text-xs sm:text-sm font-bold transition ${
                side === "buy" ? "bg-emerald-500 text-white" : "text-[var(--muted)]"
              }`}
            >
              خرید
            </button>
            <button
              onClick={() => changeSide("sell")}
              className={`h-10 rounded-md text-xs sm:text-sm font-bold transition ${
                side === "sell" ? "bg-red-500 text-white" : "text-[var(--muted)]"
              }`}
            >
              فروش
            </button>
          </div>

          <div className="relative mb-1.5">
            <button
              onClick={() => setTypeOpen((v) => !v)}
              className="w-full h-9 flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 text-xs sm:text-sm"
            >
              <span className="font-semibold">
                {orderType === "instant" ? "آنی" : "سفارش قیمت"}
              </span>
              <ChevronDown
                className={`text-[var(--muted)] transition-transform ${
                  typeOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {typeOpen && (
              <>
                <div className="fixed inset-0 z-[5]" onClick={() => setTypeOpen(false)} />
                <div className="absolute z-10 inset-x-0 mt-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-xl overflow-hidden">
                  <button
                    onClick={() => changeOrderType("instant")}
                    className={`w-full text-right px-3 py-2 text-xs sm:text-sm hover:bg-[var(--panel-2)] ${
                      orderType === "instant" ? "text-[var(--gold)]" : ""
                    }`}
                  >
                    آنی (قیمت لحظه‌ای)
                  </button>
                  <button
                    onClick={() => changeOrderType("limit")}
                    className={`w-full text-right px-3 py-2 text-xs sm:text-sm hover:bg-[var(--panel-2)] border-t border-[var(--border)] ${
                      orderType === "limit" ? "text-[var(--gold)]" : ""
                    }`}
                  >
                    سفارش قیمت
                  </button>
                </div>
              </>
            )}
          </div>

          {showPriceField && (
            <div className="mb-1.5">
              <div className="text-[11px] text-[var(--muted)] mb-0.5">
                قیمت دلخواه (تومان)
              </div>
              <div className="flex items-center h-10 rounded-md border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
                <button
                  onClick={() => changePrice(Math.max(0, price - 10000))}
                  className="h-full px-2 text-[var(--muted)] hover:text-[var(--text)]"
                  aria-label="کاهش"
                >
                  <MinusIcon />
                </button>
                <input
                  type="number"
                  step={10000}
                  min={0}
                  value={price}
                  onChange={(e) => changePrice(Math.max(0, Number(e.target.value) || 0))}
                  className="flex-1 min-w-0 h-full bg-transparent text-center text-sm sm:text-base font-bold text-[var(--text)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => changePrice(price + 10000)}
                  className="h-full px-2 text-[var(--muted)] hover:text-[var(--text)]"
                  aria-label="افزایش"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
          )}

          {showAmountField && (
            <div className="mb-1.5">
              <div className="text-[11px] text-[var(--muted)] mb-0.5">مبلغ (تومان)</div>
              <div className="h-10 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    amountInput === ""
                      ? ""
                      : Number(amountInput).toLocaleString("en-US")
                  }
                  onChange={(e) => updateAmount(e.target.value)}
                  onBlur={handleAmountBlur}
                  placeholder="۰"
                  className="w-full bg-transparent text-center text-sm sm:text-base font-bold text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
                />
              </div>
            </div>
          )}

          {showGramsField && (
            <div className="mb-1.5">
              <div className="text-[11px] text-[var(--muted)] mb-0.5">{qtyLabel}</div>
              <div className="flex items-center h-10 rounded-md border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
                <button
                  onClick={() => {
                    const next = Math.max(0, grams - unitStep);
                    updateGrams(
                      isIntegerUnit ? String(Math.round(next)) : next.toFixed(4)
                    );
                  }}
                  className="h-full px-2 text-[var(--muted)] hover:text-[var(--text)]"
                  aria-label="کاهش"
                >
                  <MinusIcon />
                </button>
                <input
                  type={isIntegerUnit ? "text" : "number"}
                  inputMode={isIntegerUnit ? "numeric" : "decimal"}
                  {...(!isIntegerUnit && { min: 0, step: "any" })}
                  value={gramsInput}
                  onChange={(e) => updateGrams(e.target.value)}
                  placeholder="۰"
                  className="flex-1 min-w-0 h-full bg-transparent text-center text-sm sm:text-base font-bold text-[var(--text)] placeholder:text-[var(--muted)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => {
                    const next = grams + unitStep;
                    updateGrams(
                      isIntegerUnit ? String(Math.round(next)) : next.toFixed(4)
                    );
                  }}
                  className="h-full px-2 text-[var(--muted)] hover:text-[var(--text)]"
                  aria-label="افزایش"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
          )}

          <div className="mb-2">
            <div className="text-[11px] text-[var(--muted)] mb-1">{percentLabel}</div>
            <div dir="ltr" className="grid grid-cols-4 gap-1.5">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => applyPercent(p)}
                  className={`h-7 rounded-full text-[10.5px] font-bold border transition-all ${
                    percent === p
                      ? side === "buy"
                        ? "border-emerald-400 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : "border-red-400 bg-red-500 text-white shadow-sm shadow-red-500/30"
                      : side === "buy"
                      ? "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400 hover:bg-emerald-500/20"
                      : "border-red-500/25 bg-red-500/[0.08] text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  {toFaInt(String(p))}٪
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-0.5 text-[11px] mb-2">
            {orderType === "limit" && side === "buy" && (
              <div className="flex justify-between text-[var(--muted)]">
                <span>مقدار</span>
                <span className="text-[var(--gold)] font-semibold">
                  {fmtQty(grams)} {unitWord}
                </span>
              </div>
            )}
            {orderType === "limit" && side === "sell" && (
              <div className="flex justify-between text-[var(--muted)]">
                <span>مبلغ</span>
                <span className="text-[var(--gold)] font-semibold">
                  {format(amount)} تومان
                </span>
              </div>
            )}
            {amountDiffers && (
              <div className="flex justify-between text-[var(--muted)]">
                <span className="text-amber-400">با تعداد صحیح</span>
                <span className="text-amber-400 font-semibold">
                  {format(amount)} تومان
                </span>
              </div>
            )}
            <div className="flex justify-between text-[var(--muted)]">
              <span>کارمزد (۱٪)</span>
              <span>{format(fee)} تومان</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>موجودی قابل استفاده</span>
              <span>
                {side === "buy"
                  ? `${format(CASH_BALANCE)} تومان`
                  : `${fmtBalance(GOLD_BALANCE)} ${unitWord}`}
              </span>
            </div>
            <div className="flex justify-between font-bold border-t border-[var(--border)] pt-1 text-xs sm:text-sm">
              <span>{side === "buy" ? "مبلغ پرداختی" : "مبلغ دریافتی"}</span>
              <span className={side === "buy" ? "text-emerald-400" : "text-red-400"}>
                {format(total)} تومان
              </span>
            </div>
          </div>

          {!enoughBalance && grams > 0 && (
            <p className="text-red-400 text-[10px] mb-1.5">
              موجودی شما برای این معامله کافی نیست.
            </p>
          )}

          <button
            onClick={() => {
              setShowConfirm(true);
              setMessage("");
            }}
            disabled={grams <= 0 || !enoughBalance}
            className={`w-full h-11 rounded-lg text-xs sm:text-sm font-bold text-white disabled:opacity-40 transition ${accentBg}`}
          >
            {submitLabel} {symbol.label}
          </button>
        </section>

        <aside className="w-[118px] sm:w-40 md:w-64 shrink-0 space-y-1.5 sm:space-y-2.5">
          <button
            type="button"
            onClick={() => setSymbolOpen(true)}
            className="w-full text-right rounded-xl sm:rounded-2xl border border-[var(--gold)]/40 p-2 sm:p-3 transition group hover:border-[var(--gold)] hover:shadow-[0_0_0_3px_var(--gold)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
            style={{ background: "rgba(196,168,117,0.12)" }}
            aria-haspopup="dialog"
            aria-label="انتخاب دارایی"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-sm font-bold text-[var(--gold)] truncate">
                {symbol.label}
              </span>
              <ExchangeIcon />
            </div>
            <div className="text-xs sm:text-base font-bold mt-0.5 text-[var(--text)] break-words leading-tight">
              {format(symbol.price)}
              <span className="text-[9px] font-normal text-[var(--muted)] mr-1">
                تومان
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span
                className={`font-bold text-[11px] ${
                  symbol.change >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {symbol.change >= 0 ? "+" : ""}
                {toFa(String(symbol.change))}٪
              </span>
              <span className="text-[var(--muted)] text-[10px]">·</span>
              <ClockIcon className="text-[var(--muted)]" />
              <span className="text-[var(--muted)] text-[10px]">{LAST_UPDATE}</span>
            </div>
            <div className="mt-1 text-[9px] text-[var(--gold)]/80 flex items-center gap-1 group-hover:text-[var(--gold)]">
              <span>تغییر دارایی</span>
              <ChevronDown className="rotate-0" />
            </div>
          </button>

          <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-2 sm:px-3 py-1.5 sm:py-2.5">
            <div className="text-[10px] sm:text-xs text-[var(--muted)]">{balanceLabel}</div>
            <div className="text-xs sm:text-base font-bold mt-0.5">
              {fmtBalance(GOLD_BALANCE)}
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">{unitWord}</div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-2 sm:px-3 py-1.5 sm:py-2.5">
            <div className="text-[10px] sm:text-xs text-[var(--muted)]">موجودی ریال</div>
            <div className="text-xs sm:text-base font-bold mt-0.5 break-words leading-tight">
              {format(CASH_BALANCE)}
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">تومان</div>
          </div>
        </aside>
      </div>

      <p className="text-center text-[10px] text-[var(--muted)] mt-2">
        نسخه آزمایشی کیف زرگر | قیمت‌ها نمایشی هستند.
      </p>

      {symbolOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSymbolOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="انتخاب دارایی"
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-base">انتخاب دارایی</h2>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">
                  یکی از نمادها را انتخاب کن
                </p>
              </div>
              <button
                onClick={() => setSymbolOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] text-2xl leading-none w-9 h-9 grid place-items-center"
                aria-label="بستن"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SYMBOLS.map((sym) => {
                const active = sym.id === symbol.id;
                return (
                  <button
                    key={sym.id}
                    onClick={() => changeSymbol(sym.id)}
                    className={`text-right rounded-xl border p-2.5 transition ${
                      active
                        ? "border-[var(--gold)] bg-[var(--gold)]/10 shadow-[0_0_0_2px_var(--gold)]/20"
                        : "border-[var(--border)] hover:bg-[var(--panel-2)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold ${
                          active ? "text-[var(--gold)]" : ""
                        }`}
                      >
                        {sym.label}
                      </span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold mt-1">
                      {format(sym.price)}{" "}
                      <span className="text-[9px] text-[var(--muted)]">تومان</span>
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 font-bold ${
                        sym.change >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {sym.change >= 0 ? "+" : ""}
                      {toFa(String(sym.change))}٪
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowConfirm(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">تأیید نهایی</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] text-2xl leading-none"
                aria-label="بستن"
              >
                ×
              </button>
            </div>
            <div className="text-center py-4 rounded-xl bg-[var(--bg)] mb-4">
              <p className="text-sm text-[var(--muted)] mb-2">
                {side === "buy" ? "خرید" : "فروش"} {symbol.label}
              </p>
              <div className="text-2xl font-bold text-[var(--gold)]">
                {fmtQty(grams)} {unitWord}
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">
                {format(amount)} تومان ارزش معامله
              </p>
              {orderType === "limit" && (
                <p className="text-xs text-[var(--muted)] mt-1">
                  قیمت سفارش: {format(price)} تومان
                </p>
              )}
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">کارمزد</span>
                <span>{format(fee)} تومان</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2.5">
                <span className="font-bold">مبلغ نهایی</span>
                <span
                  className={`font-bold ${
                    side === "buy" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {format(total)} تومان
                </span>
              </div>
            </div>
            <button
              onClick={handleConfirmTrade}
              className={`w-full rounded-xl py-3 font-bold text-white text-sm ${accentBg}`}
            >
              تأیید آزمایشی
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full mt-2 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
            >
              بازگشت و ویرایش
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="fixed bottom-5 left-4 right-4 z-[60] rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-center text-sm text-[var(--gold)] shadow-xl">
          {message}
        </div>
      )}

      {completedTrade && (
        <TradeInvoice
          trade={completedTrade}
          onClose={() => setCompletedTrade(null)}
        />
      )}
    </>
  );
}