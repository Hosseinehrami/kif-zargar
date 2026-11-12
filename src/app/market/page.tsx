"use client";

import { useState, useEffect, useMemo } from "react";

const GOLD_PRICE = 19_080_000;
const VAT_RATE = 0.09;
const format = (n: number) => Math.round(n).toLocaleString("fa-IR");

// ---------- Types ----------
type Review = { user: string; rating: number; date: string; text: string; verified?: boolean };
type Product = {
  id: string; title: string; category: string;
  seller: string; sellerRate: number; sellerSales: number;
  sellerResponse: string; sellerLocation: string; isVerified: boolean;
  rating: number; reviewsCount: number; reviewsList: Review[];
  images: string[]; color: string; badge?: string;
  description: string; weight: number; purity: number;
  executionFee: number; sellerProfit: number; discountPercent?: number;
  discountEndsAt?: number;
  cities: string[]; salesCount: number; stock: number; viewsToday: number;
  isNew?: boolean;
};

const CATEGORIES = ["همه", "شمش و سکه", "انگشتر", "گردنبند", "دستبند", "گوشواره"];
const ALL_CITIES = ["همه شهرها", "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "یزد", "رشت"];

const NOW_BASE = Date.now();

// ---------- Mock Data ----------
const PRODUCTS: Product[] = [
  { 
    id: "p1", title: "سکه امامی طرح جدید (۱۴۰۳)", category: "شمش و سکه", 
    seller: "طلافروشی زرین", sellerRate: 98, sellerSales: 1450, sellerResponse: "کمتر از ۱ ساعت", sellerLocation: "تهران", isVerified: true,
    rating: 4.8, reviewsCount: 124, 
    reviewsList: [
      { user: "علی رضایی", rating: 5, date: "۲ روز پیش", text: "کیفیت عالی بود، دقیقا همون چیزی که میخواستم.", verified: true }, 
      { user: "مریم احمدی", rating: 4, date: "۵ روز پیش", text: "ارسال سریع، بسته بندی خوب.", verified: true }
    ],
    images: ["🪙", "✨", "🟡"], color: "from-yellow-600/20 to-amber-900/20", badge: "پرفروش",
    description: "سکه امامی ضرب سال ۱۴۰۳، دارای ضمانت اصالت و بازگشت وجه. مناسب برای سرمایه‌گذاری و هدیه.",
    weight: 8.13, purity: 22, executionFee: 0, sellerProfit: 1, cities: ["تهران", "اصفهان", "مشهد"], salesCount: 850, stock: 5, viewsToday: 342, isNew: false
  },
  { 
    id: "p2", title: "انگشتر طلا ۱۸ عیار طرح ونیز", category: "انگشتر", 
    seller: "گالری آریا", sellerRate: 95, sellerSales: 340, sellerResponse: "۲ ساعت", sellerLocation: "شیراز", isVerified: true,
    rating: 4.5, reviewsCount: 87, 
    reviewsList: [{ user: "سارا محمدی", rating: 5, date: "۱ هفته پیش", text: "بسیار ظریف و زیبا. پیشنهاد میکنم.", verified: true }],
    images: ["💍", "💎", "✨"], color: "from-pink-500/10 to-rose-900/20",
    description: "انگشتر دست‌ساز با سنگ‌های طبیعی، طراحی مدرن و ظریف، مناسب برای استفاده روزمره و مجلسی.",
    weight: 3.45, purity: 18, executionFee: 15, sellerProfit: 7, discountPercent: 10, discountEndsAt: NOW_BASE + 2 * 86400000 + 14 * 3600000, cities: ["تهران", "شیراز"], salesCount: 120, stock: 2, viewsToday: 128, isNew: true
  },
  { 
    id: "p3", title: "شمش طلا ۱۰ گرمی ای جی", category: "شمش و سکه", 
    seller: "صرافی ملت", sellerRate: 99, sellerSales: 5200, sellerResponse: "کمتر از ۳۰ دقیقه", sellerLocation: "تهران", isVerified: true,
    rating: 4.9, reviewsCount: 342, 
    reviewsList: [{ user: "رضا کریمی", rating: 5, date: "۳ روز پیش", text: "بهترین جا برای خرید شمش.", verified: true }],
    images: ["🧱", "📜", "✅"], color: "from-amber-500/20 to-yellow-900/20", badge: "تضمین اصالت",
    description: "شمش طلای ۱۰ گرمی با عیار ۲۴ (۹۹۹.۹)، همراه با گواهی اصالت بین‌المللی و بسته‌بندی پلمپ شده.",
    weight: 10, purity: 24, executionFee: 2, sellerProfit: 0.5, cities: ["تهران", "مشهد", "تبریز", "اصفهان"], salesCount: 2100, stock: 20, viewsToday: 891, isNew: false
  },
  { 
    id: "p4", title: "گردنبند طلا با آویز قلب", category: "گردنبند", 
    seller: "گالری آریا", sellerRate: 95, sellerSales: 340, sellerResponse: "۲ ساعت", sellerLocation: "شیراز", isVerified: true,
    rating: 4.3, reviewsCount: 45, reviewsList: [],
    images: ["📿", "💖", "✨"], color: "from-orange-400/10 to-amber-800/20",
    description: "گردنبند ظریف با زنجیر ایتالیایی و آویز قلب، بسیار سبک و مناسب استفاده روزانه.",
    weight: 2.1, purity: 18, executionFee: 20, sellerProfit: 8, cities: ["تهران"], salesCount: 45, stock: 0, viewsToday: 45, isNew: true
  },
  { 
    id: "p5", title: "دستبند طلا ۱۸ عیار بافت چرم", category: "دستبند", 
    seller: "برند لوکس", sellerRate: 97, sellerSales: 890, sellerResponse: "۴ ساعت", sellerLocation: "کرج", isVerified: false,
    rating: 4.7, reviewsCount: 210, reviewsList: [],
    images: ["⌚", "🖤", "✨"], color: "from-stone-500/10 to-stone-800/30",
    description: "ترکیب چرم طبیعی و طلای ۱۸ عیار، طراحی اسپرت و شیک، بسیار مقاوم و بادوام.",
    weight: 4.8, purity: 18, executionFee: 12, sellerProfit: 6, discountPercent: 5, discountEndsAt: NOW_BASE + 5 * 3600000 + 20 * 60000, cities: ["تهران", "کرج"], salesCount: 320, stock: 8, viewsToday: 267, isNew: false
  },
  { 
    id: "p6", title: "گوشواره طلا طرح گل رز", category: "گوشواره", 
    seller: "طلافروشی زرین", sellerRate: 98, sellerSales: 1450, sellerResponse: "کمتر از ۱ ساعت", sellerLocation: "تهران", isVerified: true,
    rating: 4.2, reviewsCount: 32, reviewsList: [],
    images: ["💎", "🌹", "✨"], color: "from-sky-400/10 to-blue-900/20",
    description: "گوشواره‌های ظریف با طرح گل رز، بسیار سبک و مناسب برای مهمانی‌ها.",
    weight: 1.5, purity: 18, executionFee: 18, sellerProfit: 7, cities: ["تهران", "شیراز", "یزد"], salesCount: 80, stock: 3, viewsToday: 89, isNew: false
  },
  { 
    id: "p7", title: "نیم سکه بهار آزادی", category: "شمش و سکه", 
    seller: "صرافی ملت", sellerRate: 99, sellerSales: 5200, sellerResponse: "کمتر از ۳۰ دقیقه", sellerLocation: "تهران", isVerified: true,
    rating: 4.8, reviewsCount: 156, reviewsList: [],
    images: ["🟡", "✨", "🪙"], color: "from-yellow-500/20 to-yellow-900/20",
    description: "نیم سکه بهار آزادی، یکی از پرفروش‌ترین مسکوکات برای سرمایه‌گذاری امن.",
    weight: 4.06, purity: 22, executionFee: 0, sellerProfit: 1, cities: ["سراسر کشور"], salesCount: 600, stock: 15, viewsToday: 412, isNew: false
  },
  { 
    id: "p8", title: "انگشتر نقره و طلا طرح مدرن", category: "انگشتر", 
    seller: "برند لوکس", sellerRate: 97, sellerSales: 890, sellerResponse: "۴ ساعت", sellerLocation: "کرج", isVerified: false,
    rating: 4.0, reviewsCount: 18, reviewsList: [],
    images: ["✨", "💍", "⚪"], color: "from-zinc-400/10 to-zinc-800/20",
    description: "انگشتر با ترکیب فلز نقره و روکش طلا، طراحی مینیمال و مدرن.",
    weight: 2.8, purity: 18, executionFee: 25, sellerProfit: 8, cities: ["تهران", "اصفهان", "رشت"], salesCount: 15, stock: 1, viewsToday: 23, isNew: true
  },
];

// ---------- Icons ----------
const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const StarIcon = ({ fill = "currentColor", size = 12 }: { fill?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const HeartIcon = ({ fill = "none" }: { fill?: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const CheckBadgeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>;
const CloseIcon = ({ size = 20 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const FilterIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const CartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
const CompareIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const ShareIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const EyeIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const MinusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>;

// ---------- Helpers ----------
const TrustBadges = () => (
  <div className="flex flex-wrap gap-2 mt-3 mb-1">
    {[{ icon: "✅", text: "تضمین اصالت" }, { icon: "🔄", text: "۷ روز بازگشت" }, { icon: "🚚", text: "ارسال بیمه‌شده" }, { icon: "💳", text: "پرداخت امن" }].map((b, i) => (
      <div key={i} className="flex items-center gap-1.5 bg-[var(--panel)] border border-[var(--border)] rounded-lg px-2 py-1">
        <span className="text-sm">{b.icon}</span><span className="text-[10px] text-[var(--muted)]">{b.text}</span>
      </div>
    ))}
  </div>
);

function calcPrice(p: Product, quantity: number = 1) {
  const goldValue = p.weight * GOLD_PRICE * quantity;
  const feeValue = goldValue * (p.executionFee / 100);
  const profitValue = goldValue * (p.sellerProfit / 100);
  const taxValue = (feeValue + profitValue) * VAT_RATE;
  const subtotal = goldValue + feeValue + profitValue + taxValue;
  const discountValue = p.discountPercent ? subtotal * (p.discountPercent / 100) : 0;
  const finalPrice = subtotal - discountValue;
  const goldToPay = finalPrice / GOLD_PRICE;
  return { goldValue, feeValue, profitValue, taxValue, subtotal, discountValue, finalPrice, goldToPay };
}

async function shareProduct(p: Product) {
  const text = `محصول ${p.title} در کیف زرگر`;
  const url = typeof window !== "undefined" ? window.location.href : "";
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: p.title, text, url });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return true;
    }
  } catch { return false; }
  return false;
}

// ---------- Countdown Timer ----------
function CountdownTimer({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = endsAt - now;
  if (remaining <= 0) return <span className="text-[10px] text-red-400 font-bold">پایان تخفیف</span>;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono" dir="ltr">
      {days > 0 && <span className="bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-bold">{format(days)}d</span>}
      <span className="bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-bold">{pad(hours)}</span>
      <span className="text-red-400">:</span>
      <span className="bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-bold">{pad(minutes)}</span>
      <span className="text-red-400">:</span>
      <span className="bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-bold">{pad(seconds)}</span>
    </div>
  );
}

// ---------- Skeleton ----------
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden animate-pulse">
      <div className="h-32 sm:h-40 bg-[var(--panel-2)]" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 bg-[var(--panel-2)] rounded w-full" />
        <div className="h-3 bg-[var(--panel-2)] rounded w-2/3" />
        <div className="h-2 bg-[var(--panel-2)] rounded w-1/2 mt-3" />
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-[var(--border)]">
          <div className="h-3 bg-[var(--panel-2)] rounded w-16" />
          <div className="h-3 bg-[var(--panel-2)] rounded w-8" />
        </div>
      </div>
    </div>
  );
}

// ---------- Star Input ----------
function StarRatingInput({ value, onChange, size = 20 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)} className="transition-transform hover:scale-110">
          <svg width={size} height={size} viewBox="0 0 24 24" fill={star <= value ? "#f59e0b" : "none"} stroke={star <= value ? "#f59e0b" : "#71717a"} strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ---------- Seller Profile Modal ----------
function SellerProfileModal({ product, onClose, onViewAll }: { product: Product; onClose: () => void; onViewAll: (seller: string) => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl p-5 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 left-3 text-[var(--muted)] hover:text-[var(--text)]"><CloseIcon /></button>
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-3xl mb-3">🏪</div>
          <h3 className="text-base font-bold flex items-center gap-1.5">{product.seller} {product.isVerified && <CheckBadgeIcon />}</h3>
          <p className="text-xs text-[var(--muted)] mt-1">{product.sellerLocation}</p>
          <div className="grid grid-cols-2 gap-2 w-full mt-5">
            <div className="bg-[var(--panel-2)] p-2 rounded-xl border border-[var(--border)] text-center">
              <div className="text-[10px] text-[var(--muted)] mb-1">رضایت خریداران</div>
              <div className="text-sm font-bold text-emerald-400">{product.sellerRate}٪</div>
            </div>
            <div className="bg-[var(--panel-2)] p-2 rounded-xl border border-[var(--border)] text-center">
              <div className="text-[10px] text-[var(--muted)] mb-1">فروش موفق</div>
              <div className="text-sm font-bold">{format(product.sellerSales)}+</div>
            </div>
            <div className="bg-[var(--panel-2)] p-2 rounded-xl border border-[var(--border)] text-center col-span-2">
              <div className="text-[10px] text-[var(--muted)] mb-1">زمان پاسخ‌دهی</div>
              <div className="text-xs font-bold text-[var(--gold)]">{product.sellerResponse}</div>
            </div>
          </div>
          <button onClick={() => { onViewAll(product.seller); onClose(); }} className="w-full mt-5 bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] font-bold text-xs py-2.5 rounded-xl hover:border-[var(--gold)]/50 transition">
            مشاهده تمام محصولات فروشنده
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Cart Drawer ----------
function CartDrawer({ 
  items, onClose, onQtyChange, onRemove, onCheckout 
}: {
  items: { product: Product; qty: number }[];
  onClose: () => void;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  const total = items.reduce((s, i) => s + calcPrice(i.product, i.qty).finalPrice, 0);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-[var(--panel)] border-l border-[var(--border)] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-bold text-base">سبد خرید</h2>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">{format(items.length)} نوع کالا</p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]"><CloseIcon /></button>
        </div>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-3 opacity-40">🛒</div>
            <div className="text-sm font-bold mb-1">سبد خرید خالی است</div>
            <div className="text-[11px] text-[var(--muted)] mb-4">هنوز محصولی به سبد اضافه نکرده‌اید</div>
            <button onClick={onClose} className="bg-[var(--gold)] text-black text-xs font-bold px-5 py-2 rounded-lg">مشاهده محصولات</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {items.map(({ product: p, qty }) => {
                const { finalPrice } = calcPrice(p, qty);
                return (
                  <div key={p.id} className="flex gap-2.5 bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-2.5">
                    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl shrink-0`}>
                      {p.images[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs font-bold truncate">{p.title}</h3>
                        <button onClick={() => onRemove(p.id)} className="text-[var(--muted)] hover:text-red-400 shrink-0"><CloseIcon size={14} /></button>
                      </div>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">{p.seller}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 bg-[var(--panel)] border border-[var(--border)] rounded-md px-1">
                          <button onClick={() => onQtyChange(p.id, qty + 1)} disabled={qty >= p.stock} className="p-1 text-[var(--muted)] hover:text-[var(--gold)] disabled:opacity-30"><PlusIcon /></button>
                          <span className="text-[11px] font-bold w-4 text-center">{qty}</span>
                          <button onClick={() => onQtyChange(p.id, qty - 1)} className="p-1 text-[var(--muted)] hover:text-[var(--gold)]"><MinusIcon /></button>
                        </div>
                        <div className="text-[11px] font-bold text-[var(--gold)]">{format(finalPrice)} <span className="text-[9px] font-normal text-[var(--muted)]">ت</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-[var(--border)]">
              <div className="flex justify-between mb-3">
                <span className="text-xs text-[var(--muted)]">جمع کل</span>
                <span className="text-sm font-bold text-[var(--gold)]">{format(total)} <span className="text-[10px] font-normal">تومان</span></span>
              </div>
              <button onClick={onCheckout} className="w-full bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-black font-bold text-sm py-2.5 rounded-xl transition">
                ادامه و پرداخت
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Compare Modal ----------
function CompareModal({ products, onClose, onRemove }: { products: Product[]; onClose: () => void; onRemove: (id: string) => void }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  const rows = [
    { label: "تصویر", render: (p: Product) => <div className={`w-full h-20 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-4xl`}>{p.images[0]}</div> },
    { label: "عنوان", render: (p: Product) => <span className="text-xs font-bold">{p.title}</span> },
    { label: "قیمت نهایی", render: (p: Product) => <span className="text-xs font-bold text-[var(--gold)]">{format(calcPrice(p).finalPrice)} ت</span> },
    { label: "وزن", render: (p: Product) => <span className="text-xs">{format(p.weight)} گرم</span> },
    { label: "عیار", render: (p: Product) => <span className="text-xs">{format(p.purity)}</span> },
    { label: "اجرت", render: (p: Product) => <span className="text-xs">{format(p.executionFee)}٪</span> },
    { label: "سود فروشنده", render: (p: Product) => <span className="text-xs">{format(p.sellerProfit)}٪</span> },
    { label: "فروشنده", render: (p: Product) => <span className="text-[10px]">{p.seller}</span> },
    { label: "امتیاز", render: (p: Product) => <span className="text-xs font-bold text-amber-500">★ {p.rating}</span> },
    { label: "موجودی", render: (p: Product) => p.stock === 0 ? <span className="text-xs text-red-400">ناموجود</span> : <span className="text-xs">{format(p.stock)} عدد</span> },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-bold text-base">مقایسه محصولات</h2>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">{format(products.length)} محصول</p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]"><CloseIcon /></button>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <table className="w-full">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i > 0 ? "border-t border-[var(--border)]" : ""}>
                  <td className="p-2 text-[10px] text-[var(--muted)] font-bold w-20 align-top">{row.label}</td>
                  {products.map(p => (
                    <td key={p.id} className="p-2 align-top text-center">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-[var(--border)]">
                <td className="p-2"></td>
                {products.map(p => (
                  <td key={p.id} className="p-2 text-center">
                    <button onClick={() => onRemove(p.id)} className="text-[10px] text-red-400 border border-red-500/30 rounded px-2 py-1 hover:bg-red-500/10">حذف</button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Product Modal ----------
function ProductModal({ 
  product, onClose, onSelectCity, onSelectProduct, onFilterBySeller, onAddToCart, showToast
}: { 
  product: Product; onClose: () => void; onSelectCity: (city: string) => void;
  onSelectProduct: (p: Product) => void; onFilterBySeller: (seller: string) => void;
  onAddToCart: (id: string, qty: number) => void; showToast: (msg: string) => void;
}) {
  const [payType, setPayType] = useState<"rial" | "gold">("rial");
  const [activeImg, setActiveImg] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [showSeller, setShowSeller] = useState(false);
  const [reviews] = useState<Review[]>(product.reviewsList);

  const { goldValue, feeValue, profitValue, taxValue, discountValue, finalPrice, goldToPay } = calcPrice(product, quantity);
  const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
  const isOut = product.stock === 0;
  const isLow = product.stock > 0 && product.stock <= 3;

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { setQuantity(1); setActiveImg(product.images[0]); }, [product.id]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center" onClick={onClose}>
        <div className="relative w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition backdrop-blur-md"><CloseIcon /></button>
          
          {/* Gallery */}
          <div className={`md:w-2/5 h-64 md:h-auto bg-gradient-to-br ${product.color} flex flex-col items-center justify-center relative shrink-0 p-4`}>
            <span className="text-8xl md:text-9xl drop-shadow-2xl mb-4">{activeImg}</span>
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(img)} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all border ${activeImg === img ? "bg-black/30 border-white/50 scale-110" : "bg-black/10 border-transparent hover:bg-black/20"}`}>{img}</button>
              ))}
            </div>
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-white text-sm font-bold bg-red-500/80 px-4 py-2 rounded-lg">ناموجود</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5 md:p-6 flex-1 flex flex-col overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-lg font-bold text-[var(--text)] flex-1">{product.title}</h2>
              <button onClick={async () => { const ok = await shareProduct(product); showToast(ok ? "لینک کپی شد" : "اشتراک‌گذاری انجام شد"); }} className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/50 transition shrink-0">
                <ShareIcon />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-1 text-amber-500 text-sm">
                <StarIcon />
                <span className="font-bold text-[var(--text)]">{product.rating}</span>
                <span className="text-xs text-[var(--muted)]">({product.reviewsCount} دیدگاه)</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[var(--border)] hidden sm:block"></div>
              <button onClick={() => setShowSeller(true)} className="flex items-center gap-1.5 text-xs text-[var(--gold)] font-semibold hover:underline">
                <CheckBadgeIcon /> {product.seller}
              </button>
            </div>

            {/* Views today + stock + countdown row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                <EyeIcon /> {format(product.viewsToday)} نفر امروز دیدند
              </div>
              {isOut ? (
                <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">ناموجود</span>
              ) : isLow ? (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">فقط {format(product.stock)} عدد مانده</span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">{format(product.stock)} عدد موجود</span>
              )}
            </div>

            {product.discountEndsAt && (
              <div className="flex items-center gap-2 mb-3 bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                <span className="text-[10px] text-red-400 font-bold">🔥 تخفیف ویژه تا:</span>
                <CountdownTimer endsAt={product.discountEndsAt} />
              </div>
            )}

            <TrustBadges />

            <div className="flex items-center gap-2 mt-3 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-2 text-[10px] text-[var(--muted)]">
              <span className="text-sm">🚚</span>
              <span>ارسال از <b className="text-[var(--text)]">{product.sellerLocation}</b> · تحویل ۲-۳ روز کاری · <b className="text-emerald-400">رایگان</b></span>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed mt-3 mb-4 text-justify">{product.description}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-[var(--panel-2)] p-2 rounded-lg border border-[var(--border)]"><div className="text-[10px] text-[var(--muted)] mb-0.5">وزن</div><div className="text-xs font-bold">{format(product.weight)} گرم</div></div>
              <div className="bg-[var(--panel-2)] p-2 rounded-lg border border-[var(--border)]"><div className="text-[10px] text-[var(--muted)] mb-0.5">عیار</div><div className="text-xs font-bold">{format(product.purity)} عیار</div></div>
              <div className="bg-[var(--panel-2)] p-2 rounded-lg border border-[var(--border)] col-span-2">
                <div className="text-[10px] text-[var(--muted)] mb-0.5">موجود در: <span className="text-[9px] text-[var(--gold)]">(برای فیلتر کلیک کنید)</span></div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.cities.map(c => (
                    <button key={c} onClick={() => { onSelectCity(c); onClose(); }} className="text-[10px] bg-[var(--bg)] hover:bg-[var(--gold)]/20 hover:text-[var(--gold)] px-2 py-0.5 rounded border border-[var(--border)]">{c}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Invoice */}
            <div className="bg-[var(--panel-2)] rounded-xl p-3 border border-[var(--border)] mt-auto">
              <div className="flex justify-between items-center mb-2 border-b border-[var(--border)] pb-2">
                <span className="text-xs font-bold">تعداد سفارش:</span>
                <div className="flex items-center gap-3 bg-[var(--panel)] border border-[var(--border)] rounded-lg px-2 py-1">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-lg leading-none px-1 text-[var(--muted)] hover:text-[var(--gold)]">-</button>
                  <span className="text-sm font-bold w-4 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} className="text-lg leading-none px-1 text-[var(--muted)] hover:text-[var(--gold)] disabled:opacity-30">+</button>
                </div>
              </div>

              <div className="flex justify-between text-xs mb-1.5 text-[var(--muted)]"><span>ارزش طلا ({format(product.weight * quantity)} گرم)</span><span>{format(goldValue)} ت</span></div>
              {product.executionFee > 0 && <div className="flex justify-between text-xs mb-1.5 text-[var(--muted)]"><span>اجرت ({format(product.executionFee)}٪)</span><span>{format(feeValue)} ت</span></div>}
              {product.sellerProfit > 0 && <div className="flex justify-between text-xs mb-1.5 text-[var(--muted)]"><span>سود فروشنده ({format(product.sellerProfit)}٪)</span><span>{format(profitValue)} ت</span></div>}
              <div className="flex justify-between text-xs mb-1.5 text-[var(--muted)]"><span>مالیات (۹٪)</span><span>{format(taxValue)} ت</span></div>
              {product.discountPercent && product.discountPercent > 0 && <div className="flex justify-between text-xs mb-1.5 text-red-400"><span>تخفیف ({format(product.discountPercent)}٪)</span><span>{format(discountValue)} ت-</span></div>}
              
              <div className="h-px bg-[var(--border)] my-2"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold">مبلغ قابل پرداخت</span>
                <div className="text-base font-extrabold text-[var(--gold)]">{format(finalPrice)} <span className="text-xs font-normal">تومان</span></div>
              </div>

              {!isOut && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button onClick={() => setPayType("rial")} className={`py-1.5 text-xs font-bold rounded-lg border ${payType === "rial" ? "bg-[var(--gold)] text-black border-[var(--gold)]" : "bg-[var(--panel)] border-[var(--border)] text-[var(--muted)]"}`}>ریالی</button>
                    <button onClick={() => setPayType("gold")} className={`py-1.5 text-xs font-bold rounded-lg border ${payType === "gold" ? "bg-[var(--gold)] text-black border-[var(--gold)]" : "bg-[var(--panel)] border-[var(--border)] text-[var(--muted)]"}`}>با طلا</button>
                  </div>
                  <button className="w-full bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-black font-bold text-sm py-2.5 rounded-xl transition mb-2">
                    {payType === "rial" ? `پرداخت ${format(finalPrice)} تومان` : `پرداخت ${format(goldToPay)} گرم طلا`}
                  </button>
                  <button onClick={() => { onAddToCart(product.id, quantity); showToast("به سبد خرید اضافه شد"); onClose(); }} className="w-full border border-[var(--gold)]/50 text-[var(--gold)] hover:bg-[var(--gold)]/10 font-bold text-xs py-2 rounded-xl transition">
                    + افزودن به سبد خرید
                  </button>
                </>
              )}
              {isOut && (
                <button disabled className="w-full bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)] font-bold text-sm py-2.5 rounded-xl cursor-not-allowed">
                  این محصول ناموجود است
                </button>
              )}
            </div>

            {/* Reviews */}
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <div className="flex items-start gap-3 bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-3.5">
                <div className="text-2xl shrink-0">🔒</div>
                <div className="flex-1">
                  <div className="text-xs font-bold mb-1">ثبت نظر فقط برای خریداران</div>
                  <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-2.5">برای ثبت امتیاز و نظر، ابتدا باید این محصول را خریداری کرده باشید.</p>
                  <a href="/orders" className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--gold)] hover:underline">مشاهده سفارشات من ←</a>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <h3 className="text-sm font-bold mb-3">نظرات کاربران ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p className="text-[11px] text-[var(--muted)] text-center py-4">هنوز نظری ثبت نشده است.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-[var(--panel-2)] p-3 rounded-lg border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold">{r.user}</span>
                          {r.verified && <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">✓ خرید تأیید شده</span>}
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => <StarIcon key={star} size={11} fill={star <= r.rating ? "#f59e0b" : "none"} />)}
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--muted)]">{r.text}</p>
                      <div className="text-[9px] text-[var(--muted)] mt-2 opacity-60">{r.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {relatedProducts.length > 0 && (
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <h3 className="text-sm font-bold mb-3">محصولات مشابه</h3>
                <div className="grid grid-cols-3 gap-2">
                  {relatedProducts.map(rp => (
                    <div key={rp.id} onClick={() => onSelectProduct(rp)} className="bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-2 cursor-pointer hover:border-[var(--gold)]/50 transition">
                      <div className="text-2xl text-center mb-1">{rp.images[0]}</div>
                      <div className="text-[10px] font-bold text-center line-clamp-1">{rp.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showSeller && <SellerProfileModal product={product} onClose={() => setShowSeller(false)} onViewAll={(s) => { onFilterBySeller(s); onClose(); }} />}
    </>
  );
}

// ---------- Product Card ----------
function ProductCard({
  product: p, isFav, inCompare, compareFull, onFavToggle, onCompareToggle, onOpen
}: { product: Product; isFav: boolean; inCompare: boolean; compareFull: boolean; onFavToggle: (e: React.MouseEvent, id: string) => void; onCompareToggle: (e: React.MouseEvent, id: string) => void; onOpen: () => void; }) {
  const { subtotal, finalPrice } = calcPrice(p);
  const isOut = p.stock === 0;
  const isLow = p.stock > 0 && p.stock <= 3;
  return (
    <div onClick={onOpen} className={`group rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden hover:border-[var(--gold)]/50 transition-all duration-300 flex flex-col cursor-pointer relative ${isOut ? "opacity-70" : ""}`}>
      <div className={`relative h-32 sm:h-40 w-full bg-gradient-to-br ${p.color} flex items-center justify-center`}>
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          {p.isNew && <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm">جدید</span>}
          {p.badge && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded shadow-sm">{p.badge}</span>}
          {p.discountPercent && <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded shadow-sm">{format(p.discountPercent)}٪ تخفیف</span>}
        </div>
        <span className="text-5xl sm:text-6xl transform group-hover:scale-110 transition-transform duration-300">{p.images[0]}</span>
        {isOut && <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center"><span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded">ناموجود</span></div>}
        <button onClick={(e) => onFavToggle(e, p.id)} className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors z-20 ${isFav ? "bg-red-500/20 text-red-500" : "bg-black/20 text-white/70 hover:bg-black/40 hover:text-white"}`}>
          <HeartIcon fill={isFav ? "currentColor" : "none"} />
        </button>
        <button onClick={(e) => onCompareToggle(e, p.id)} disabled={!inCompare && compareFull} title={!inCompare && compareFull ? "حداکثر ۳ محصول" : "افزودن به مقایسه"} className={`absolute bottom-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors z-20 text-[10px] font-bold ${inCompare ? "bg-[var(--gold)] text-black" : "bg-black/20 text-white/70 hover:bg-black/40 disabled:opacity-30"}`}>
          {inCompare ? <CheckIcon /> : <CompareIcon />}
        </button>
      </div>
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-[var(--text)] line-clamp-2 leading-relaxed min-h-[2.2rem]">{p.title}</h3>
          <div className="flex items-center gap-1 mt-1.5">
            {p.isVerified && <CheckBadgeIcon />}
            <span className="text-[10px] text-[var(--muted)] truncate">{p.seller}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[9px] text-[var(--muted)]">
            <span className="flex items-center gap-0.5"><EyeIcon /> {format(p.viewsToday)}</span>
            {isLow && <span className="text-amber-400 font-bold">· فقط {format(p.stock)} عدد</span>}
          </div>
          {p.discountEndsAt && <div className="mt-1.5"><CountdownTimer endsAt={p.discountEndsAt} /></div>}
        </div>
        <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-end justify-between">
          <div>
            {p.discountPercent && <div className="text-[10px] text-[var(--muted)] line-through">{format(subtotal)}</div>}
            <div className="text-xs sm:text-sm font-bold text-[var(--gold)]">{format(finalPrice)} <span className="text-[9px] font-normal text-[var(--muted)]">ت</span></div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-0.5 text-amber-500"><StarIcon /><span className="text-[10px] font-bold text-[var(--text)]">{p.rating}</span></div>
            <span className="text-[9px] text-[var(--muted)]">({p.reviewsCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState("همه");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("همه شهرها");
  const [sellerFilter, setSellerFilter] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [filterDiscount, setFilterDiscount] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  // New states
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [activeCategory]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // Cart
  const addToCart = (id: string, qty: number) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    setCart(prev => ({ ...prev, [id]: Math.min((prev[id] || 0) + qty, p.stock) }));
  };
  const removeFromCart = (id: string) => setCart(prev => { const n = { ...prev }; delete n[id]; return n; });
  const updateCartQty = (id: string, qty: number) => { if (qty <= 0) removeFromCart(id); else setCart(prev => ({ ...prev, [id]: qty })); };
  const cartItems = Object.entries(cart).map(([id, qty]) => ({ product: PRODUCTS.find(p => p.id === id)!, qty })).filter(x => x.product);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  // Compare
  const toggleCompare = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) { showToast("حداکثر ۳ محصول"); return prev; }
      return [...prev, id];
    });
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  function openProduct(p: Product) {
    setSelectedProduct(p);
    setRecentlyViewed(prev => [p.id, ...prev.filter(id => id !== p.id)].slice(0, 6));
  }

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS.filter((p) => {
      const matchCategory = activeCategory === "همه" || p.category === activeCategory;
      const matchSearch = p.title.includes(searchQuery) || p.seller.includes(searchQuery);
      const matchCity = selectedCity === "همه شهرها" || p.cities.includes(selectedCity) || p.cities.includes("سراسر کشور");
      const matchWishlist = !showWishlistOnly || favorites.includes(p.id);
      const matchDiscount = !filterDiscount || (p.discountPercent && p.discountPercent > 0);
      const matchVerified = !filterVerified || p.isVerified;
      const matchSeller = !sellerFilter || p.seller === sellerFilter;
      const finalPrice = calcPrice(p).finalPrice;
      const matchMin = !minPrice || finalPrice >= Number(minPrice);
      const matchMax = !maxPrice || finalPrice <= Number(maxPrice);
      return matchCategory && matchSearch && matchCity && matchWishlist && matchDiscount && matchVerified && matchSeller && matchMin && matchMax;
    });
    if (sortBy === "price-asc") result.sort((a, b) => calcPrice(a).finalPrice - calcPrice(b).finalPrice);
    if (sortBy === "price-desc") result.sort((a, b) => calcPrice(b).finalPrice - calcPrice(a).finalPrice);
    if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    if (sortBy === "sales") result.sort((a, b) => b.salesCount - a.salesCount);
    if (sortBy === "newest") result.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
    return result;
  }, [activeCategory, searchQuery, selectedCity, showWishlistOnly, favorites, filterDiscount, filterVerified, sellerFilter, minPrice, maxPrice, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const recentlyViewedProducts = recentlyViewed.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean) as Product[];
  const compareProducts = compareList.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean) as Product[];

  const resetFilters = () => {
    setActiveCategory("همه"); setSearchQuery(""); setSelectedCity("همه شهرها"); setSellerFilter("");
    setShowWishlistOnly(false); setFilterDiscount(false); setFilterVerified(false); setMinPrice(""); setMaxPrice(""); setSortBy("default");
  };

  return (
    <div className="px-2.5 sm:px-4 pt-3 pb-8">
      
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="font-bold text-lg sm:text-xl">بازار طلا و جواهر</h1>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCompareOpen(true)} className="relative w-9 h-9 rounded-xl border bg-[var(--panel)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/50 flex items-center justify-center transition" title="مقایسه">
              <CompareIcon />
              {compareList.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--gold)] text-black text-[9px] font-bold rounded-full flex items-center justify-center">{compareList.length}</span>}
            </button>
            <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 rounded-xl border bg-[var(--panel)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/50 flex items-center justify-center transition" title="سبد خرید">
              <CartIcon />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
            <button onClick={() => setShowWishlistOnly(!showWishlistOnly)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${showWishlistOnly ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-[var(--panel)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}>
              <HeartIcon fill={showWishlistOnly ? "currentColor" : "none"} /><span className="hidden sm:inline">علاقه‌مندی‌ها</span>
            </button>
            <button onClick={() => setShowFilters(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-[var(--panel)] border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/50 transition">
              <FilterIcon /><span className="hidden sm:inline">فیلتر</span>
            </button>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--muted)]"><SearchIcon /></div>
            <input type="text" placeholder="جستجو..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[var(--panel)] border border-[var(--border)] text-xs rounded-xl py-2 pr-9 pl-3 outline-none focus:border-[var(--gold)]/50 text-[var(--text)] transition" />
          </div>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-24 shrink-0 bg-[var(--panel)] border border-[var(--border)] text-xs rounded-xl py-2 px-2 outline-none focus:border-[var(--gold)]/50 text-[var(--text)] cursor-pointer">
            {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-28 shrink-0 bg-[var(--panel)] border border-[var(--border)] text-xs rounded-xl py-2 px-2 outline-none focus:border-[var(--gold)]/50 text-[var(--text)] cursor-pointer">
            <option value="default">مرتب‌سازی</option>
            <option value="price-asc">ارزان‌ترین</option>
            <option value="price-desc">گران‌ترین</option>
            <option value="rating">بالاترین امتیاز</option>
            <option value="sales">پرفروش‌ترین</option>
            <option value="newest">جدیدترین</option>
          </select>
        </div>

        {sellerFilter && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--muted)]">فیلتر فروشنده:</span>
            <span className="flex items-center gap-1 bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)] text-[11px] px-2 py-1 rounded-lg">
              {sellerFilter}
              <button onClick={() => setSellerFilter("")} className="hover:text-red-400"><CloseIcon size={12} /></button>
            </span>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${activeCategory === cat ? "bg-[var(--gold)] text-black border-[var(--gold)] shadow-[0_0_10px_rgba(196,168,117,0.3)]" : "bg-[var(--panel)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--gold)]/50"}`}>{cat}</button>
        ))}
      </div>

      {/* Empty / Skeleton / Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {showWishlistOnly ? (
            <>
              <div className="text-6xl mb-4 text-red-500/30"><HeartIcon fill="currentColor" /></div>
              <h3 className="text-base font-bold text-[var(--text)] mb-1">لیست علاقه‌مندی‌ها خالی است</h3>
              <p className="text-xs text-[var(--muted)] mb-4 max-w-xs">هنوز محصولی را به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
              <button onClick={() => setShowWishlistOnly(false)} className="bg-[var(--gold)] text-black text-xs font-bold px-6 py-2 rounded-xl hover:bg-[var(--gold)]/90 transition">مشاهده همه محصولات</button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4 opacity-50">🔍</div>
              <h3 className="text-base font-bold text-[var(--text)] mb-1">محصولی یافت نشد</h3>
              <p className="text-xs text-[var(--muted)] mb-4 max-w-xs">هیچ محصولی با فیلترهای فعلی مطابقت ندارد.</p>
              <button onClick={resetFilters} className="bg-[var(--gold)] text-black text-xs font-bold px-6 py-2 rounded-xl">حذف همه فیلترها</button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {visibleProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                isFav={favorites.includes(p.id)} 
                inCompare={compareList.includes(p.id)}
                compareFull={compareList.length >= 3}
                onFavToggle={toggleFavorite}
                onCompareToggle={toggleCompare}
                onOpen={() => openProduct(p)}
              />
            ))}
          </div>
          {visibleCount < filteredProducts.length && (
            <div className="mt-6 text-center">
              <button onClick={() => setVisibleCount(v => v + 8)} className="bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] text-xs font-bold px-8 py-2.5 rounded-xl hover:border-[var(--gold)]/50 transition">مشاهده محصولات بیشتر</button>
            </div>
          )}
        </>
      )}

      {/* Recently Viewed */}
      {recentlyViewedProducts.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <span className="text-[var(--muted)]">🕒</span> بازدیدهای اخیر شما
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recentlyViewedProducts.map(p => (
              <div key={p.id} onClick={() => openProduct(p)} className="shrink-0 w-32 rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden cursor-pointer hover:border-[var(--gold)]/50 transition">
                <div className={`h-20 bg-gradient-to-br ${p.color} flex items-center justify-center text-3xl`}>{p.images[0]}</div>
                <div className="p-2">
                  <div className="text-[10px] font-bold line-clamp-1">{p.title}</div>
                  <div className="text-[10px] font-bold text-[var(--gold)] mt-1">{format(calcPrice(p).finalPrice)} ت</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start" onClick={() => setShowFilters(false)}>
          <div className="w-72 h-full bg-[var(--panel)] border-l border-[var(--border)] p-5 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-base">فیلترهای پیشرفته</h2>
              <button onClick={() => setShowFilters(false)}><CloseIcon /></button>
            </div>
            <div className="space-y-5 flex-1 overflow-y-auto">
              <div>
                <h3 className="text-xs font-bold mb-2">محدوده قیمت (تومان)</h3>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="از" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-2 text-xs outline-none focus:border-[var(--gold)] text-[var(--text)]" />
                  <span className="text-[var(--muted)]">-</span>
                  <input type="number" placeholder="تا" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-2 text-xs outline-none focus:border-[var(--gold)] text-[var(--text)]" />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold mb-2">ویژگی‌های محصول</h3>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={filterDiscount} onChange={e => setFilterDiscount(e.target.checked)} className="accent-[var(--gold)] w-4 h-4 rounded" />
                  <span className="text-xs text-[var(--muted)]">فقط محصولات دارای تخفیف</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterVerified} onChange={e => setFilterVerified(e.target.checked)} className="accent-[var(--gold)] w-4 h-4 rounded" />
                  <span className="text-xs text-[var(--muted)]">فقط فروشندگان تایید شده</span>
                </label>
              </div>
            </div>
            <button onClick={() => setShowFilters(false)} className="w-full bg-[var(--gold)] text-black font-bold text-sm py-2.5 rounded-xl mt-4">اعمال فیلترها</button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onSelectCity={(city) => { setSelectedCity(city); setSellerFilter(""); }} 
          onSelectProduct={(p) => openProduct(p)}
          onFilterBySeller={(seller) => { setSellerFilter(seller); setSelectedProduct(null); }}
          onAddToCart={addToCart}
          showToast={showToast}
        />
      )}

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer items={cartItems} onClose={() => setCartOpen(false)} onQtyChange={updateCartQty} onRemove={removeFromCart} onCheckout={() => { showToast("در حال انتقال به پرداخت..."); setCartOpen(false); }} />}

      {/* Compare Modal */}
      {compareOpen && compareProducts.length > 0 && (
        <CompareModal products={compareProducts} onClose={() => setCompareOpen(false)} onRemove={(id) => setCompareList(prev => prev.filter(x => x !== id))} />
      )}

      {/* Compare floating bar */}
      {compareProducts.length > 0 && !compareOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[var(--panel)] border border-[var(--gold)]/40 rounded-full shadow-2xl px-3 py-2 flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--gold)]">{format(compareProducts.length)} محصول</span>
          <button onClick={() => setCompareOpen(true)} className="bg-[var(--gold)] text-black text-xs font-bold px-3 py-1.5 rounded-full">مقایسه</button>
          <button onClick={() => setCompareList([])} className="text-[var(--muted)] hover:text-red-400"><CloseIcon size={14} /></button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] bg-[var(--gold)] text-black text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}