"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, toFa, toEnDigits } from "@/lib/format";
import { SETTINGS } from "@/lib/settings";
import { useToast } from "@/components/ui/Toast";

type Side = "buy" | "sell";

const P2P_FEE_RATE = 0.001;

const generateP2POrderBook = (basePrice: number) => {
  const asks = [];
  const bids = [];

  for (let i = 0; i < 6; i++) {
    asks.push({
      id: `a-${i}`,
      price: basePrice + (i + 1) * 5_000,
      amount: Math.floor(Math.random() * 20 + 2),
    });

    bids.push({
      id: `b-${i}`,
      price: basePrice - (i + 1) * 5_000,
      amount: Math.floor(Math.random() * 20 + 2),
    });
  }

  asks.sort((a, b) => a.price - b.price);
  bids.sort((a, b) => b.price - a.price);

  return { asks, bids };
};

export default function P2PTradingPage() {
  const router = useRouter();
  const marketPrice = SETTINGS.fees.goldPrice;
  const toast = useToast();

  const [side, setSide] = useState<Side>("buy");
  const [amountGold, setAmountGold] = useState<string>("");
  const [pricePerGram, setPricePerGram] = useState<string>(marketPrice.toString());
  const [activePercent, setActivePercent] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectedFromBook, setIsSelectedFromBook] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("p2p-guide-seen");
    if (!hasSeen) {
      setShowGuide(true);
      localStorage.setItem("p2p-guide-seen", "true");
    }
  }, []);

  const userGoldBalance = 12.45;
  const userTomanBalance = 500_000_000;

  const orderBook = useMemo(() => generateP2POrderBook(marketPrice), [marketPrice]);

  const amountNum = Number(amountGold) || 0;
  const priceNum = Number(pricePerGram) || 0;
  const totalToman = amountNum * priceNum;

  const feeToman = totalToman * P2P_FEE_RATE;
  const feeGold = feeToman / priceNum;

  const isValid = amountNum > 0.1 && priceNum > 0 && (side === "buy" ? totalToman + feeToman <= userTomanBalance : amountNum <= userGoldBalance);

  function handleSelectOffer(price: number) {
    setPricePerGram(price.toString());
    setIsSelectedFromBook(true);
    setAmountGold("");
    setActivePercent(null);
  }

  function setAmountPercent(percent: number) {
    if (side === "buy") {
      const maxGold = userTomanBalance / (priceNum * (1 + P2P_FEE_RATE));
      setAmountGold((maxGold * (percent / 100)).toFixed(3));
    } else {
      setAmountGold((userGoldBalance * (percent / 100)).toFixed(3));
    }
    setActivePercent(percent);
  }

  function handleAmountChange(val: string) {
    setAmountGold(val);
    setActivePercent(null);
  }

  function handleSubmit() {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAmountGold("");
      setActivePercent(null);
      setIsSelectedFromBook(false);
      toast.success(`درخواست ${side === "buy" ? "خرید" : "فروش"} با موفقیت ثبت شد`);
    }, 800);
  }

  const TradeSummary = () => {
    if (amountNum <= 0) return null;
    const isBuy = side === "buy";

    return (
      <div className={`rounded-lg border p-2.5 text-[10.5px] space-y-1.5 h-fit shadow-sm transition-all duration-300 mb-2 ${
        isBuy
          ? "border-[var(--green)]/30 bg-[var(--green)]/5"
          : "border-[var(--red)]/30 bg-[var(--red)]/5"
      }`}>
        <div className="flex justify-between items-center border-b border-[var(--border)] pb-1.5 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] text-[var(--text)]">خلاصه معامله</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${
              isBuy
                ? "bg-[var(--green)] text-white border-[var(--green)]"
                : "bg-[var(--red)] text-white border-[var(--red)]"
            }`}>
              {isBuy ? "خرید" : "فروش"}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--muted)]">مقدار طلا</span>
          <span className="font-bold text-[11px] font-mono">{toFa(amountNum.toFixed(3))} گرم</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--muted)]">قیمت هر گرم</span>
          <span className="font-bold text-[var(--text)] font-mono">{format(priceNum)} ت</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--muted)]">کارمزد پلتفرم (۰.۱٪)</span>
          <span className="font-bold text-amber-400 font-mono">
            {isBuy ? `${format(feeToman)} ت` : `${toFa(feeGold.toFixed(4))} گرم`}
          </span>
        </div>

        <div className="flex justify-between items-center pt-1.5 border-t border-[var(--border)] mt-0.5">
          <span className="text-[var(--muted)] font-bold">مبلغ کل (تومان)</span>
          <span className={`font-black text-[12px] px-1.5 py-0.5 rounded font-mono ${
            isBuy ? "text-[var(--red)] bg-[var(--red)]/10" : "text-[var(--green)] bg-[var(--green)]/10"
          }`}>{format(totalToman)} ت</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100dvh-130px)] flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans" dir="rtl">

      <div className="flex items-center justify-between px-3 py-1 border-b border-[var(--border)] bg-[var(--panel)] shrink-0 h-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold">طلا / تومان</span>
            <span className="text-[9px] text-[var(--muted)] bg-[var(--gold)]/10 text-[var(--gold)] px-1.5 py-0.5 rounded border border-[var(--gold)]/20">P2P نقدی</span>
            <button onClick={() => setShowGuide(true)} className="text-[var(--muted)] hover:text-[var(--gold)] transition mr-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-2 border-r border-[var(--border)] pr-3">
            <span className="text-sm font-black text-[var(--green)]">{format(marketPrice)}</span>
          </div>
        </div>
        <div className="text-[9px] text-[var(--muted)] flex gap-3">
          <div className="flex items-center gap-1"><span>بالاترین:</span><span className="text-[var(--text)] font-mono">{format(marketPrice + 20_000)}</span></div>
          <div className="flex items-center gap-1"><span>پایین‌ترین:</span><span className="text-[var(--text)] font-mono">{format(marketPrice - 20_000)}</span></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        <div className="hidden lg:flex w-[280px] border-l border-[var(--border)] flex-col shrink-0 bg-[var(--panel)]">
          <div className="grid grid-cols-2 text-[8.5px] text-[var(--muted)] p-1.5 bg-[var(--panel-2)] border-b border-[var(--border)]">
            <span className="text-right">قیمت (تومان)</span>
            <span className="text-left">مقدار (گرم)</span>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            {orderBook.asks.map((ask, i) => (
              <div key={ask.id} onClick={() => { setSide("buy"); handleSelectOffer(ask.price); }} className="relative grid grid-cols-2 px-2 py-[4px] text-[9.5px] cursor-pointer hover:bg-white/5 transition border-b border-[var(--border)]/30 last:border-0">
                <div className="absolute inset-y-0 right-0 bg-[var(--red)]/10" style={{ width: `${(ask.amount / 25) * 100}%` }} />
                <span className="text-[var(--red)] text-right z-10 font-mono">{format(ask.price)}</span>
                <span className="text-[var(--text)] text-left z-10 font-mono" dir="ltr">{toFa(String(ask.amount))}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 px-2 py-1.5 bg-[var(--panel-2)] border-y border-[var(--border)] items-center">
            <span className="text-[12px] font-black text-[var(--green)] text-right">{format(marketPrice)}</span>
            <span className="text-[8px] text-[var(--muted)] text-left">قیمت بازار</span>
          </div>

          <div className="flex-1 flex flex-col">
            {orderBook.bids.map((bid, i) => (
              <div key={bid.id} onClick={() => { setSide("sell"); handleSelectOffer(bid.price); }} className="relative grid grid-cols-2 px-2 py-[4px] text-[9.5px] cursor-pointer hover:bg-white/5 transition border-b border-[var(--border)]/30 last:border-0">
                <div className="absolute inset-y-0 right-0 bg-[var(--green)]/10" style={{ width: `${(bid.amount / 25) * 100}%` }} />
                <span className="text-[var(--green)] text-right z-10 font-mono">{format(bid.price)}</span>
                <span className="text-[var(--text)] text-left z-10 font-mono" dir="ltr">{toFa(String(bid.amount))}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto p-2 lg:max-w-[360px] lg:border-l lg:border-[var(--border)] mx-auto w-full">

          <div className="flex justify-between items-center text-[9px] mb-1.5 bg-[var(--panel-2)] p-1.5 rounded border border-[var(--border)]">
            <div className="flex flex-col">
              <span className="text-[var(--muted)]">{side === "buy" ? "موجودی تومانی:" : "موجودی طلایی:"}</span>
              <span className="font-bold text-[var(--text)]">
                {side === "buy" ? `${format(userTomanBalance)} تومان` : `${toFa(userGoldBalance.toString())} گرم`}
              </span>
            </div>
            <div className="flex flex-col border-r border-[var(--border)] pr-1.5 text-left">
              <span className="text-[var(--muted)]">کیف پول:</span>
              <span className="font-bold text-[var(--gold)]">کیف زرگر</span>
            </div>
          </div>

          <div className="mb-1.5">
            <div className="flex gap-1.5 mb-1.5">
              <button onClick={() => { setSide("buy"); setIsSelectedFromBook(false); setActivePercent(null); }} className={`flex-1 h-8 rounded font-bold text-[10px] transition ${side === "buy" ? "bg-[var(--green)] text-white shadow-md shadow-[var(--green)]/20" : "bg-[var(--panel-2)] text-[var(--muted)]"}`}>خرید طلا</button>
              <button onClick={() => { setSide("sell"); setIsSelectedFromBook(false); setActivePercent(null); }} className={`flex-1 h-8 rounded font-bold text-[10px] transition ${side === "sell" ? "bg-[var(--red)] text-white shadow-md shadow-[var(--red)]/20" : "bg-[var(--panel-2)] text-[var(--muted)]"}`}>فروش طلا</button>
            </div>

            {isSelectedFromBook && (
              <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/30 p-1 rounded text-[8.5px] text-center text-[var(--gold)] mb-1.5 flex justify-between items-center">
                <span>قیمت از تابلو انتخاب شد.</span>
                <button onClick={() => setIsSelectedFromBook(false)} className="text-[var(--muted)] hover:text-white">✕</button>
              </div>
            )}
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-[9px] mb-0.5">
              <span className="text-[var(--muted)]">قیمت هر گرم (تومان)</span>
            </div>
            <div className="relative flex items-center bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 focus-within:border-[var(--gold)]">
              <input
                type="text" dir="ltr" value={pricePerGram}
                onChange={(e) => {
                  setPricePerGram(toEnDigits(e.target.value).replace(/\D/g, ""));
                  setIsSelectedFromBook(false);
                }}
                className="w-full bg-transparent text-left text-[11px] font-bold outline-none placeholder:text-[var(--muted)]"
              />
              <span className="text-[9px] text-[var(--muted)] mr-1 border-r border-[var(--border)] pr-1">تومان</span>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-[9px] mb-0.5">
              <span className="text-[var(--muted)]">مقدار طلا</span>
              <span className="text-[var(--muted)] text-[8.5px]">حداقل: ۰.۱ گرم</span>
            </div>
            <div className="relative flex items-center bg-[var(--panel-2)] border border-[var(--border)] rounded px-2 h-8 focus-within:border-[var(--gold)]">
              <input
                type="text" dir="ltr" value={amountGold}
                onChange={(e) => handleAmountChange(toEnDigits(e.target.value).replace(/[^\d.]/g, ""))}
                placeholder="0.000"
                className="w-full bg-transparent text-left text-[11px] font-bold outline-none placeholder:text-[var(--muted)] placeholder:font-normal"
              />
              <span className="text-[9px] text-[var(--muted)] mr-1 border-r border-[var(--border)] pr-1">گرم</span>
            </div>

            <div className="flex flex-row-reverse gap-1.5 mt-1.5">
              {[25, 50, 75, 100].map((p) => {
                const isActive = activePercent === p;
                return (
                  <button
                    key={p}
                    onClick={() => setAmountPercent(p)}
                    className={`flex-1 h-6 rounded-full text-[9px] font-bold border transition-all duration-200 ${
                      isActive
                        ? side === "buy"
                          ? "bg-[var(--green)] text-white border-[var(--green)] shadow-sm shadow-[var(--green)]/30"
                          : "bg-[var(--red)] text-white border-[var(--red)] shadow-sm shadow-[var(--red)]/30"
                        : "bg-[var(--panel-2)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--gold)]/50 hover:text-[var(--gold)]"
                    }`}
                  >
                    {toFa(String(p))}٪
                  </button>
                );
              })}
            </div>
          </div>

          {!isValid && amountNum > 0 && (
            <p className="text-[8.5px] text-[var(--red)] mb-1">موجودی کیف پول شما کافی نیست یا مقدار کمتر از حد مجاز است.</p>
          )}

          <TradeSummary />

          <button onClick={handleSubmit} disabled={!isValid || isSubmitting} className={`w-full h-8 rounded text-[10px] font-bold text-white transition ${side === "buy" ? "bg-[var(--green)] hover:bg-[var(--green)]/90" : "bg-[var(--red)] hover:bg-[var(--red)]/90"} disabled:opacity-50`}>
            {isSubmitting ? "در حال ثبت..." : `ثبت درخواست ${side === "buy" ? "خرید" : "فروش"}`}
          </button>
        </div>

        <div className="hidden lg:flex flex-1 bg-[var(--bg)]"></div>
      </div>

      <div className="h-[170px] border-t border-[var(--border)] bg-[var(--panel)] flex flex-col shrink-0">
        <div className="flex items-center border-b border-[var(--border)] px-1">
          <button className="px-3 py-1.5 text-[10px] font-bold border-b-2 border-[var(--gold)] text-[var(--gold)]">سفارشات باز من (۰)</button>
          <button className="px-3 py-1.5 text-[10px] font-bold border-b-2 border-transparent text-[var(--muted)]">تاریخچه معاملات</button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)]">
          <div className="w-8 h-8 rounded-full bg-[var(--panel-2)] flex items-center justify-center mb-1.5 border border-[var(--border)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <span className="text-[9.5px]">در حال حاضر سفارش بازی ندارید.</span>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowGuide(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--panel-2)]">
              <h3 className="font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                <span className="text-[var(--gold)]">ℹ️</span> راهنمای معامله P2P
              </h3>
              <button onClick={() => setShowGuide(false)} className="text-[var(--muted)] hover:text-white transition">✕</button>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] font-bold text-[10px] shrink-0">۱</div>
                <div>
                  <div className="text-[10px] font-bold text-[var(--text)] mb-0.5">انتخاب قیمت</div>
                  <div className="text-[9px] text-[var(--muted)] leading-relaxed">روی بهترین قیمت‌های موجود در تابلو (سمت راست) کلیک کنید.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] font-bold text-[10px] shrink-0">۲</div>
                <div>
                  <div className="text-[10px] font-bold text-[var(--text)] mb-0.5">ثبت سفارش</div>
                  <div className="text-[9px] text-[var(--muted)] leading-relaxed">مقدار طلا را وارد کنید. کارمزد در خلاصه معامله محاسبه می‌شود.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] font-bold text-[10px] shrink-0">۳</div>
                <div>
                  <div className="text-[10px] font-bold text-[var(--text)] mb-0.5">تسویه حساب</div>
                  <div className="text-[9px] text-[var(--muted)] leading-relaxed">موجودی از کیف پول کسر و طلا در حساب امانی قفل می‌شود.</div>
                </div>
              </div>
            </div>
            <div className="p-2.5 border-t border-[var(--border)]">
              <button onClick={() => setShowGuide(false)} className="w-full h-8 rounded bg-[var(--gold)] text-black font-bold text-[10px] hover:bg-[var(--gold)]/90 transition">فهمیدم</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}