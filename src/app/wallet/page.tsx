"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import TradeInvoice, { type TradeInvoiceData } from "@/components/TradeInvoice";
import TransferReceipt, { type TransferReceiptData } from "@/components/TransferReceipt";
import AddCardModal, { type BankCard } from "@/components/AddCardModal";
import DeleteCardModal from "@/components/DeleteCardModal";

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toFa = (s: string) =>
  s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/\./g, "٫");

// نمایش مقدار بر اساس نوع (طلا با اعشار، ریال با کاما)
const displayAmount = (amount: number, type: "rial" | "gold") => {
  if (type === "gold") return toFa(amount.toFixed(3));
  return format(amount);
};

const WALLET_DATA = {
  cashBalance: 171_274_000,
  goldBalance: 12.450,
  goldValue: 237_546_000,
  depositId: "84721938",
};

const BUYER_INFO = {
  name: "علی رضایی",
  nationalId: "0012345678",
  phone: "09121234567",
};

type TxType = "deposit" | "withdraw" | "transfer" | "buy" | "sell";
type TxStatus = "success" | "pending" | "rejected";

type Transaction = {
  id: string;
  type: TxType;
  title: string;
  date: string;
  time: string;
  amount: number;                    // ← عدد خالص
  amountType: "rial" | "gold";
  positive: boolean;
  status: TxStatus;
  trackingCode?: string;
  recipientName?: string;
  recipientPhone?: string;
  note?: string;
  fee?: number;
  tradeInvoice?: TradeInvoiceData;
};

const TRANSACTIONS: Transaction[] = [
  {
    id: "t1", type: "deposit", title: "واریز از درگاه بانکی",
    date: "امروز", time: "۱۲:۴۰", amount: 10_000_000,
    amountType: "rial", positive: true, status: "success",
    trackingCode: "DEP-847291",
  },
  {
    id: "t2", type: "buy", title: "خرید طلای ۱۸ عیار",
    date: "امروز", time: "۰۹:۱۵", amount: 2.5,
    amountType: "gold", positive: true, status: "success",
    tradeInvoice: {
      trackingCode: "TRD-A7K29M",
      dateTime: "۰۹:۱۵ · ۱۴۰۴/۰۸/۲۰",
      side: "buy",
      orderType: "instant",
      symbolName: "طلای ۱۸ عیار",
      unit: "گرم",
      amount: 2.5,
      price: 19_080_000,
      total: 47_700_000,
      fee: 477_000,
      finalAmount: 48_177_000,
      paymentMethod: "rial",
      buyer: BUYER_INFO,
    },
  },
  {
    id: "t3", type: "withdraw", title: "برداشت به بانک ملی",
    date: "دیروز", time: "۱۶:۲۰", amount: 5_000_000,
    amountType: "rial", positive: false, status: "pending",
    trackingCode: "WDR-561823",
  },
  {
    id: "t4", type: "transfer", title: "انتقال طلا به مریم احمدی",
    date: "۲ روز پیش", time: "۱۴:۰۰", amount: 0.5,
    amountType: "gold", positive: false, status: "success",
    trackingCode: "TRX-A7K29M",
    recipientName: "مریم احمدی",
    recipientPhone: "09123456789",
    note: "پرداخت بابت خرید طلا",
    fee: 0.0005,
  },
  {
    id: "t5", type: "sell", title: "فروش طلا",
    date: "۳ روز پیش", time: "۱۰:۳۰", amount: 1.2,
    amountType: "gold", positive: false, status: "success",
    tradeInvoice: {
      trackingCode: "TRD-B3F92N",
      dateTime: "۱۰:۳۰ · ۱۴۰۴/۰۸/۱۷",
      side: "sell",
      orderType: "limit",
      symbolName: "طلای ۱۸ عیار",
      unit: "گرم",
      amount: 1.2,
      price: 19_050_000,
      total: 22_860_000,
      fee: 228_600,
      finalAmount: 22_631_400,
      paymentMethod: "rial",
      buyer: BUYER_INFO,
    },
  },
  {
    id: "t6", type: "deposit", title: "واریز دستی (فیش)",
    date: "۴ روز پیش", time: "۰۹:۰۰", amount: 20_000_000,
    amountType: "rial", positive: true, status: "success",
    trackingCode: "DEP-192837",
  },
  {
    id: "t7", type: "transfer", title: "انتقال طلا به رضا کریمی",
    date: "۵ روز پیش", time: "۱۱:۳۰", amount: 0.25,
    amountType: "gold", positive: false, status: "success",
    trackingCode: "TRX-B3F92N",
    recipientName: "رضا کریمی",
    recipientPhone: "09134567890",
    note: "هدیه تولد",
    fee: 0.00025,
  },
];

