"use client";

import { useState, useEffect } from "react";

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");

// ---------- Types ----------
type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled";
type Order = {
  id: string;
  productIcon: string;
  productTitle: string;
  seller: string;
  sellerId: string;
  quantity: number;
  price: number;
  date: string;
  status: OrderStatus;
  hasReview?: boolean;
  paymentMethod: "rial" | "gold";
};

type Review = {
  productRating: number;
  sellerRating: number;
  text: string;
};

// ---------- Mock Orders ----------
const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-1001", productIcon: "🪙", productTitle: "سکه امامی طرح جدید (۱۴۰۳)",
    seller: "طلافروشی زرین", sellerId: "s1", quantity: 1, price: 191_000_000,
    date: "۲ روز پیش", status: "delivered", hasReview: false, paymentMethod: "rial",
  },
  {
    id: "ORD-1002", productIcon: "💍", productTitle: "انگشتر طلا ۱۸ عیار طرح ونیز",
    seller: "گالری آریا", sellerId: "s2", quantity: 1, price: 63_500_000,
    date: "۴ روز پیش", status: "delivered", hasReview: true, paymentMethod: "gold",
  },
  {
    id: "ORD-1003", productIcon: "🧱", productTitle: "شمش طلا ۱۰ گرمی ای جی",
    seller: "صرافی ملت", sellerId: "s3", quantity: 1, price: 194_500_000,
    date: "امروز", status: "shipped", paymentMethod: "rial",
  },
  {
    id: "ORD-1004", productIcon: "📿", productTitle: "گردنبند طلا با آویز قلب",
    seller: "گالری آریا", sellerId: "s2", quantity: 1, price: 47_800_000,
    date: "دیروز", status: "pending", paymentMethod: "gold",
  },
  {
    id: "ORD-1005", productIcon: "💎", productTitle: "گوشواره طلا طرح گل رز",
    seller: "طلافروشی زرین", sellerId: "s1", quantity: 2, price: 35_400_000,
    date: "۱ هفته پیش", status: "cancelled", paymentMethod: "rial",
  },
];

// Mock buyer info
const BUYER = {
  name: "علی رضایی",
  phone: "09121234567",
  nationalId: "0012345678",
  address: "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳",
  postalCode: "1987654321",
};

// Mock seller details
const SELLER_INFO: Record<string, { phone: string; address: string }> = {
  s1: { phone: "02188776655", address: "تهران، بازار بزرگ، پاساژ زرگرها، پلاک ۴۵" },
  s2: { phone: "07132221100", address: "شیراز، خیابان زند، پاساژ آریا، واحد ۸" },
  s3: { phone: "02155443322", address: "تهران، خیابان فردوسی، صرافی ملت" },
};

