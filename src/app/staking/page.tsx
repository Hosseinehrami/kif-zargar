
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

type PlanId = "3m" | "6m" | "1y";
type TabId = "new" | "active" | "history";
type StakeStatus = "active" | "pending_release" | "cancelled" | "completed";

type Plan = {
  id: PlanId;
  label: string;
  months: number;
  rate: number;
  releaseDays: number;
  description: string;
};

type Stake = {
  id: string;
  amount: number;
  planId: PlanId;
  planLabel: string;
  months: number;
  rate: number;
  profit: number;
  finalAmount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  completedAt?: string;
  cancellationRequestedAt?: string;
  releaseAt?: string;
  cancelledAt?: string;
  status: StakeStatus;
};

const STORAGE_KEY = "kif-zargar-staking-v1";
const DEMO_WALLET_GOLD = 12.45;

const PLANS: Plan[] = [
  {
    id: "3m",
    label: "سه‌ماهه",
    months: 3,
    rate: 5,
    releaseDays: 2,
    description: "مناسب سرمایه‌گذاری کوتاه‌مدت",
  },
  {
    id: "6m",
    label: "شش‌ماهه",
    months: 6,
    rate: 12,
    releaseDays: 3,
    description: "مناسب سرمایه‌گذاری میان‌مدت",
  },
  {
    id: "1y",
    label: "یک‌ساله",
    months: 12,
    rate: 25,
    releaseDays: 5,
    description: "مناسب سرمایه‌گذاری بلندمدت",
  },
];

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function parseAmount(value: string) {
  const normalized = normalizeDigits(value)
    .replace(/,/g, ".")
    .replace(/[٬،\s]/g, "");

  if (!normalized || !/^\d+(\.\d*)?$/.test(normalized)) return 0;

  const result = Number(normalized);
  return Number.isFinite(result) ? result : 0;
}

