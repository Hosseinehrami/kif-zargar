"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const periods = ["۱ ساعت", "۴ ساعت", "۱ روز", "۱ هفته", "۱ ماه"];

// ---------- Icons ----------
function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function FlipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2.1l4 4-4 4" /><path d="M3 12.2v-2a4 4 0 0 1 4-4h14" /><path d="M7 21.9l-4-4 4-4" /><path d="M21 11.8v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function DepositIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" /></svg>;
}
function WithdrawIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9" /><path d="M17 14l-5-5-5 5" /><path d="M4 3h16" /></svg>;
}
function PhysicalGoldIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z" /><path d="M5 15l2-8h10l2 8" /><path d="M9 11h6" /></svg>;
}
function TradeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4" /><path d="M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>;
}
function TransferIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
}

// ---------- Chart ----------
function Chart() {
  const candles = [[54, 46, 60, 40], [48, 57, 62, 43], [57, 49, 61, 44], [49, 40, 53, 35], [40, 45, 51, 37], [45, 34, 49, 30], [34, 39, 45, 29], [39, 29, 44, 25], [29, 36, 41, 24], [36, 25, 40, 21], [25, 31, 36, 19], [31, 23, 37, 19], [23, 28, 34, 18], [28, 18, 33, 14], [18, 25, 30, 12], [25, 17, 29, 12], [17, 22, 27, 11], [22, 13, 27, 9], [13, 19, 25, 8], [19, 12, 24, 7], [12, 16, 22, 6], [16, 10, 21, 5], [10, 15, 20, 5], [15, 8, 20, 3]];
  return (
    <div className="chart-container">
      <div className="chart-area">
        <div className="chart-y-labels"><span>۱۹,۲۰۰,۰۰۰</span><span>۱۹,۱۰۰,۰۰۰</span><span>۱۹,۰۰۰,۰۰۰</span><span>۱۸,۹۰۰,۰۰۰</span><span>۱۸,۸۰۰,۰۰۰</span></div>
        <svg viewBox="0 0 600 240" preserveAspectRatio="none" className="candles">
          {[35, 80, 125, 170, 215].map((y) => <line key={y} x1="0" y1={y} x2="600" y2={y} className="chart-grid" />)}
          {candles.map(([open, close, high, low], i) => {
            const up = close >= open; const color = up ? "#239B72" : "#DC5959"; const x = 12 + i * 24; const top = Math.min(open, close); const height = Math.max(5, Math.abs(close - open));
            return (<g key={i}><line x1={x + 5} x2={x + 5} y1={high} y2={low} stroke={color} strokeWidth="1.5" /><rect x={x} y={top} width="11" height={height} rx="1" fill={color} /></g>);
          })}
          <path d="M0 190 C70 175 100 180 150 145 S240 130 290 105 S390 110 430 72 S520 65 600 30" fill="none" stroke="#C4A875" strokeWidth="1.5" opacity=".7" />
        </svg>
      </div>
      <div dir="ltr" className="chart-bottom"><span>۱۰:۰۰</span><span>۱۲:۰۰</span><span>۱۴:۰۰</span><span>۱۶:۰۰</span><span>۱۸:۰۰</span></div>
    </div>
  );
}