// ---------- Icons ----------
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const StarIcon = ({ fill = "currentColor", size = 12 }: { fill?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const InvoiceIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;

// ---------- Star Input ----------
function StarInput({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-1" dir="ltr">
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

// ---------- Status Badge ----------
function StatusBadge({ status }: { status: OrderStatus }) {
  const map = {
    pending: { label: "در انتظار ارسال", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    shipped: { label: "ارسال شده", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
    delivered: { label: "تحویل شده", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    cancelled: { label: "لغو شده", color: "bg-red-500/10 text-red-400 border-red-500/30" },
  }[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map.color}`}>
      {map.label}
    </span>
  );
}

// ---------- Invoice Modal ----------
function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const sellerInfo = SELLER_INFO[order.sellerId] || { phone: "—", address: "—" };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <style>{`
        @media print {
          html, body {
            background: white !important;
            visibility: hidden;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-invoice, .print-invoice * { visibility: visible; }
          .print-invoice {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100vh !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
          }
          .no-print { display: none !important; }
          @page {
            size: A5 portrait;
            margin: 0;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-2 sm:p-6"
        onClick={onClose}
      >
        <div
          className="print-invoice relative max-w-md mx-auto text-gray-800 rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-4"
          style={{ background: "#fdfcf9" }}
          onClick={e => e.stopPropagation()}
        >
          {/* ===== واترمارک — فقط متن، بدون Au ===== */}
          <div
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="font-serif italic font-black whitespace-nowrap -rotate-[22deg]"
                style={{
                  fontSize: 84,
                  letterSpacing: "0.05em",
                  color: "#a89674",
                  opacity: 0.04,
                  lineHeight: 1,
                }}
              >
                KIFE ZARGAR
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="font-bold whitespace-nowrap -rotate-[22deg]"
                style={{
                  fontSize: 16,
                  letterSpacing: "0.55em",
                  color: "#a89674",
                  opacity: 0.06,
                  marginTop: 78,
                }}
              >
                کیف زرگر
              </div>
            </div>
          </div>

          {/* ===== محتوای اصلی ===== */}
          <div className="relative z-10">
            {/* Header */}
            <div
              className="relative p-4 sm:p-5 border-b"
              style={{
                background: "#f5efe2",
                borderColor: "#e5dcc4",
              }}
            >
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div
                    className="font-black text-lg sm:text-xl font-serif italic tracking-wider"
                    style={{ color: "#8f7442" }}
                  >
                    KIFE ZARGAR
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    پلتفرم خرید و فروش طلا و جواهر
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5" dir="ltr">
                    kifzargar.com
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                    فاکتور فروش
                  </div>
                  <div
                    className="text-sm sm:text-base font-bold font-mono mt-1"
                    style={{ color: "#8f7442" }}
                    dir="ltr"
                  >
                    {order.id}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">{order.date}</div>
                </div>
              </div>
            </div>

            {/* Buyer & Seller */}
            <div className="grid grid-cols-2 gap-4 p-4 border-b" style={{ borderColor: "#ece5d3" }}>
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-1.5 pb-1 border-b"
                  style={{ color: "#8f7442", borderColor: "#e5dcc4" }}
                >
                  خریدار
                </div>
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <div className="font-bold text-gray-900 text-xs">{BUYER.name}</div>
                  <div className="flex justify-between gap-1 text-gray-700">
                    <span className="text-gray-400 text-[10px]">موبایل</span>
                    <span dir="ltr" className="font-mono">{BUYER.phone}</span>
                  </div>
                  <div className="flex justify-between gap-1 text-gray-700">
                    <span className="text-gray-400 text-[10px]">کد ملی</span>
                    <span className="font-mono">{BUYER.nationalId}</span>
                  </div>
                  <div className="text-gray-500 text-[10px] pt-1 leading-relaxed">
                    {BUYER.address}
                  </div>
                </div>
              </div>

              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-1.5 pb-1 border-b"
                  style={{ color: "#8f7442", borderColor: "#e5dcc4" }}
                >
                  فروشنده
                </div>
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <div className="font-bold text-gray-900 text-xs">{order.seller}</div>
                  <div className="flex justify-between gap-1 text-gray-700">
                    <span className="text-gray-400 text-[10px]">تلفن</span>
                    <span dir="ltr" className="font-mono">{sellerInfo.phone}</span>
                  </div>
                  <div className="flex justify-between gap-1 text-gray-700">
                    <span className="text-gray-400 text-[10px]">شناسه</span>
                    <span className="font-mono">{order.sellerId.toUpperCase()}</span>
                  </div>
                  <div className="text-gray-500 text-[10px] pt-1 leading-relaxed">
                    {sellerInfo.address}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Table */}
            <div className="p-4">
              <div
                className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 border-b-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "#8f7442", borderColor: "#d4c9aa" }}
              >
                <div>شرح کالا</div>
                <div className="text-center w-12">تعداد</div>
                <div className="text-left w-28">مبلغ (تومان)</div>
              </div>
              <div
                className="grid grid-cols-[1fr_auto_auto] gap-3 py-3 border-b items-center"
                style={{ borderColor: "#ece5d3" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border"
                    style={{ background: "#faf6ec", borderColor: "#e5dcc4" }}
                  >
                    {order.productIcon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-gray-900 truncate">
                      {order.productTitle}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {order.seller}
                    </div>
                  </div>
                </div>
                <div className="text-center text-[12px] font-bold w-12">
                  {format(order.quantity)}
                </div>
                <div className="text-left text-[12px] font-bold w-28">
                  {format(order.price)}
                </div>
              </div>
            </div>

            {/* Summary — شفاف‌تر */}
            <div className="px-4 pb-4 space-y-1">
              <div className="flex justify-between text-[11px] py-1">
                <span className="text-gray-500">جمع کالا و خدمات</span>
                <span className="font-semibold text-gray-800">{format(order.price)} تومان</span>
              </div>
              <div className="flex justify-between text-[11px] py-1">
                <span className="text-gray-500">مالیات بر ارزش افزوده</span>
                <span className="text-gray-500">شامل شده</span>
              </div>
              <div className="flex justify-between text-[11px] py-1">
                <span className="text-gray-500">اجرت و سود فروشنده</span>
                <span className="text-gray-500">شامل شده</span>
              </div>
              <div className="flex justify-between text-[11px] py-1 pb-2.5 border-b" style={{ borderColor: "#e5dcc4" }}>
                <span className="text-gray-500">روش پرداخت</span>
                <span className="font-semibold text-gray-800">
                  {order.paymentMethod === "gold" ? "کیف پول طلایی" : "کیف پول ریالی"}
                </span>
              </div>

              {/* Final Price — بلوک برجسته */}
              <div
                className="mt-2 rounded-xl p-3 flex justify-between items-center border"
                style={{
                  background: "#f5efe2",
                  borderColor: "#d4c9aa",
                }}
              >
                <span className="text-[12px] font-bold text-gray-800">مبلغ نهایی</span>
                <span className="text-lg font-black" style={{ color: "#7a6134" }}>
                  {format(order.price)}
                  <span className="text-[10px] font-normal text-gray-500 mr-1">تومان</span>
                </span>
              </div>
            </div>

            {/* Footer + seal */}
            <div
              className="px-4 pb-3 flex items-end justify-between gap-3 border-t pt-3"
              style={{ borderColor: "#ece5d3" }}
            >
              <div className="flex-1 text-[10px] text-gray-500 leading-relaxed">
                این فاکتور به صورت الکترونیکی صادر شده و بدون نیاز به مهر فیزیکی معتبر است.
                <div className="mt-1 font-mono text-[9px] text-gray-400" dir="ltr">
                  support@kifzargar.com | 021-91000000
                </div>
              </div>
              <div
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center text-center shrink-0 rotate-[-10deg] border border-dashed"
                style={{ borderColor: "#d4c9aa", background: "transparent" }}
              >
                <div className="text-[7px] font-black leading-tight" style={{ color: "#a89674" }}>
                  KIFE
                </div>
                <div className="text-[7px] font-black leading-tight" style={{ color: "#a89674" }}>
                  ZARGAR
                </div>
                <div className="text-[6px] font-bold mt-0.5 leading-tight" style={{ color: "#a89674" }}>
                  مهر الکترونیکی
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              className="no-print p-2.5 flex gap-2 border-t"
              style={{ background: "#f5efe2", borderColor: "#e5dcc4" }}
            >
              <button
                onClick={() => window.print()}
                className="flex-1 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-sm hover:shadow"
                style={{ background: "#8f7442" }}
              >
                🖨️ چاپ / دانلود PDF
              </button>
              <button
                onClick={onClose}
                className="px-5 bg-white border text-gray-700 text-xs font-bold py-2.5 rounded-lg transition hover:bg-gray-50"
                style={{ borderColor: "#d4c9aa" }}
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- Review Modal ----------
function ReviewModal({ order, onClose, onSubmit }: { order: Order; onClose: () => void; onSubmit: (r: Review) => void }) {
  const [productRating, setProductRating] = useState(0);
  const [sellerRating, setSellerRating] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const canSubmit = productRating > 0 && sellerRating > 0 && text.trim().length >= 5;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ productRating, sellerRating, text });
    setSubmitted(true);
    setTimeout(() => onClose(), 1200);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 left-3 text-[var(--muted)] hover:text-[var(--text)]"><CloseIcon /></button>

        <h2 className="text-base font-bold mb-1">ثبت نظر و امتیاز</h2>
        <p className="text-[11px] text-[var(--muted)] mb-4">تجربه خود را با سایر کاربران به اشتراک بگذارید</p>

        <div className="flex items-center gap-2.5 bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-2.5 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg)] flex items-center justify-center text-2xl shrink-0">{order.productIcon}</div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">{order.productTitle}</div>
            <div className="text-[10px] text-[var(--muted)] truncate">فروشنده: {order.seller}</div>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><CheckIcon /></div>
            <div className="text-sm font-bold mb-1">نظر شما ثبت شد</div>
            <div className="text-[11px] text-[var(--muted)]">با تشکر از مشارکت شما</div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-xs font-bold mb-2">امتیاز به محصول</div>
              <StarInput value={productRating} onChange={setProductRating} />
              {productRating > 0 && <div className="text-[10px] text-[var(--muted)] mt-1">{["خیلی بد", "بد", "متوسط", "خوب", "عالی"][productRating - 1]}</div>}
            </div>

            <div className="mb-4">
              <div className="text-xs font-bold mb-2">امتیاز به فروشنده</div>
              <StarInput value={sellerRating} onChange={setSellerRating} />
              {sellerRating > 0 && <div className="text-[10px] text-[var(--muted)] mt-1">{["خیلی بد", "بد", "متوسط", "خوب", "عالی"][sellerRating - 1]}</div>}
            </div>

            <div className="mb-4">
              <div className="text-xs font-bold mb-2">نظر شما</div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="تجربه خود را بنویسید..." rows={4} className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-2.5 text-xs outline-none focus:border-[var(--gold)] text-[var(--text)] placeholder:text-[var(--muted)] resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={!canSubmit} className="w-full bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-black font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed">
              ثبت نظر
            </button>
            <p className="text-[10px] text-[var(--muted)] text-center mt-2">نظر شما پس از تأیید نمایش داده می‌شود</p>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [tab, setTab] = useState<"all" | "current" | "delivered" | "cancelled">("all");
  const [reviewing, setReviewing] = useState<Order | null>(null);
  const [invoicing, setInvoicing] = useState<Order | null>(null);

  const filtered = orders.filter(o => {
    if (tab === "all") return true;
    if (tab === "current") return o.status === "pending" || o.status === "shipped";
    if (tab === "delivered") return o.status === "delivered";
    return o.status === "cancelled";
  });

  function handleReviewSubmit(review: Review) {
    if (!reviewing) return;
    setOrders(prev => prev.map(o => o.id === reviewing.id ? { ...o, hasReview: true } : o));
    console.log("Review submitted:", { order: reviewing.id, ...review });
  }

  return (
    <div className="px-2.5 sm:px-4 pt-3 pb-8">
      <div className="mb-4">
        <h1 className="font-bold text-lg sm:text-xl mb-1">سفارشات من</h1>
        <p className="text-[11px] text-[var(--muted)]">پیگیری و مدیریت خریدهای شما</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-[var(--border)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {([
          { id: "all", label: "همه" },
          { id: "current", label: "جاری" },
          { id: "delivered", label: "تحویل شده" },
          { id: "cancelled", label: "لغو شده" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap -mb-px border-b-2 transition-colors ${tab === t.id ? "text-[var(--gold)] border-[var(--gold)]" : "text-[var(--muted)] border-transparent hover:text-[var(--text)]"}`}
          >
            {t.label}
            {t.id === "delivered" && (
              <span className="ml-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded-full">
                {orders.filter(o => o.status === "delivered" && !o.hasReview).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3 opacity-50">📦</div>
          <div className="text-sm font-bold mb-1">سفارشی در این دسته نیست</div>
          <div className="text-[11px] text-[var(--muted)]">هنوز سفارشی با این وضعیت ندارید</div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(o => (
            <div key={o.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                  <span className="font-mono">{o.id}</span>
                  <span>·</span>
                  <span>{o.date}</span>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[var(--panel-2)] flex items-center justify-center text-3xl shrink-0">{o.productIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold truncate">{o.productTitle}</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">فروشنده: {o.seller}</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">تعداد: {format(o.quantity)}</div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-[var(--gold)]">{format(o.price)}</div>
                  <div className="text-[9px] text-[var(--muted)]">تومان</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)] flex-wrap">
                {o.status === "delivered" && !o.hasReview && (
                  <button onClick={() => setReviewing(o)} className="flex-1 sm:flex-none bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-black text-xs font-bold px-4 py-2 rounded-lg transition">
                    ⭐ ثبت نظر و امتیاز
                  </button>
                )}
                {o.status === "delivered" && o.hasReview && (
                  <div className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-lg">
                    <CheckIcon /> نظر شما ثبت شد
                  </div>
                )}
                {o.status === "shipped" && (
                  <button className="flex-1 sm:flex-none border border-[var(--border)] hover:border-[var(--gold)]/50 text-xs font-bold px-4 py-2 rounded-lg transition">
                    🚚 پیگیری مرسوله
                  </button>
                )}
                {o.status === "cancelled" && (
                  <button className="flex-1 sm:flex-none border border-[var(--border)] hover:border-[var(--gold)]/50 text-xs font-bold px-4 py-2 rounded-lg transition">
                    🛒 خرید مجدد
                  </button>
                )}
                <button onClick={() => setInvoicing(o)} className="flex-1 sm:flex-none border border-[var(--border)] hover:border-[var(--gold)]/50 text-xs font-bold px-4 py-2 rounded-lg transition flex items-center justify-center gap-1.5">
                  <InvoiceIcon /> مشاهده فاکتور
                </button>
              </div>

              {/* Note for pending */}
              {o.status === "pending" && (
                <div className="mt-2 text-[10px] text-[var(--muted)] flex items-start gap-1.5 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  سفارش شما پرداخت شده و در حال پردازش است. برای تغییر یا لغو سفارش با پشتیبانی تماس بگیرید.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reviewing && <ReviewModal order={reviewing} onClose={() => setReviewing(null)} onSubmit={handleReviewSubmit} />}
      {invoicing && <InvoiceModal order={invoicing} onClose={() => setInvoicing(null)} />}
    </div>
  );
}