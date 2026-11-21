
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useBankCards } from "@/lib/bank-cards";
import { useToast } from "@/components/ui/Toast";

type StakeStatus = "active" | "pending_release" | "cancelled" | "completed";

type ProfileStake = {
  id: string;
  amount: number;
  planId?: string;
  planLabel: string;
  rate: number;
  profit: number;
  finalAmount: number;
  startDate: string;
  endDate: string;
  status: StakeStatus;
  releaseAt?: string;
  cancellationRequestedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
};

const STAKING_STORAGE_KEY = "kif-zargar-staking-v1";

function readStakes(): ProfileStake[] {
  try {
    const raw = localStorage.getItem(STAKING_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    const now = Date.now();

    return parsed
      .filter((item): item is ProfileStake => {
        return (
          item &&
          typeof item.id === "string" &&
          typeof item.amount === "number" &&
          Number.isFinite(item.amount) &&
          typeof item.planLabel === "string" &&
          typeof item.rate === "number" &&
          typeof item.profit === "number" &&
          typeof item.finalAmount === "number" &&
          typeof item.startDate === "string" &&
          typeof item.endDate === "string" &&
          ["active", "pending_release", "cancelled", "completed"].includes(
            item.status
          )
        );
      })
      .map((item) => {
        if (
          item.status === "active" &&
          Number.isFinite(new Date(item.endDate).getTime()) &&
          new Date(item.endDate).getTime() <= now
        ) {
          return {
            ...item,
            status: "completed" as const,
            completedAt: item.completedAt || item.endDate,
          };
        }

        if (
          item.status === "pending_release" &&
          item.releaseAt &&
          Number.isFinite(new Date(item.releaseAt).getTime()) &&
          new Date(item.releaseAt).getTime() <= now
        ) {
          return {
            ...item,
            status: "cancelled" as const,
            cancelledAt: item.cancelledAt || new Date().toISOString(),
            profit: 0,
            finalAmount: item.amount,
          };
        }

        return item;
      });
  } catch {
    return [];
  }
}

function formatGold(value: number) {
  return value.toLocaleString("fa-IR", {
    maximumFractionDigits: 4,
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleDateString("fa-IR");
}

function getStatusLabel(status: StakeStatus) {
  switch (status) {
    case "active":
      return "فعال";
    case "pending_release":
      return "در انتظار تسویه";
    case "cancelled":
      return "لغوشده";
    case "completed":
      return "تکمیل‌شده";
  }
}

function getStatusClass(status: StakeStatus) {
  if (status === "active" || status === "completed") {
    return "text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/30";
  }
  if (status === "pending_release") {
    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  }
  return "text-[var(--muted)] bg-[var(--panel)] border-[var(--border)]";
}

export default function ProfilePage() {
  const { user, updateProfile, isVerified } = useAuth();
  const { cards, ready } = useBankCards();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [editing, setEditing] = useState(false);

  const [stakingItems, setStakingItems] = useState<ProfileStake[]>([]);
  const [stakingReady, setStakingReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(user?.email || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBirthDate(user?.birthDate || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddress(user?.address || "");
  }, [user]);

  useEffect(() => {
    const loadStakes = () => {
      const items = readStakes();

      setStakingItems(items);
      setStakingReady(true);

      try {
        const raw = localStorage.getItem(STAKING_STORAGE_KEY);
        if (raw !== JSON.stringify(items)) {
          localStorage.setItem(STAKING_STORAGE_KEY, JSON.stringify(items));
        }
      } catch {
        // Storage may be unavailable.
      }
    };

    loadStakes();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STAKING_STORAGE_KEY) loadStakes();
    };

    const handleFocus = () => loadStakes();

    const timer = window.setInterval(loadStakes, 1000);

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  function saveProfile() {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("فرمت ایمیل معتبر نیست");
      return;
    }

    updateProfile({
      email: email.trim(),
      birthDate,
      address: address.trim(),
    });

    setEditing(false);
    toast.success("اطلاعات پروفایل ذخیره شد");
  }

  const fullName = `${user?.firstName || "کاربر"} ${user?.lastName || "کیف زرگر"}`.trim();

  const fields: {
    label: string;
    value: string;
    locked: boolean;
    ltr?: boolean;
  }[] = [
    {
      label: "نام و نام خانوادگی",
      value: fullName,
      locked: isVerified,
    },
    {
      label: "شماره موبایل",
      value: user?.phone || "—",
      locked: true,
      ltr: true,
    },
    {
      label: "کد ملی",
      value: user?.nationalId || "ثبت نشده",
      locked: true,
      ltr: true,
    },
  ];

  const activeStakingItems = stakingItems.filter(
    (item) => item.status === "active"
  );

  const pendingStakingItems = stakingItems.filter(
    (item) => item.status === "pending_release"
  );

  const lockedStakingItems = stakingItems.filter(
    (item) =>
      item.status === "active" || item.status === "pending_release"
  );

  const completedStakingItems = stakingItems.filter(
    (item) => item.status === "completed"
  );

  const cancelledStakingItems = stakingItems.filter(
    (item) => item.status === "cancelled"
  );

  const totalStakedGold = lockedStakingItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const totalEstimatedProfit = activeStakingItems.reduce(
    (sum, item) => sum + item.profit,
    0
  );

  const recentStakes = [...stakingItems]
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() -
        new Date(a.startDate).getTime()
    )
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-3.5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black">پروفایل کاربری</h1>
          <p className="text-[9px] sm:text-xs text-[var(--muted)] mt-1">
            مدیریت مشخصات و اطلاعات حساب شما
          </p>
        </div>

        <Link
          href="/settings"
          className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[9px] font-bold flex items-center gap-2"
        >
          ⚙ تنظیمات
        </Link>
      </div>

      {/* User information */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 text-[var(--gold)] grid place-items-center text-lg font-black shrink-0">
            {user?.firstName?.charAt(0) || "؟"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-black text-xs sm:text-base truncate">
              {fullName}
            </div>
            <div className="text-[9px] text-[var(--muted)] font-mono mt-1" dir="ltr">
              {user?.phone || "—"}
            </div>
          </div>

          <span className={`text-[8px] font-bold rounded-full px-2 py-1 border shrink-0 ${
            isVerified
              ? "text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/30"
              : "text-amber-400 bg-amber-500/10 border-amber-500/30"
          }`}>
            {isVerified ? "احراز هویت‌شده" : "احراز هویت تکمیل نشده"}
          </span>
        </div>

        {!isVerified && (
          <Link
            href="/verify"
            className="mt-3 block rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 text-[9px] text-amber-300"
          >
            برای استفاده از تمام امکانات، احراز هویت خود را تکمیل کنید ←
          </Link>
        )}
      </section>

      {/* Identity information */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-3 border-b border-[var(--border)] flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-black">اطلاعات هویتی</h2>
            <p className="text-[8px] text-[var(--muted)] mt-1">
              اطلاعات تأییدشده قابل ویرایش نیستند.
            </p>
          </div>
          <span className="text-base">🪪</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 p-3">
          {fields.map((field) => (
            <div key={field.label} className="rounded-lg bg-[var(--panel-2)] border border-[var(--border)] p-2.5">
              <div className="text-[8px] text-[var(--muted)] mb-1.5">{field.label}</div>
              <div className="text-[10px] font-bold" dir={field.ltr ? "ltr" : "rtl"}>
                {field.value || "—"}
              </div>
              {field.locked && (
                <div className="text-[7px] text-[var(--muted)] mt-1">🔒 غیرقابل ویرایش</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Additional information */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-3 border-b border-[var(--border)] flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-black">اطلاعات تکمیلی</h2>
            <p className="text-[8px] text-[var(--muted)] mt-1">ایمیل و اطلاعات تماس اختیاری</p>
          </div>

          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="text-[9px] font-bold text-[var(--gold)]"
          >
            {editing ? "لغو ویرایش" : "ویرایش اطلاعات"}
          </button>
        </div>

        <div className="p-3 grid sm:grid-cols-2 gap-2.5">
          <label className="block">
            <span className="block text-[8px] text-[var(--muted)] mb-1.5">ایمیل</span>
            <input
              disabled={!editing}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-10 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] disabled:opacity-70 px-3 text-[10px] outline-none focus:border-[var(--gold)]"
              dir="ltr"
            />
          </label>

          <label className="block">
            <span className="block text-[8px] text-[var(--muted)] mb-1.5">تاریخ تولد (اختیاری)</span>
            <input
              disabled={!editing}
              type="text"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              placeholder="مثلاً ۱۳۷۰/۰۵/۱۲"
              className="w-full h-10 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] disabled:opacity-70 px-3 text-[10px] outline-none focus:border-[var(--gold)]"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="block text-[8px] text-[var(--muted)] mb-1.5">نشانی (اختیاری)</span>
            <textarea
              disabled={!editing}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="نشانی محل سکونت..."
              className="w-full rounded-lg bg-[var(--panel-2)] border border-[var(--border)] disabled:opacity-70 p-2.5 text-[10px] outline-none focus:border-[var(--gold)] resize-y"
            />
          </label>

          {editing && (
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={saveProfile}
                className="h-9 px-5 rounded-lg bg-[var(--gold)] text-black text-[10px] font-black"
              >
                ذخیره تغییرات
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bank accounts */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/10 grid place-items-center text-base shrink-0">
            🏦
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-black">حساب‌های بانکی</h2>
            <p className="text-[8px] text-[var(--muted)] mt-1">
              {ready ? `${cards.length.toLocaleString("fa-IR")} کارت ثبت‌شده` : "در حال بارگذاری..."}
            </p>
          </div>

          <Link href="/profile/banks" className="text-[9px] font-bold text-[var(--gold)] shrink-0">
            مدیریت حساب‌ها ←
          </Link>
        </div>
      </section>

      {/* Gold staking */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-3 border-b border-[var(--border)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 grid place-items-center text-base shrink-0">
              🪙
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black">استیک طلا</h2>
              <p className="text-[8px] text-[var(--muted)] mt-0.5">
                مدیریت سرمایه‌گذاری و سود طرح‌ها
              </p>
            </div>
          </div>

          <Link
            href="/staking"
            className="h-7 px-2.5 rounded-lg bg-[var(--gold)] text-black text-[8px] font-black flex items-center shrink-0"
          >
            ورود به استیک +
          </Link>
        </div>

        <div className="p-2.5 sm:p-3 space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            <SummaryCard
              label="طلای قفل‌شده"
              value={stakingReady ? formatGold(totalStakedGold) : "—"}
              unit="گرم"
            />
            <SummaryCard
              label="سود تخمینی فعال"
              value={stakingReady ? formatGold(totalEstimatedProfit) : "—"}
              unit="گرم طلا"
              green
            />
            <SummaryCard
              label="طرح‌های فعال"
              value={stakingReady ? activeStakingItems.length.toLocaleString("fa-IR") : "—"}
              unit="طرح"
            />
          </div>

          {stakingReady && pendingStakingItems.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[8px] text-amber-400 leading-5">
              {pendingStakingItems.length.toLocaleString("fa-IR")} طرح در انتظار تسویه است. اصل طلای این طرح‌ها هنوز آزاد نشده و در موجودی قفل‌شده محاسبه می‌شود.
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="text-[9px] font-black">آخرین طرح‌های استیک</div>
            <div className="text-[8px] text-[var(--muted)]">
              {stakingReady ? `${stakingItems.length.toLocaleString("fa-IR")} طرح` : "در حال بارگذاری..."}
            </div>
          </div>

          {!stakingReady ? (
            <div className="rounded-lg bg-[var(--panel-2)] p-3 text-center text-[8px] text-[var(--muted)]">
              در حال دریافت اطلاعات استیک...
            </div>
          ) : recentStakes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--panel-2)] p-3 text-center">
              <div className="text-lg mb-1">🪙</div>
              <div className="text-[9px] font-bold">هنوز طرح استیکی ثبت نکرده‌اید</div>
              <p className="text-[8px] text-[var(--muted)] mt-1">
                با انتخاب یکی از طرح‌ها می‌توانید استیک طلا را شروع کنید.
              </p>
              <Link href="/staking" className="inline-flex mt-2 h-7 px-3 rounded-lg bg-[var(--gold)] text-black text-[8px] font-black items-center">
                مشاهده طرح‌های استیک
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentStakes.map((item) => (
                <div key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[9px] font-black truncate">{item.planLabel}</div>
                      <div className="text-[7px] text-[var(--muted)] mt-1">
                        شروع: {formatDate(item.startDate)}
                      </div>
                    </div>

                    <span className={`text-[7px] px-2 py-1 rounded-full border shrink-0 ${getStatusClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-[var(--border)]">
                    <MiniValue label="مقدار" value={`${formatGold(item.amount)} گرم`} />
                    <MiniValue
                      label={item.status === "active" || item.status === "completed" ? "سود" : "سود حذف‌شده"}
                      value={`${formatGold(item.profit)} گرم`}
                      green={item.status === "active" || item.status === "completed"}
                    />
                    <MiniValue label="نرخ سود" value={`${item.rate.toLocaleString("fa-IR")}٪`} />
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 text-[7px] text-[var(--muted)]">
                    <span>
                      {item.status === "pending_release"
                        ? `آزادسازی: ${formatDate(item.releaseAt || "")}`
                        : `سررسید: ${formatDate(item.endDate)}`}
                    </span>
                    <span>
                      {item.status === "pending_release"
                        ? "در انتظار بازگشت اصل طلا"
                        : item.status === "cancelled"
                          ? "اصل طلا بازگشته"
                          : item.status === "completed"
                            ? "دوره به پایان رسیده"
                            : "در حال استیک"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {stakingReady && (completedStakingItems.length > 0 || cancelledStakingItems.length > 0) && (
            <div className="flex items-center justify-between rounded-lg bg-[var(--panel-2)] px-2.5 py-2 text-[8px]">
              <span className="text-[var(--muted)]">سوابق پایان‌یافته</span>
              <span className="font-bold">
                {(completedStakingItems.length + cancelledStakingItems.length).toLocaleString("fa-IR")} طرح
              </span>
            </div>
          )}

          <div className="text-[7px] leading-5 text-[var(--muted)]">
            اطلاعات استیک در این نسخه آزمایشی از حافظه محلی مرورگر خوانده می‌شود. سود نمایش‌داده‌شده تخمینی است و تا اتصال به سرویس واقعی، جنبه مالی و قطعی ندارد.
          </div>
        </div>
      </section>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <QuickLink href="/orders" icon="🧾" label="سفارشات من" />
        <QuickLink href="/reports" icon="▤" label="گزارش فعالیت‌ها" />
        <QuickLink href="/notifications" icon="🔔" label="اعلان‌ها" />
        <QuickLink href="/settings/sessions" icon="💻" label="نشست‌های فعال" />
      </div>

      <p className="text-[8px] leading-5 text-[var(--muted)]">
        این نسخه نمایشی اطلاعات پروفایل را در حافظه محلی مرورگر نگهداری می‌کند. برای استفاده عملیاتی، تغییرات باید از طریق API امن و همراه با تأیید سمت سرور ذخیره شوند.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  green,
}: {
  label: string;
  value: string;
  unit: string;
  green?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2 min-w-0">
      <div className="text-[7px] text-[var(--muted)] leading-4">{label}</div>
      <div className={`text-xs font-black mt-1 truncate ${green ? "text-[var(--green)]" : ""}`}>
        {value}
      </div>
      <div className="text-[7px] text-[var(--muted)] mt-0.5">{unit}</div>
    </div>
  );
}

function MiniValue({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[7px] text-[var(--muted)]">{label}</div>
      <div className={`text-[8px] font-bold mt-1 truncate ${green ? "text-[var(--green)]" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-2.5 flex items-center gap-2 hover:border-[var(--gold)]/40 transition"
    >
      <span className="text-sm">{icon}</span>
      <span className="text-[9px] font-bold">{label}</span>
    </Link>
  );
}