// ---------- Live Price Card ----------
type LivePrice = { name: string; price: number; unit: string; change: number; };
function LivePriceCard({ initialData }: { initialData: LivePrice }) {
  const [data, setData] = useState(initialData);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef(initialData.price);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const isUp = Math.random() > 0.5;
        const changeAmount = prev.price * (Math.random() * 0.0015 + 0.0001);
        const newPrice = Math.round(isUp ? prev.price + changeAmount : prev.price - changeAmount);
        const changeDiff = ((newPrice - prev.price) / prev.price) * 100;
        return { ...prev, price: newPrice, change: prev.change + changeDiff };
      });
    }, Math.random() * 3000 + 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data.price > prevPriceRef.current) setFlash("up");
    else if (data.price < prevPriceRef.current) setFlash("down");
    prevPriceRef.current = data.price;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [data.price]);

  return (
    <div className={`rounded-xl border bg-[var(--panel)] p-2.5 transition-all duration-300 ${flash === "up" ? "border-emerald-500/50 bg-emerald-500/10" : flash === "down" ? "border-red-500/50 bg-red-500/10" : "border-[var(--border)]"}`}>
      <span className="text-xs text-[var(--muted)] font-medium">{data.name}</span>
      <div className="mt-1.5">
        <strong className={`block text-sm font-bold transition-colors duration-300 ${flash === "up" ? "text-emerald-400" : flash === "down" ? "text-red-400" : "text-[var(--text)]"}`}>{format(data.price)}</strong>
        <div className="flex items-center justify-between text-[11px] mt-1">
          <span className="text-[var(--muted)]">{data.unit}</span>
          <span className={data.change >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{data.change >= 0 ? "+" : ""}{data.change.toFixed(2)}٪</span>
        </div>
      </div>
    </div>
  );
}

const INITIAL_LIVE_PRICES: LivePrice[] = [
  { name: "طلای ۱۸ عیار", price: 19080000, unit: "گرم", change: 1.25 },
  { name: "مظنه (آبشده)", price: 82650000, unit: "مثقال", change: -0.31 },
  { name: "سکه امامی", price: 185000000, unit: "عدد", change: 1.10 },
  { name: "بهار آزادی", price: 175000000, unit: "عدد", change: 0.95 },
  { name: "نیم سکه", price: 95000000, unit: "عدد", change: 0.70 },
  { name: "ربع سکه", price: 52000000, unit: "عدد", change: 0.50 },
  { name: "دلار", price: 62000, unit: "دلار", change: -0.15 },
  { name: "تتر", price: 61500, unit: "تتر", change: 0.10 },
];

const myAssets = [
  { name: "طلای ۱۸ عیار", amount: "۱۲.۴۵۰ گرم", value: "۲۳۷,۵۴۶,۰۰۰" },
  { name: "سکه امامی", amount: "۱ عدد", value: "۱۸۵,۰۰۰,۰۰۰" },
  { name: "نیم سکه", amount: "۱ عدد", value: "۹۵,۰۰۰,۰۰۰" },
  { name: "ربع سکه", amount: "۱ عدد", value: "۵۲,۰۰۰,۰۰۰" },
  { name: "دلار", amount: "۵۰۰ دلار", value: "۳۱,۰۰۰,۰۰۰" },
  { name: "تتر (USDT)", amount: "۱۲۰۰ تتر", value: "۷۳,۸۰۰,۰۰۰" },
  { name: "موجودی ریالی", amount: "۱۷۱,۲۷۴,۰۰۰ تومان", value: "۱۷۱,۲۷۴,۰۰۰" },
];

const banners = [
  { id: 1, title: "تخفیف ویژه کارمزد", desc: "تا ۵۰٪ تخفیف روی معاملات طلا", gradient: "from-amber-600 to-yellow-800", icon: "🎁" },
  { id: 2, title: "دعوت دوستان", desc: "با هر دعوت ۱ گرم طلا هدیه بگیر", gradient: "from-emerald-600 to-teal-800", icon: "👑" },
];