function formatGold(value: number, digits = 4) {
  return value.toLocaleString("fa-IR", {
    maximumFractionDigits: digits,
  });
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return `${date.toLocaleDateString("fa-IR")} - ${date.toLocaleTimeString(
    "fa-IR",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

// فرض آزمایشی تقویم کاری: پنج‌شنبه و جمعه تعطیل هستند.
function addBusinessDays(date: Date, days: number) {
  const result = new Date(date);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();

    if (day !== 4 && day !== 5) {
      added++;
    }
  }

  return result;
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidStake(item: unknown): item is Stake {
  if (!item || typeof item !== "object") return false;

  const s = item as Record<string, unknown>;

  return (
    typeof s.id === "string" &&
    typeof s.amount === "number" &&
    Number.isFinite(s.amount) &&
    s.amount > 0 &&
    ["3m", "6m", "1y"].includes(String(s.planId)) &&
    typeof s.planLabel === "string" &&
    typeof s.months === "number" &&
    typeof s.rate === "number" &&
    typeof s.profit === "number" &&
    typeof s.finalAmount === "number" &&
    typeof s.startDate === "string" &&
    typeof s.endDate === "string" &&
    typeof s.createdAt === "string" &&
    ["active", "pending_release", "cancelled", "completed"].includes(
      String(s.status)
    )
  );
}

function migrateStake(item: Stake): Stake {
  const plan = PLANS.find((p) => p.id === item.planId);

  return {
    ...item,
    months: item.months || plan?.months || 3,
    rate: item.rate ?? plan?.rate ?? 0,
    status: item.status || "active",
  };
}

function readStakes(): Stake[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    const now = Date.now();

    return parsed.filter(isValidStake).map(migrateStake).map((stake) => {
      if (
        stake.status === "active" &&
        new Date(stake.endDate).getTime() <= now
      ) {
        return {
          ...stake,
          status: "completed",
          completedAt: stake.completedAt || stake.endDate,
        };
      }

      if (
        stake.status === "pending_release" &&
        stake.releaseAt &&
        new Date(stake.releaseAt).getTime() <= now
      ) {
        return {
          ...stake,
          status: "cancelled",
          cancelledAt: stake.cancelledAt || new Date().toISOString(),
          profit: 0,
          finalAmount: stake.amount,
        };
      }

      return stake;
    });
  } catch {
    return [];
  }
}

function getProgress(stake: Stake) {
  const start = new Date(stake.startDate).getTime();
  const end = new Date(stake.endDate).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}

function getRemainingDays(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.ceil((time - Date.now()) / 86400000));
}

function getCountdown(value?: string) {
  if (!value) return "—";

  const remaining = Math.max(0, new Date(value).getTime() - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return `${days.toLocaleString("fa-IR")} روز و ${hours
    .toLocaleString("fa-IR")} ساعت و ${minutes
    .toLocaleString("fa-IR")} دقیقه و ${seconds.toLocaleString("fa-IR")} ثانیه`;
}

function getPlan(planId: PlanId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
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
  if (status === "active") {
    return "text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/20";
  }
  if (status === "pending_release") {
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  }
  if (status === "cancelled") {
    return "text-[var(--muted)] bg-[var(--panel)] border-[var(--border)]";
  }
  return "text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/20";
}

export default function StakingPage() {
  const toast = useToast();

  const [ready, setReady] = useState(false);
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("3m");
  const [amountInput, setAmountInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("new");

  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [detailStake, setDetailStake] = useState<Stake | null>(null);
  const [cancelStake, setCancelStake] = useState<Stake | null>(null);
  const [searchText, setSearchText] = useState("");
  const [clock, setClock] = useState(Date.now());

  const selectedPlan = getPlan(selectedPlanId);
  const amount = parseAmount(amountInput);

  const activeStakes = useMemo(
    () => stakes.filter((s) => s.status === "active"),
    [stakes]
  );

  const pendingStakes = useMemo(
    () => stakes.filter((s) => s.status === "pending_release"),
    [stakes]
  );

  const lockedStakes = useMemo(
    () => stakes.filter(
      (s) => s.status === "active" || s.status === "pending_release"
    ),
    [stakes]
  );

  const completedStakes = useMemo(
    () => stakes.filter(
      (s) => s.status === "completed" || s.status === "cancelled"
    ),
    [stakes]
  );

  const totalStaked = lockedStakes.reduce((sum, s) => sum + s.amount, 0);

  const totalActiveProfit = activeStakes.reduce(
    (sum, s) => sum + s.profit,
    0
  );

  const totalCompletedProfit = completedStakes
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.profit, 0);

  const availableGold = Math.max(0, DEMO_WALLET_GOLD - totalStaked);

  const estimatedProfit = amount * (selectedPlan.rate / 100);
  const finalAmount = amount + estimatedProfit;

  const filteredHistory = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const sorted = [...completedStakes].sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    if (!query) return sorted;

    return sorted.filter((item) =>
      item.planLabel.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    );
  }, [completedStakes, searchText]);

  const persistStakes = useCallback(
    (items: Stake[]) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        setStakes(items);
        return true;
      } catch {
        toast.error("ذخیره اطلاعات انجام نشد");
        return false;
      }
    },
    [toast]
  );

  const refreshStakes = useCallback(() => {
    const items = readStakes();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (JSON.stringify(items) !== raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } catch {
      // حالت نمایشی در صورت عدم دسترسی به storage
    }

    setStakes(items);
  }, []);

  useEffect(() => {
    refreshStakes();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) refreshStakes();
    };

    const handleFocus = () => refreshStakes();

    const refreshTimer = window.setInterval(() => {
      refreshStakes();
      setClock(Date.now());
    }, 1000);

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshStakes]);

  function handleAmountChange(value: string) {
    const normalized = normalizeDigits(value).replace(/,/g, ".");
    if (normalized && !/^\d*\.?\d*$/.test(normalized)) return;
    setAmountInput(normalized);
  }

  function validateStake() {
    if (!amountInput.trim() || amount <= 0) {
      toast.error("مقدار طلا را به‌درستی وارد کنید");
      return false;
    }

    if (amount < 0.01) {
      toast.error("حداقل مقدار استیک ۰٫۰۱ گرم است");
      return false;
    }

    if (amount > availableGold + 0.00000001) {
      toast.error("موجودی طلای شما کافی نیست");
      return false;
    }

    if (!Number.isFinite(estimatedProfit) || !Number.isFinite(finalAmount)) {
      toast.error("محاسبه سود با خطا مواجه شد");
      return false;
    }

    return true;
  }

  function openConfirmation() {
    if (!validateStake()) return;
    setAcceptedTerms(false);
    setShowConfirm(true);
  }

  function confirmStake() {
    if (!acceptedTerms) {
      toast.error("ابتدا شرایط طرح را تأیید کنید");
      return;
    }

    if (!validateStake()) {
      setShowConfirm(false);
      return;
    }

    const now = new Date();
    const endDate = addMonths(now, selectedPlan.months);

    const newStake: Stake = {
      id: createId(),
      amount,
      planId: selectedPlan.id,
      planLabel: selectedPlan.label,
      months: selectedPlan.months,
      rate: selectedPlan.rate,
      profit: estimatedProfit,
      finalAmount,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: now.toISOString(),
      status: "active",
    };

    if (!persistStakes([newStake, ...stakes])) return;

    setShowConfirm(false);
    setAmountInput("");
    setActiveTab("active");
    toast.success("طرح استیک با موفقیت ثبت شد");
  }

  function setQuickAmount(value: number) {
    if (value <= 0 || value > availableGold) return;
    setAmountInput(String(Number(value.toFixed(4))));
  }

  function requestCancellation() {
    if (!cancelStake || cancelStake.status !== "active") return;

    const now = new Date();
    const plan = getPlan(cancelStake.planId);
    const releaseAt = addBusinessDays(now, plan.releaseDays);

    const updated = stakes.map((item) =>
      item.id === cancelStake.id
        ? {
            ...item,
            status: "pending_release" as const,
            cancellationRequestedAt: now.toISOString(),
            releaseAt: releaseAt.toISOString(),
            profit: 0,
            finalAmount: item.amount,
          }
        : item
    );

    if (!persistStakes(updated)) return;

    setCancelStake(null);
    setDetailStake(null);
    toast.success("درخواست لغو ثبت شد؛ اصل طلا پس از تسویه آزاد می‌شود");
  }

  function renderStakeCard(stake: Stake, showProgress = false) {
    const progress = getProgress(stake);
    const remainingDays = getRemainingDays(stake.endDate);

    return (
      <div
        key={stake.id}
        className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2.5 sm:p-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-black">
                طرح {stake.planLabel}
              </span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-[var(--gold)]/25 bg-[var(--gold)]/10 text-[var(--gold)]">
                سود {stake.rate.toLocaleString("fa-IR")}٪
              </span>
            </div>
            <div className="text-[8px] text-[var(--muted)] mt-1">
              کد پیگیری: {stake.id.slice(0, 12)}
            </div>
          </div>

          <span className={`text-[8px] px-2 py-1 rounded-full border shrink-0 ${getStatusClass(stake.status)}`}>
            {getStatusLabel(stake.status)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          <SmallValue label="مقدار اولیه" value={`${formatGold(stake.amount)} گرم`} />
          <SmallValue
            label={stake.status === "active" ? "سود تخمینی" : "سود"}
            value={`${formatGold(stake.profit)} گرم`}
            green={stake.status === "active" || stake.status === "completed"}
          />
          <SmallValue
            label="مبلغ نهایی"
            value={`${formatGold(stake.finalAmount)} گرم`}
          />
        </div>

        {showProgress && stake.status === "active" && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[8px] text-[var(--muted)] mb-1">
              <span>پیشرفت دوره</span>
              <span>{formatGold(progress, 1)}٪</span>
            </div>
            <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--gold)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {stake.status === "pending_release" && (
          <div className="mt-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
            <div className="text-[8px] text-amber-400 font-bold">
              اصل طلا در انتظار تسویه است
            </div>
            <div className="text-[9px] font-bold mt-1" dir="rtl">
              {getCountdown(stake.releaseAt)}
            </div>
            <div className="text-[8px] text-[var(--muted)] mt-1">
              زمان تقریبی آزادسازی: {formatDateTime(stake.releaseAt)}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[var(--border)]">
          <div className="text-[8px] text-[var(--muted)] leading-4">
            <div>شروع: {formatDate(stake.startDate)}</div>
            <div>
              {stake.status === "pending_release"
                ? `درخواست لغو: ${formatDate(stake.cancellationRequestedAt)}`
                : `سررسید: ${formatDate(stake.endDate)}`}
            </div>
          </div>

          <div className="text-left shrink-0">
            {stake.status === "active" && (
              <div className="text-[8px] text-[var(--gold)] font-bold">
                {remainingDays.toLocaleString("fa-IR")} روز باقی‌مانده
              </div>
            )}
            {stake.status === "pending_release" && (
              <div className="text-[8px] text-amber-400 font-bold">
                در حال آزادسازی
              </div>
            )}
            {stake.status === "completed" && (
              <div className="text-[8px] text-[var(--green)] font-bold">
                دوره تکمیل شده
              </div>
            )}
            {stake.status === "cancelled" && (
              <div className="text-[8px] text-[var(--muted)] font-bold">
                اصل طلا بازگشته
              </div>
            )}

            <button
              type="button"
              onClick={() => setDetailStake(stake)}
              className="text-[9px] text-[var(--muted)] hover:text-[var(--gold)] mt-1"
            >
              مشاهده جزئیات ←
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto px-3 py-10 text-center text-xs text-[var(--muted)]" dir="rtl">
        در حال بارگذاری اطلاعات استیک...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-3.5" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 grid place-items-center text-lg shrink-0">
            🪙
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black">استیک طلا</h1>
            <p className="text-[9px] text-[var(--muted)] mt-0.5">
              سرمایه‌گذاری و مدیریت طرح‌های طلایی
            </p>
          </div>
        </div>

        <Link href="/profile" className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[9px] font-bold flex items-center shrink-0">
          بازگشت به پروفایل
        </Link>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-xs font-black">خلاصه دارایی استیک</h2>
            <p className="text-[8px] text-[var(--muted)] mt-0.5">
              موجودی و سرمایه‌گذاری شما
            </p>
          </div>
          <span className="text-[8px] text-[var(--muted)]">گرم طلا</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <SummaryCard label="موجودی قابل استفاده" value={formatGold(availableGold)} unit="گرم" color="gold" />
          <SummaryCard label="طلای قفل‌شده" value={formatGold(totalStaked)} unit="گرم" />
          <SummaryCard label="سود تخمینی فعال" value={formatGold(totalActiveProfit)} unit="گرم" color="green" />
          <SummaryCard label="سود تکمیل‌شده" value={formatGold(totalCompletedProfit)} unit="گرم" color="green" />
        </div>

        {pendingStakes.length > 0 && (
          <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[8px] text-amber-400">
            {pendingStakes.length.toLocaleString("fa-IR")} طرح در انتظار تسویه است؛ اصل طلا هنوز در موجودی قابل استفاده نیست.
          </div>
        )}
      </section>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1 grid grid-cols-3 gap-1">
        <TabButton active={activeTab === "new"} onClick={() => setActiveTab("new")}>
          استیک جدید
        </TabButton>
        <TabButton active={activeTab === "active"} onClick={() => setActiveTab("active")} count={activeStakes.length + pendingStakes.length}>
          طرح‌های من
        </TabButton>
        <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} count={completedStakes.length}>
          تاریخچه
        </TabButton>
      </div>

      {activeTab === "new" && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-3">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
            <div className="p-3 border-b border-[var(--border)]">
              <h2 className="text-xs font-black">انتخاب طرح استیک</h2>
              <p className="text-[8px] text-[var(--muted)] mt-1">
                یکی از دوره‌های سرمایه‌گذاری را انتخاب کنید.
              </p>
            </div>

            <div className="p-2.5 sm:p-3 space-y-1.5">
              {PLANS.map((plan) => {
                const selected = selectedPlanId === plan.id;

                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`w-full text-right rounded-xl border p-2.5 transition ${
                      selected
                        ? "border-[var(--gold)] bg-[var(--gold)]/[0.06]"
                        : "border-[var(--border)] bg-[var(--panel-2)] hover:border-[var(--gold)]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-3.5 h-3.5 rounded-full border grid place-items-center shrink-0 ${selected ? "border-[var(--gold)]" : "border-[var(--muted)]"}`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-[var(--gold)]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-black">طرح {plan.label}</div>
                          <div className="text-[8px] text-[var(--muted)] mt-0.5">{plan.description}</div>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="text-sm font-black text-[var(--green)]">
                          {plan.rate.toLocaleString("fa-IR")}٪
                        </div>
                        <div className="text-[7px] text-[var(--muted)]">سود کل دوره</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[8px] text-[var(--muted)] mt-2 pt-1.5 border-t border-[var(--border)]">
                      <span>مدت سپرده‌گذاری</span>
                      <span>{plan.months.toLocaleString("fa-IR")} ماه</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-2.5 sm:px-3 pb-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label htmlFor="staking-amount" className="text-[9px] font-bold">
                    مقدار طلای موردنظر
                  </label>
                  <span className="text-[8px] text-[var(--muted)]">
                    موجودی: {formatGold(availableGold)} گرم
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="staking-amount"
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="مثلاً ۲٫۵"
                    className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 pl-10 text-xs font-black outline-none focus:border-[var(--gold)]"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-[var(--muted)]">
                    گرم
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {[0.1, 0.5, 1, 2, availableGold].map((value, index) => {
                    const valid = value > 0 && value <= availableGold;
                    return (
                      <button
                        type="button"
                        key={`${value}-${index}`}
                        disabled={!valid}
                        onClick={() => setQuickAmount(value)}
                        className="h-6 px-2 rounded-md border border-[var(--border)] text-[8px] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-30"
                      >
                        {index === 4 ? "تمام موجودی" : `${formatGold(value)} گرم`}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[8px] text-[var(--muted)] mt-1.5">
                  حداقل مقدار قابل استیک: ۰٫۰۱ گرم
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 h-fit">
            <h2 className="text-xs font-black">محاسبه سود طرح</h2>
            <p className="text-[8px] text-[var(--muted)] mt-1">
              برآورد بازده در پایان دوره انتخابی
            </p>

            <div className="mt-3 space-y-2.5">
              <CalculationRow label="طرح انتخابی" value={selectedPlan.label} />
              <CalculationRow label="مدت دوره" value={`${selectedPlan.months.toLocaleString("fa-IR")} ماه`} />
              <CalculationRow label="نرخ سود کل دوره" value={`${selectedPlan.rate.toLocaleString("fa-IR")}٪`} />
              <CalculationRow label="مقدار سرمایه" value={`${formatGold(amount)} گرم`} />
              <div className="border-t border-[var(--border)] pt-2.5">
                <CalculationRow label="سود تخمینی" value={`${formatGold(estimatedProfit)} گرم`} highlight />
                <div className="rounded-lg bg-[var(--gold)]/[0.07] border border-[var(--gold)]/20 p-2.5 mt-2">
                  <div className="text-[8px] text-[var(--muted)]">مجموع اصل سرمایه و سود</div>
                  <div className="text-base font-black text-[var(--gold)] mt-1">
                    {formatGold(finalAmount)}
                    <span className="text-[8px] mr-1">گرم طلا</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={openConfirmation}
                disabled={availableGold < 0.01}
                className="w-full h-10 rounded-lg bg-[var(--gold)] text-black text-[10px] font-black disabled:opacity-40"
              >
                ادامه و تأیید استیک
              </button>

              <p className="text-[8px] text-[var(--muted)] leading-5">
                نرخ‌ها سود کل دوره هستند، نه نرخ سالانه. تمام مبالغ آزمایشی‌اند.
              </p>
            </div>
          </section>
        </div>
      )}

      {activeTab === "active" && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
          <div className="p-3 border-b border-[var(--border)] flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-black">طرح‌های من</h2>
              <p className="text-[8px] text-[var(--muted)] mt-1">
                طرح‌های فعال و درخواست‌های در حال تسویه
              </p>
            </div>
            <span className="text-[9px] font-black text-[var(--gold)]">
              {(activeStakes.length + pendingStakes.length).toLocaleString("fa-IR")} طرح
            </span>
          </div>

          <div className="p-2.5 sm:p-3 space-y-2">
            {lockedStakes.length === 0 ? (
              <EmptyState
                icon="🪙"
                title="طرح فعالی ندارید"
                description="پس از ثبت یک طرح استیک، اطلاعات آن در این بخش نمایش داده می‌شود."
                action="شروع استیک"
                onClick={() => setActiveTab("new")}
              />
            ) : (
              lockedStakes.map((stake) => renderStakeCard(stake, true))
            )}
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
          <div className="p-3 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-black">تاریخچه استیک</h2>
              <p className="text-[8px] text-[var(--muted)] mt-1">
                طرح‌های تکمیل‌شده و لغوشده
              </p>
            </div>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="جستجوی طرح یا کد پیگیری..."
              className="h-8 w-full sm:w-56 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 text-[9px] outline-none focus:border-[var(--gold)]"
            />
          </div>

          <div className="p-2.5 sm:p-3 space-y-2">
            {filteredHistory.length === 0 ? (
              <EmptyState
                icon="📋"
                title={completedStakes.length === 0 ? "هنوز سابقه‌ای ندارید" : "نتیجه‌ای پیدا نشد"}
                description="سوابق طرح‌های تکمیل‌شده و لغوشده در این بخش نمایش داده می‌شوند."
                action="مشاهده طرح‌های من"
                onClick={() => setActiveTab("active")}
              />
            ) : (
              filteredHistory.map((stake) => renderStakeCard(stake))
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-3 border-b border-[var(--border)]">
          <h2 className="text-xs font-black">قوانین و شرایط استیک</h2>
        </div>
        <div className="p-3 space-y-2 text-[8px] leading-5 text-[var(--muted)]">
          <RuleItem>نرخ سود هر طرح، سود کل همان دوره است و سالانه محاسبه نمی‌شود.</RuleItem>
          <RuleItem>در صورت لغو، سود طرح حذف می‌شود و فقط اصل طلای استیک‌شده بازمی‌گردد.</RuleItem>
          <RuleItem>پس از تأیید لغو، اصل طلا تا پایان دوره تسویه در وضعیت قفل‌شده باقی می‌ماند.</RuleItem>
          <RuleItem>مدت آزادسازی آزمایشی: سه‌ماهه ۲ روز کاری، شش‌ماهه ۳ روز کاری و یک‌ساله ۵ روز کاری.</RuleItem>
          <RuleItem>در این نمونه پنج‌شنبه و جمعه روز تعطیل فرض شده‌اند؛ تقویم نهایی باید با سیاست واقعی محصول هماهنگ شود.</RuleItem>
          <RuleItem>پس از پایان دوره عادی، اصل سرمایه به همراه سود تخمینی به موجودی نمایشی بازمی‌گردد.</RuleItem>
          <RuleItem>تمام مبالغ، موجودی و عملیات این صفحه آزمایشی هستند و به کیف پول واقعی متصل نیستند.</RuleItem>
        </div>
      </section>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[8px] leading-5 text-amber-300">
        <div className="font-black mb-1">نسخه آزمایشی استیک طلا</div>
        اطلاعات در حافظه محلی مرورگر ذخیره می‌شود. آزادسازی و تکمیل دوره به‌صورت نمایشی انجام می‌شود. در نسخه عملیاتی، تمام محاسبات و تغییر موجودی باید از طریق API امن و دفتر تراکنش سمت سرور انجام شود.
      </div>

      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)}>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 mx-auto grid place-items-center text-xl">🪙</div>
            <h2 className="text-sm font-black mt-2">تأیید نهایی استیک طلا</h2>
            <p className="text-[8px] text-[var(--muted)] mt-1">پیش از ثبت، مشخصات طرح را بررسی کنید.</p>
          </div>

          <div className="rounded-xl bg-[var(--panel-2)] border border-[var(--border)] p-3 mt-3 space-y-2.5">
            <CalculationRow label="طرح انتخابی" value={selectedPlan.label} />
            <CalculationRow label="مقدار سرمایه" value={`${formatGold(amount)} گرم`} />
            <CalculationRow label="مدت دوره" value={`${selectedPlan.months.toLocaleString("fa-IR")} ماه`} />
            <CalculationRow label="نرخ سود کل دوره" value={`${selectedPlan.rate.toLocaleString("fa-IR")}٪`} />
            <CalculationRow label="سود تخمینی" value={`${formatGold(estimatedProfit)} گرم`} highlight />
            <div className="border-t border-[var(--border)] pt-2">
              <CalculationRow label="مجموع نهایی تخمینی" value={`${formatGold(finalAmount)} گرم`} highlight />
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5 mt-2 text-[8px] text-amber-300 leading-5">
            با ثبت طرح، مقدار انتخاب‌شده قفل می‌شود. امکان درخواست لغو وجود دارد؛ در صورت لغو، سود حذف شده و اصل طلا پس از دوره تسویه آزمایشی بازمی‌گردد.
          </div>

          <label className="flex items-start gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 accent-[var(--gold)]"
            />
            <span className="text-[8px] text-[var(--muted)] leading-5">
              شرایط طرح، مدت قفل بودن سرمایه و آزمایشی بودن محاسبات را مطالعه کرده‌ام و تأیید می‌کنم.
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button type="button" onClick={() => setShowConfirm(false)} className="h-9 rounded-lg border border-[var(--border)] text-[9px] font-bold">
              انصراف
            </button>
            <button type="button" onClick={confirmStake} disabled={!acceptedTerms} className="h-9 rounded-lg bg-[var(--gold)] text-black text-[9px] font-black disabled:opacity-40">
              تأیید و ثبت طرح
            </button>
          </div>
        </Modal>
      )}

      {cancelStake && (
        <Modal onClose={() => setCancelStake(null)}>
          <div className="text-center">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 mx-auto grid place-items-center text-xl">
              ⚠️
            </div>
            <h2 className="text-sm font-black mt-3">تأیید لغو استیک</h2>
            <p className="text-[8px] text-[var(--muted)] mt-1">
              لطفاً قبل از ادامه، شرایط لغو را با دقت بخوانید.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <DetailBox label="طرح" value={cancelStake.planLabel} />
            <DetailBox label="اصل طلای قفل‌شده" value={`${formatGold(cancelStake.amount)} گرم`} />
            <DetailBox label="سود حذف‌شونده" value={`${formatGold(cancelStake.profit)} گرم`} />
            <DetailBox label="مهلت آزادسازی" value={`${getPlan(cancelStake.planId).releaseDays.toLocaleString("fa-IR")} روز کاری`} />
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 mt-3 text-[9px] leading-6">
            <div className="font-black text-red-400 mb-1">در صورت انصراف از این طرح:</div>
            <ul className="list-disc pr-4 space-y-1 text-[var(--text)]">
              <li>تمام سودهای تعلق‌نگرفته حذف می‌شوند.</li>
              <li>اصل طلای استیک‌شده محفوظ می‌ماند.</li>
              <li>طلا بلافاصله آزاد نمی‌شود و پس از پایان دوره تسویه به موجودی کیف پول بازمی‌گردد.</li>
              <li>پس از تأیید لغو، امکان بازگرداندن درخواست وجود ندارد.</li>
            </ul>
          </div>

          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5 mt-2 text-[8px] text-amber-300 leading-5">
            زمان آزادسازی بر اساس تنظیم آزمایشی این طرح محاسبه می‌شود. در نسخه واقعی، زمان دقیق تسویه باید در قوانین مالی پلتفرم تعیین شود.
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => setCancelStake(null)}
              className="h-9 rounded-lg border border-[var(--border)] text-[9px] font-bold"
            >
              انصراف و بازگشت
            </button>
            <button
              type="button"
              onClick={requestCancellation}
              className="h-9 rounded-lg bg-red-500 text-white text-[9px] font-black"
            >
              تأیید درخواست لغو
            </button>
          </div>
        </Modal>
      )}

      {detailStake && (
        <Modal onClose={() => setDetailStake(null)}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black">جزئیات طرح استیک</h2>
              <p className="text-[8px] text-[var(--muted)] mt-1">اطلاعات کامل سرمایه‌گذاری</p>
            </div>
            <span className={`text-[8px] px-2 py-1 rounded-full border ${getStatusClass(detailStake.status)}`}>
              {getStatusLabel(detailStake.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <DetailBox label="طرح" value={detailStake.planLabel} />
            <DetailBox label="مدت" value={`${detailStake.months.toLocaleString("fa-IR")} ماه`} />
            <DetailBox label="مقدار سرمایه" value={`${formatGold(detailStake.amount)} گرم`} />
            <DetailBox label="نرخ سود" value={`${detailStake.rate.toLocaleString("fa-IR")}٪`} />
            <DetailBox label="سود" value={`${formatGold(detailStake.profit)} گرم`} green />
            <DetailBox label="مبلغ نهایی" value={`${formatGold(detailStake.finalAmount)} گرم`} />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-3 mt-3 space-y-2">
            <CalculationRow label="تاریخ شروع" value={formatDateTime(detailStake.startDate)} />
            <CalculationRow label="تاریخ سررسید" value={formatDateTime(detailStake.endDate)} />
            <CalculationRow label="زمان ثبت" value={formatDateTime(detailStake.createdAt)} />

            {detailStake.cancellationRequestedAt && (
              <CalculationRow label="زمان درخواست لغو" value={formatDateTime(detailStake.cancellationRequestedAt)} />
            )}
            {detailStake.releaseAt && (
              <CalculationRow label="زمان آزادسازی برنامه‌ریزی‌شده" value={formatDateTime(detailStake.releaseAt)} />
            )}
            {detailStake.cancelledAt && (
              <CalculationRow label="زمان بازگشت اصل طلا" value={formatDateTime(detailStake.cancelledAt)} />
            )}
            {detailStake.completedAt && (
              <CalculationRow label="زمان تکمیل" value={formatDateTime(detailStake.completedAt)} />
            )}

            <div className="border-t border-[var(--border)] pt-2">
              <div className="text-[8px] text-[var(--muted)]">شناسه پیگیری</div>
              <div className="text-[9px] font-mono mt-1 break-all" dir="ltr">{detailStake.id}</div>
            </div>
          </div>

          {detailStake.status === "active" && (
            <>
              <div className="mt-3 rounded-xl bg-[var(--gold)]/[0.06] border border-[var(--gold)]/20 p-3">
                <div className="flex justify-between text-[8px] mb-2">
                  <span className="text-[var(--muted)]">پیشرفت دوره</span>
                  <span className="font-bold text-[var(--gold)]">{formatGold(getProgress(detailStake), 1)}٪</span>
                </div>
                <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className="h-full bg-[var(--gold)] rounded-full" style={{ width: `${getProgress(detailStake)}%` }} />
                </div>
                <div className="text-[8px] text-[var(--muted)] mt-2">
                  {getRemainingDays(detailStake.endDate).toLocaleString("fa-IR")} روز تا پایان دوره باقی مانده است.
                </div>
              </div>

              <button
  type="button"
  onClick={() => {
    const selectedStake = detailStake;
    setDetailStake(null);
    setCancelStake(selectedStake);
  }}
  className="w-full h-9 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-[9px] font-black mt-3"
>
  لغو استیک
</button>
            </>
          )}

          {detailStake.status === "pending_release" && (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="text-[9px] font-black text-amber-400">در انتظار تسویه و آزادسازی</div>
              <div className="text-[9px] font-bold mt-2">{getCountdown(detailStake.releaseAt)}</div>
              <p className="text-[8px] text-[var(--muted)] mt-2 leading-5">
                اصل طلای شما محفوظ است و پس از پایان زمان آزادسازی به موجودی قابل استفاده اضافه می‌شود. سود این طرح در اثر لغو حذف شده است.
              </p>
            </div>
          )}

          {detailStake.status === "cancelled" && (
            <div className="mt-3 rounded-lg bg-[var(--panel-2)] p-2.5 text-[8px] text-[var(--muted)]">
              درخواست لغو تکمیل شده و اصل طلا به موجودی آزمایشی بازگشته است.
            </div>
          )}

          <button
            type="button"
            onClick={() => setDetailStake(null)}
            className="w-full h-9 rounded-lg border border-[var(--border)] text-[9px] font-bold mt-3"
          >
            بستن جزئیات
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Components ------------------------------ */

function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color?: "gold" | "green";
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2 sm:p-2.5 min-w-0">
      <div className="text-[8px] text-[var(--muted)] leading-4">{label}</div>
      <div className={`text-xs sm:text-sm font-black mt-1 truncate ${
        color === "green"
          ? "text-[var(--green)]"
          : color === "gold"
            ? "text-[var(--gold)]"
            : "text-[var(--text)]"
      }`}>
        {value}
      </div>
      <div className="text-[7px] text-[var(--muted)] mt-0.5">{unit}</div>
    </div>
  );
}

function SmallValue({
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
      <div className="text-[7px] sm:text-[8px] text-[var(--muted)]">{label}</div>
      <div className={`text-[9px] sm:text-[10px] font-black mt-1 truncate ${green ? "text-[var(--green)]" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-lg flex items-center justify-center gap-1 text-[8px] sm:text-[9px] font-bold transition ${
        active
          ? "bg-[var(--gold)] text-black"
          : "text-[var(--muted)] hover:bg-[var(--panel-2)]"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-[7px] min-w-4 h-4 px-1 rounded-full grid place-items-center ${active ? "bg-black/10" : "bg-[var(--panel-2)]"}`}>
          {count.toLocaleString("fa-IR")}
        </span>
      )}
    </button>
  );
}

function CalculationRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[8px] text-[var(--muted)]">{label}</span>
      <span className={`text-[8px] font-bold text-left ${highlight ? "text-[var(--green)]" : "text-[var(--text)]"}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-[10px] font-black">{title}</div>
      <p className="text-[8px] text-[var(--muted)] leading-5 mt-1 max-w-sm mx-auto">{description}</p>
      <button type="button" onClick={onClick} className="h-8 px-4 rounded-lg bg-[var(--gold)] text-black text-[8px] font-black mt-3">
        {action}
      </button>
    </div>
  );
}

function RuleItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[var(--gold)] mt-0.5">•</span>
      <span>{children}</span>
    </div>
  );
}

function DetailBox({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2 min-w-0">
      <div className="text-[7px] text-[var(--muted)]">{label}</div>
      <div className={`text-[9px] font-black mt-1 break-words ${green ? "text-[var(--green)]" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-center justify-center p-2.5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