const ICONS = {
  deposit: { icon: "↙", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  withdraw: { icon: "↗", color: "text-red-400", bg: "bg-red-500/10" },
  transfer: { icon: "⇄", color: "text-violet-400", bg: "bg-violet-500/10" },
  buy: { icon: "↓", color: "text-sky-400", bg: "bg-sky-500/10" },
  sell: { icon: "↑", color: "text-amber-400", bg: "bg-amber-500/10" },
};

const STATUS_STYLE = {
  success: { label: "موفق", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  pending: { label: "در انتظار", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  rejected: { label: "رد شده", color: "text-red-400 bg-red-500/10 border-red-500/30" },
};

const SHAREABLE_TYPES: TxType[] = ["deposit", "withdraw"];

type Filter = "all" | "deposit" | "withdraw" | "transfer" | "trade";

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [showAllTx, setShowAllTx] = useState(false);
  const [sharedTx, setSharedTx] = useState<string | null>(null);
  const [invoiceTx, setInvoiceTx] = useState<TradeInvoiceData | null>(null);
  const [transferReceipt, setTransferReceipt] = useState<TransferReceiptData | null>(null);
  const [bankCards, setBankCards] = useState<BankCard[]>([
    { id: "card1", bank: "بانک ملی ایران", last4: "4589", iban: "IR820170000000123456789012", cardNumber: "6104337845891234", isDefault: true },
    { id: "card2", bank: "بانک سامان", last4: "7823", iban: "IR980560000000987654321098", cardNumber: "6219861778235678", isDefault: false },
  ]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [deleteCard, setDeleteCard] = useState<BankCard | null>(null);

  const walletAddress = WALLET_DATA.depositId;
  const formattedId = `${walletAddress.slice(0, 4)}-${walletAddress.slice(4, 8)}`;

  function handleCopy() {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareTx(tx: Transaction) {
    let text = `🧾 رسید رسمی — کیف زرگر\n━━━━━━━━━━━━━━━━━━\n`;
    text += `نوع: ${tx.title}\n`;
    text += `مقدار: ${displayAmount(tx.amount, tx.amountType)} ${tx.amountType === "gold" ? "گرم" : "تومان"}\n`;
    text += `تاریخ: ${tx.date} · ${tx.time}\n`;
    if (tx.trackingCode) text += `کد پیگیری: ${tx.trackingCode}\n`;
    text += `\nوضعیت: ${STATUS_STYLE[tx.status]?.label || tx.status}\n━━━━━━━━━━━━━━━━━━\n`;
    text += `🔍 استعلام: kifzargar.com/verify/${tx.trackingCode || ""}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `رسید ${tx.title}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        setSharedTx(tx.id);
        setTimeout(() => setSharedTx(null), 2000);
      }
    } catch {}
  }

  function openTransferReceipt(tx: Transaction) {
    if (tx.type !== "transfer") return;
    if (!tx.recipientName || !tx.recipientPhone || !tx.trackingCode) return;

    setTransferReceipt({
      trackingCode: tx.trackingCode,
      date: tx.date,
      time: tx.time,
      amount: tx.amount,                    // ← حالا مستقیماً عدد
      unit: tx.amountType === "gold" ? "گرم" : "تومان",
      fee: tx.fee || 0,
      recipientName: tx.recipientName,
      recipientPhone: tx.recipientPhone,
      note: tx.note,
    });
  }

  const filteredTx = TRANSACTIONS.filter(tx => {
    if (filter === "all") return true;
    if (filter === "deposit") return tx.type === "deposit";
    if (filter === "withdraw") return tx.type === "withdraw";
    if (filter === "transfer") return tx.type === "transfer";
    if (filter === "trade") return tx.type === "buy" || tx.type === "sell";
    return true;
  });

  const visibleTx = showAllTx ? filteredTx : filteredTx.slice(0, 4);

  return (
    <div className="px-2.5 sm:px-4 pt-3 pb-8">
      <div className="mb-4">
        <h1 className="font-bold text-lg sm:text-xl mb-1">کیف پول</h1>
        <p className="text-[11px] text-[var(--muted)]">مدیریت دارایی‌ها و تراکنش‌های مالی</p>
      </div>

      <section className="relative rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--panel)] via-[var(--panel)] to-[var(--gold)]/5 p-4 mb-3 overflow-hidden">
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[var(--gold)] opacity-[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] text-[var(--muted)] mb-1">موجودی کل</div>
              <div className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
                {hideBalance ? "••••••" : format(WALLET_DATA.cashBalance + WALLET_DATA.goldValue)}
                <span className="text-[11px] font-normal text-[var(--muted)] mr-1.5">تومان</span>
              </div>
            </div>
            <button
              onClick={() => setHideBalance(v => !v)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--muted)] hover:text-[var(--gold)] transition shrink-0"
              aria-label={hideBalance ? "نمایش" : "مخفی کردن"}
            >
              {hideBalance ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px]">💵</span>
                <span className="text-[9.5px] text-[var(--muted)]">موجودی ریالی</span>
              </div>
              <div className="text-sm font-bold text-[var(--text)]">
                {hideBalance ? "••••" : format(WALLET_DATA.cashBalance)}
              </div>
              <div className="text-[9px] text-[var(--muted)] mt-0.5">تومان</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px]">🪙</span>
                <span className="text-[9.5px] text-[var(--muted)]">موجودی طلا</span>
              </div>
              <div className="text-sm font-bold text-[var(--gold)]">
                {hideBalance ? "••••" : WALLET_DATA.goldBalance.toFixed(3)}
              </div>
              <div className="text-[9px] text-[var(--muted)] mt-0.5">گرم</div>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-2.5 border border-[var(--gold)]/20 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[9px] text-[var(--muted)] mb-0.5">شناسه واریز شما</div>
              <div className="font-mono text-sm font-black text-[var(--gold)] tracking-wider" dir="ltr">
                {formattedId}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                copied ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--gold)]/15 text-[var(--gold)] hover:bg-[var(--gold)]/25"
              }`}
              aria-label="کپی"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2 mb-5">
        <button onClick={() => router.push("/wallet/deposit")} className="flex flex-col items-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] py-3 hover:border-[var(--gold)]/50 transition group">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-[var(--text)]">واریز</span>
        </button>
        <button onClick={() => router.push("/wallet/withdraw")} className="flex flex-col items-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] py-3 hover:border-[var(--gold)]/50 transition group">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center group-hover:scale-110 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21V9" /><path d="M17 14l-5-5-5 5" /><path d="M4 3h16" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-[var(--text)]">برداشت</span>
        </button>
        <button onClick={() => router.push("/wallet/transfer")} className="flex flex-col items-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] py-3 hover:border-[var(--gold)]/50 transition group">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-110 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-[var(--text)]">انتقال</span>
        </button>
        <button onClick={() => router.push("/wallet/physical")} className="flex flex-col items-center gap-1.5 rounded-xl bg-[var(--panel)] border border-[var(--border)] py-3 hover:border-[var(--gold)]/50 transition group">
          <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center group-hover:scale-110 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 15h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z" />
              <path d="M5 15l2-8h10l2 8" /><path d="M9 11h6" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-[var(--text)]">فیزیکی</span>
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-xs flex items-center gap-1.5">
              <span>🏦</span>
              کارت‌های بانکی
            </h2>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">{bankCards.length} کارت ثبت شده</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCard(true)}
            className="text-[10px] font-bold text-[var(--gold)] border border-[var(--gold)]/30 rounded-lg px-2.5 py-1 hover:bg-[var(--gold)]/10 transition"
          >
            + افزودن
          </button>
        </div>

        <div className="space-y-2">
          {bankCards.map(card => (
            <div key={card.id} className="flex items-center gap-2.5 bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-2.5">
              <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-base shrink-0">🏦</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold">{card.bank}</span>
                  {card.isDefault && (
                    <span className="text-[8px] bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 px-1.5 py-0.5 rounded font-bold">پیش‌فرض</span>
                  )}
                </div>
                <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">•••• {card.last4}</div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteCard(card)}
                className="w-7 h-7 rounded-md text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition flex items-center justify-center shrink-0"
                aria-label="حذف"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-xs">تاریخچه تراکنش‌ها</h2>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">{filteredTx.length} تراکنش</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            { id: "all", label: "همه" },
            { id: "deposit", label: "واریز" },
            { id: "withdraw", label: "برداشت" },
            { id: "transfer", label: "انتقال" },
            { id: "trade", label: "معاملات" },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                filter === f.id
                  ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                  : "bg-transparent text-[var(--muted)] border-[var(--border)] hover:border-[var(--gold)]/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visibleTx.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2 opacity-40">📭</div>
            <div className="text-[11px] text-[var(--muted)]">تراکنشی در این دسته نیست</div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {visibleTx.map(tx => {
              const iconData = ICONS[tx.type];
              const statusData = STATUS_STYLE[tx.status];
              const canShare = SHAREABLE_TYPES.includes(tx.type);
              const isShared = sharedTx === tx.id;
              const hasInvoice = !!tx.tradeInvoice;
              const isTransfer = tx.type === "transfer";

              return (
                <div
                  key={tx.id}
                  onClick={() => isTransfer && openTransferReceipt(tx)}
                  className={`flex items-center gap-2 py-2.5 ${
                    isTransfer ? "cursor-pointer hover:bg-[var(--panel-2)]/50 -mx-2 px-2 rounded-lg transition" : ""
                  }`}
                  role={isTransfer ? "button" : undefined}
                  tabIndex={isTransfer ? 0 : undefined}
                  onKeyDown={
                    isTransfer
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openTransferReceipt(tx);
                          }
                        }
                      : undefined
                  }
                >
                  <div className={`w-8 h-8 rounded-lg ${iconData.bg} ${iconData.color} flex items-center justify-center text-sm shrink-0`}>
                    {iconData.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate">{tx.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[9.5px] text-[var(--muted)]">{tx.date} · {tx.time}</span>
                      {tx.status !== "success" && (
                        <span className={`text-[8.5px] font-bold border px-1 py-0.5 rounded ${statusData.color}`}>
                          {statusData.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className={`text-[11px] font-bold ${tx.positive ? "text-emerald-400" : "text-red-400"}`} dir="ltr">
                      {tx.positive ? "+" : "−"}{displayAmount(tx.amount, tx.amountType)}
                    </div>
                    <div className="text-[9px] text-[var(--muted)] mt-0.5">
                      {tx.amountType === "gold" ? "گرم" : "تومان"}
                    </div>
                  </div>

                  {hasInvoice && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInvoiceTx(tx.tradeInvoice!);
                      }}
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[var(--gold)] bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 transition"
                      aria-label="مشاهده فاکتور رسمی"
                      title="مشاهده فاکتور رسمی"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </button>
                  )}

                  {isTransfer && (
                    <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-violet-400" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  )}

                  {canShare && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareTx(tx);
                      }}
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition ${
                        isShared
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10"
                      }`}
                      aria-label="اشتراک‌گذاری رسید"
                      title="اشتراک‌گذاری رسید"
                    >
                      {isShared ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filteredTx.length > 4 && !showAllTx && (
          <button
            onClick={() => setShowAllTx(true)}
            className="w-full mt-3 py-2 rounded-lg border border-[var(--border)] text-[10.5px] font-bold text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/50 transition"
          >
            مشاهده همه تراکنش‌ها
          </button>
        )}
        {/* دکمه استعلام رسید */}
<div className="mt-3 pt-3 border-t border-[var(--border)]">
  <button
    type="button"
    onClick={() => router.push("/verify")}
    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--border)] text-[10.5px] font-bold text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/50 transition"
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    استعلام رسیدهایم را چک کنم
  </button>
</div>
      </section>

      {invoiceTx && <TradeInvoice trade={invoiceTx} onClose={() => setInvoiceTx(null)} />}

      {transferReceipt && (
        <TransferReceipt transfer={transferReceipt} onClose={() => setTransferReceipt(null)} />
      )}

      {showAddCard && (
        <AddCardModal
          onClose={() => setShowAddCard(false)}
          onAdd={(newCard) => {
            setBankCards(prev => [...prev, newCard]);
            setShowAddCard(false);
          }}
        />
      )}

      {deleteCard && (
        <DeleteCardModal
          card={deleteCard}
          onClose={() => setDeleteCard(null)}
          onDelete={() => {
            setBankCards(prev => prev.filter(c => c.id !== deleteCard.id));
            setDeleteCard(null);
          }}
        />
      )}
    </div>
  );
}