export default function Home() {
  const router = useRouter();
  const [period, setPeriod] = useState("۱ روز");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  
  // استیت برای کپی آدرس
  const [copied, setCopied] = useState(false);
  const walletAddress = "KFZ-1234-5678-90";

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dashboard !pt-3 sm:!pt-5">
      
      {/* ===== کارت کیف پول (تغییر یافته) ===== */}
      <section className="relative rounded-2xl bg-[#1c1e22] dark:bg-[#131518] border border-[#2d3136] shadow-xl mb-3 transition-all duration-300">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--gold)] opacity-10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <div className="text-[var(--gold)] font-black text-sm sm:text-base tracking-wider flex-shrink-0">
              کیف پول زرگر
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => { setIsFlipped(!isFlipped); setIsCollapsed(false); }} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold)] hover:bg-white/10 transition-colors" title="نمایش تفکیک دارایی‌ها">
              <FlipIcon />
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold)] hover:bg-white/10 transition-colors" title={isCollapsed ? "باز کردن" : "بستن"}>
              <ChevronDown open={!isCollapsed} />
            </button>
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100"}`}>
          <div className="px-4 pb-4 pt-0">
            {!isFlipped ? (
              <>
                <div className="text-center mt-1 mb-4">
                  <div className="text-gray-400 text-xs mb-1">موجودی کل دارایی شما</div>
                  <div className="text-white text-2xl sm:text-3xl font-bold tracking-wide flex items-center justify-center gap-2 dir-rtl">
                    {format(845620000)}
                    <span className="text-xs font-normal text-gray-400">تومان</span>
                  </div>
                </div>
                
                {/* آدرس کیف پول و دکمه کپی */}
                <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 mb-0.5">آدرس کیف پول (برای دریافت وجه)</span>
                    <span className="font-mono text-sm text-white font-bold tracking-wider" dir="ltr">{walletAddress}</span>
                  </div>
                  <button onClick={handleCopy} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${copied ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-[var(--gold)] hover:bg-white/10"}`} title="کپی آدرس">
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--gold)] text-[11px]">سطح طلایی</span>
                    <span className="text-sm">🏅</span>
                  </div>
                  <div className="text-gray-300 text-[11px] flex items-center gap-1.5">
                    <span>موجودی طلا:</span>
                    <span className="text-[var(--gold)] font-bold text-xs">۱۲.۴۵۰ گرم</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-[var(--gold)] text-xs mb-1 font-bold">تفکیک دارایی‌های شما</div>
                <div className="divide-y divide-white/5 max-h-56 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {myAssets.map((asset, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-2">
                      <span className="text-gray-300">{asset.name}</span>
                      <div className="text-left">
                        <div className="text-white font-semibold">{asset.amount}</div>
                        <div className="text-gray-500 text-[10px] mt-0.5">{asset.value} تومان</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== دکمه‌های عملیات (فعال شدند) ===== */}
      <section className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-5">
        <button onClick={() => router.push("/wallet/deposit")} className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] py-2.5 hover:border-[var(--gold)]/50 transition group">
          <div className="text-[var(--muted)] group-hover:text-[var(--gold)] transition"><DepositIcon /></div>
          <span className="text-[8px] sm:text-[9px] font-bold leading-tight text-center px-0.5 text-[var(--text)]">واریز وجه</span>
        </button>
        <button onClick={() => router.push("/wallet/withdraw")} className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] py-2.5 hover:border-[var(--gold)]/50 transition group">
          <div className="text-[var(--muted)] group-hover:text-[var(--gold)] transition"><WithdrawIcon /></div>
          <span className="text-[8px] sm:text-[9px] font-bold leading-tight text-center px-0.5 text-[var(--text)]">برداشت وجه</span>
        </button>
        <button onClick={() => router.push("/wallet/physical")} className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] py-2.5 hover:border-[var(--gold)]/50 transition group">
          <div className="text-[var(--muted)] group-hover:text-[var(--gold)] transition"><PhysicalGoldIcon /></div>
          <span className="text-[8px] sm:text-[9px] font-bold leading-tight text-center px-0.5 text-[var(--text)]">برداشت فیزیکی طلا</span>
        </button>
        <button onClick={() => router.push("/trade")} className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--gold)]/30 py-2.5 hover:border-[var(--gold)] transition group shadow-sm">
          <div className="text-[var(--gold)] group-hover:scale-110 transition-transform"><TradeIcon /></div>
          <span className="text-[8px] sm:text-[9px] font-bold leading-tight text-center px-0.5 text-[var(--gold)]">معامله</span>
        </button>
        <button onClick={() => router.push("/wallet/transfer")} className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] py-2.5 hover:border-[var(--gold)]/50 transition group">
          <div className="text-[var(--muted)] group-hover:text-[var(--gold)] transition"><TransferIcon /></div>
          <span className="text-[8px] sm:text-[9px] font-bold leading-tight text-center px-0.5 text-[var(--text)]">انتقال</span>
        </button>
      </section>

      {/* ===== اسلایدر بنر ===== */}
      <section className="rounded-2xl overflow-hidden mb-5 relative group">
        <div className="relative w-full h-24 sm:h-28">
          <div className="flex w-full h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(${bannerIdx * 100}%)` }}>
            {banners.map((b) => (
              <div key={b.id} className={`relative w-full h-full flex-shrink-0 bg-gradient-to-l ${b.gradient} flex flex-col justify-center px-5 overflow-hidden`}>
                <div className="absolute -right-4 -top-6 text-8xl opacity-20 pointer-events-none select-none">{b.icon}</div>
                <div className="relative z-10 text-white font-bold text-sm sm:text-base">{b.title}</div>
                <div className="relative z-10 text-white/80 text-[11px] sm:text-xs mt-1">{b.desc}</div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setBannerIdx(i)} aria-label={`اسلاید ${i + 1}`} className={`h-1.5 rounded-full transition-all duration-300 ${i === bannerIdx ? "w-7 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "w-2 bg-white/40 hover:bg-white/60"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== قیمت‌های زنده ===== */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">تابلو قیمت زنده</h2>
          <span className="text-xs text-[var(--muted)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> آنلاین
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INITIAL_LIVE_PRICES.map((p, i) => <LivePriceCard key={i} initialData={p} />)}
        </div>
      </section>

      {/* ===== نمودار ===== */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 sm:p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">نمودار قیمت طلای ۱۸</h2>
          <div className="chart-change positive text-xs font-bold">+۱.۲۵٪</div>
        </div>
        <div className="chart-price text-base sm:text-lg font-bold mb-2">
          {format(19080000)} <small className="text-[10px] text-[var(--muted)]">تومان</small>
        </div>
        <div className="periods mb-2">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={period === p ? "period active-period" : "period"}>{p}</button>
          ))}
        </div>
        <Chart />
      </section>

      {/* ===== آخرین فعالیت‌ها (لینک به سفارشات) ===== */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 sm:p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">آخرین فعالیت‌ها</h2>
          <button onClick={() => router.push("/orders")} className="text-xs text-[var(--gold)]">مشاهده همه</button>
        </div>
        <div className="flex items-center gap-2.5 py-2 border-b border-[var(--border)]">
          <span className="w-8 h-8 rounded-lg bg-[var(--panel-2)] text-emerald-500 flex items-center justify-center text-xs shrink-0">↙</span>
          <div className="flex-1"><div className="text-xs font-bold">خرید طلا</div><div className="text-[10px] text-[var(--muted)] mt-0.5">امروز · ۱۲:۴۰</div></div>
          <b className="text-xs text-emerald-500">+۲.۵ گرم</b>
        </div>
        <div className="flex items-center gap-2.5 py-2">
          <span className="w-8 h-8 rounded-lg bg-[var(--panel-2)] text-amber-500 flex items-center justify-center text-xs shrink-0">⇄</span>
          <div className="flex-1"><div className="text-xs font-bold">انتقال طلا</div><div className="text-[10px] text-[var(--muted)] mt-0.5">دیروز · ۱۶:۲۰</div></div>
          <b className="text-xs text-red-400">−۱ گرم</b>
        </div>
      </section>

      <footer className="footer">کیف زرگر · مدیریت هوشمند دارایی طلا</footer>
    </div>
  );
}