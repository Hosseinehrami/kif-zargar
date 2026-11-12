"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, toFa } from "@/lib/format";

// ==========================================
// انواع
// ==========================================
type NotifType = "transaction" | "price" | "system" | "security" | "promo";
type FilterId = "all" | "unread" | "transaction" | "price" | "system";

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
  amount?: number;
};

// ==========================================
// متادیتای نوع اعلان
// ==========================================
const TYPE_META: Record<NotifType, { emoji: string; color: string; bg: string; border: string; label: string }> = {
  transaction: { emoji: "💰", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "تراکنش" },
  price:       { emoji: "📈", color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   label: "قیمت" },
  system:      { emoji: "🔔", color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/30",     label: "اطلاعیه" },
  security:    { emoji: "🔐", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     label: "امنیتی" },
  promo:       { emoji: "🎁", color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/30",  label: "تخفیف" },
};

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "unread", label: "نخوانده" },
  { id: "transaction", label: "تراکنش" },
  { id: "price", label: "قیمت" },
  { id: "system", label: "اطلاعیه" },
];

// ==========================================
// داده‌های نمونه (بعداً از API)
// ==========================================
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "transaction", title: "خرید طلا انجام شد", message: "۵.۲ گرم طلا به کیف پول شما اضافه شد", time: "۲ دقیقه پیش", read: false, amount: 99_216_000 },
  { id: "2", type: "price", title: "هشدار قیمت طلا", message: "قیمت هر گرم طلا به ۱۹,۰۸۰,۰۰۰ تومان رسید", time: "۱۵ دقیقه پیش", read: false },
  { id: "3", type: "system", title: "به‌روزرسانی اپلیکیشن", message: "نسخه جدید کیف زرگر با امکانات بهتر منتشر شد", time: "۱ ساعت پیش", read: false },
  { id: "4", type: "transaction", title: "واریز ریالی موفق", message: "۵۰,۰۰۰,۰۰۰ تومان به حساب شما واریز شد", time: "۳ ساعت پیش", read: true, amount: 50_000_000 },
  { id: "5", type: "security", title: "ورود جدید به حساب", message: "ورود موفق از دستگاه جدید (Chrome - تهران)", time: "دیروز ۱۴:۳۲", read: true },
  { id: "6", type: "promo", title: "دعوت از دوستان", message: "با دعوت دوستان ۵۰۰,۰۰۰ تومان پاداش بگیرید", time: "دیروز ۱۰:۰۰", read: true, href: "/referral" },
  { id: "7", type: "transaction", title: "برداشت فیزیکی تایید شد", message: "درخواست برداشت ۱۰ گرم شمش شما تایید شد", time: "۲ روز پیش", read: true },
  { id: "8", type: "system", title: "احراز هویت تکمیل شد", message: "سطح یک احراز هویت شما با موفقیت تکمیل شد", time: "۳ روز پیش", read: true },
];

function matchesFilter(n: Notification, f: FilterId): boolean {
  if (f === "all") return true;
  if (f === "unread") return !n.read;
  if (f === "transaction") return n.type === "transaction";
  if (f === "price") return n.type === "price";
  if (f === "system") return n.type === "system" || n.type === "security" || n.type === "promo";
  return true;
}

// ==========================================
// کامپوننت
// ==========================================
export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterId>("all");

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);
  const filtered = useMemo(() => items.filter((n) => matchesFilter(n, filter)), [items, filter]);

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleClick(n: Notification) {
    markRead(n.id);
    if (n.href) router.push(n.href);
  }

  return (
    <div className="px-2.5 sm:px-4 pt-3 pb-8">
      {/* هدر */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition"
          aria-label="بازگشت"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base sm:text-lg flex items-center gap-2 flex-wrap">
            اعلان‌ها
            {unreadCount > 0 && (
              <span className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold">
                {toFa(String(unreadCount))} جدید
              </span>
            )}
          </h1>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">تراکنش‌ها، هشدارها و اطلاعیه‌ها</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="h-8 px-2.5 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)] text-[10px] font-bold hover:bg-[var(--gold)]/20 transition flex items-center gap-1 shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            خواندن همه
          </button>
        )}
      </div>

      {/* فیلترها */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count =
            f.id === "unread"
              ? unreadCount
              : f.id === "all"
              ? items.length
              : items.filter((n) => matchesFilter(n, f.id)).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 h-8 px-3 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1.5 ${
                active
                  ? "bg-[var(--gold)] text-black"
                  : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--gold)]/40"
              }`}
            >
              {f.label}
              <span className={`text-[9px] ${active ? "text-black/60" : "text-[var(--muted)]"}`}>
                {toFa(String(count))}
              </span>
            </button>
          );
        })}
      </div>

      {/* لیست */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center">
          <div className="text-5xl mb-3 opacity-40">📭</div>
          <div className="text-[12px] font-bold text-[var(--text)] mb-1">
            {filter === "unread" ? "همه‌چیز خوانده شده" : "اعلانی وجود ندارد"}
          </div>
          <div className="text-[10px] text-[var(--muted)]">
            {filter === "unread"
              ? "اعلان نخوانده‌ای نداری"
              : "اعلان جدیدی برای این بخش نیست"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = TYPE_META[n.type];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-right rounded-2xl border p-3 transition flex items-start gap-3 relative ${
                  !n.read
                    ? "bg-gradient-to-l from-[var(--gold)]/[0.04] to-[var(--panel)] border-[var(--gold)]/25 hover:border-[var(--gold)]/50"
                    : "bg-[var(--panel)] border-[var(--border)] hover:bg-[var(--panel-2)]"
                }`}
              >
                {/* آیکون */}
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl ${meta.bg} ${meta.border} border flex items-center justify-center text-lg`}
                >
                  {meta.emoji}
                </div>

                {/* محتوا */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div
                      className={`text-[11.5px] font-bold truncate ${
                        !n.read ? "text-[var(--text)]" : "text-[var(--text)]/80"
                      }`}
                    >
                      {n.title}
                    </div>
                    {!n.read && (
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--muted)] leading-relaxed">
                    {n.message}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[9px] text-[var(--muted)]">{n.time}</span>
                    {n.amount !== undefined && (
                      <span className="text-[9px] font-bold text-emerald-400">
                        {format(n.amount)} تومان
                      </span>
                    )}
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded border ${meta.color} ${meta.bg} ${meta.border}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>

                {/* فلش اگر لینک دارد */}
                {n.href && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 mt-1"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* پانویس */}
      {filtered.length > 0 && (
        <div className="text-center text-[9.5px] text-[var(--muted)] mt-4 leading-relaxed">
          اعلان‌ها به مدت ۳۰ روز در این صفحه نگهداری می‌شوند
        </div>
      )}
    </div>
  );
}