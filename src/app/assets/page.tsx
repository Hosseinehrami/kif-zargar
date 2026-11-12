"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const format = (n: number) => Math.round(n).toLocaleString("fa-IR");
const toFa = (s: string) =>
  s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/\./g, "٫");
const toFaInt = (s: string) =>
  s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

// ---------- Icons ----------
function EyeIcon({ closed }: { closed: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {closed && <line x1="4" y1="4" x2="20" y2="20" />}
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className="text-[var(--muted)] shrink-0"
      aria-hidden="true">
      <polyline points="15 6 9 12 15 18" />
    </svg>
  );
}
function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-[var(--muted)] transition-transform duration-300 ${
        open ? "rotate-180" : ""
      }`} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

// ---------- Types ----------
type AssetKind = "gold" | "coin" | "currency" | "cash";
type TxType = "buy" | "sell" | "deposit" | "withdraw" | "transfer";
type Tx = {
  id: string;
  type: TxType;
  label: string;
  date: string;
  amount: string;
  positive: boolean;
  ts: number;
};
type TxWithAsset = Tx & { assetName: string };

type Asset = {
  id: string;
  name: string;
  icon: string;
  amount: number;
  unit: string;
  pricePerUnit: number;
  change: number;
  kind: AssetKind;
  todayProfit: number;
  totalProfit: number;
  locked: number;
  lockedReason?: string;
  transactions: Tx[];
};

const txStyle = (type: TxType) =>
  ({
    buy: { icon: "↙", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    sell: { icon: "↗", color: "text-red-400", bg: "bg-red-500/10" },
    deposit: { icon: "↓", color: "text-sky-400", bg: "bg-sky-500/10" },
    withdraw: { icon: "↑", color: "text-amber-400", bg: "bg-amber-500/10" },
    transfer: { icon: "⇄", color: "text-violet-400", bg: "bg-violet-500/10" },
  }[type]);

async function shareTx(t: Tx & { assetName?: string }) {
  const lines = [
    "کیف زرگر — رسید تراکنش",
    `نوع: ${t.label}`,
    t.assetName ? `دارایی: ${t.assetName}` : "",
    `مقدار: ${t.amount}`,
    `زمان: ${t.date}`,
    "kifzargar.com",
  ].filter(Boolean);
  const text = lines.join("\n");
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: "رسید تراکنش کیف زرگر", text });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    /* noop */
  }
}

// ---------- فرمت مقدار بر اساس واحد ----------
function fmtQty(asset: Asset, n: number): string {
  if (asset.unit === "گرم") return toFa(n.toFixed(3)); // ۱۲.۴۵۰
  if (asset.unit === "عدد" || asset.unit === "دلار" || asset.unit === "تتر")
    return toFa(String(Math.round(n))); // ۲
  return format(n); // تومان
}

// ---------- Data (همه ۷ نماد + ریال) ----------
const initialAssets: Asset[] = [
  {
    id: "gold18", name: "طلای ۱۸ عیار", icon: "◈", amount: 12.45,
    unit: "گرم", pricePerUnit: 19_080_000, change: 1.25, kind: "gold",
    todayProfit: 1_250_000, totalProfit: 7_500_000,
    locked: 0.5, lockedReason: "سفارش فروش در انتظار",
    transactions: [
      { id: "g18-1", type: "buy", label: "خرید طلا", date: "امروز · ۱۲:۴۰", amount: "+۲.۵۰۰ گرم", positive: true, ts: 1 },
      { id: "g18-2", type: "sell", label: "فروش طلا", date: "دیروز · ۱۶:۲۰", amount: "−۱.۰۰۰ گرم", positive: false, ts: 2 },
      { id: "g18-3", type: "deposit", label: "واریز طلا", date: "۳ روز پیش · ۱۰:۱۵", amount: "+۵.۰۰۰ گرم", positive: true, ts: 4 },
      { id: "g18-4", type: "transfer", label: "انتقال به کیف دیگر", date: "۴ روز پیش · ۱۹:۰۰", amount: "−۰.۵۰۰ گرم", positive: false, ts: 5 },
    ],
  },
  {
    id: "coin-emami", name: "سکه امامی", icon: "◉", amount: 2,
    unit: "عدد", pricePerUnit: 185_000_000, change: 1.10, kind: "coin",
    todayProfit: 700_000, totalProfit: 3_300_000, locked: 0,
    transactions: [
      { id: "c-1", type: "buy", label: "خرید سکه", date: "۶ روز پیش · ۱۴:۲۰", amount: "+۱ عدد", positive: true, ts: 7 },
      { id: "c-2", type: "transfer", label: "دریافت از کیف دیگر", date: "۱۰ روز پیش · ۱۱:۰۰", amount: "+۱ عدد", positive: true, ts: 9 },
    ],
  },
  {
    id: "coin-bahar", name: "بهار آزادی", icon: "◎", amount: 1,
    unit: "عدد", pricePerUnit: 175_000_000, change: 0.95, kind: "coin",
    todayProfit: 500_000, totalProfit: 2_000_000, locked: 0,
    transactions: [
      { id: "cb-1", type: "buy", label: "خرید بهار آزادی", date: "۱ ماه پیش · ۱۰:۰۰", amount: "+۱ عدد", positive: true, ts: 12 },
    ],
  },
  {
    id: "coin-half", name: "نیم سکه ۸۶", icon: "◍", amount: 3,
    unit: "عدد", pricePerUnit: 95_000_000, change: 0.70, kind: "coin",
    todayProfit: 400_000, totalProfit: 1_500_000, locked: 0,
    transactions: [
      { id: "ch-1", type: "buy", label: "خرید نیم سکه", date: "۲ هفته پیش · ۱۳:۲۰", amount: "+۳ عدد", positive: true, ts: 10 },
    ],
  },
  {
    id: "coin-quarter", name: "ربع سکه ۸۶", icon: "◌", amount: 5,
    unit: "عدد", pricePerUnit: 52_000_000, change: 0.50, kind: "coin",
    todayProfit: 300_000, totalProfit: 1_000_000, locked: 0,
    transactions: [
      { id: "cq-1", type: "buy", label: "خرید ربع سکه", date: "۳ روز پیش · ۰۹:۴۰", amount: "+۵ عدد", positive: true, ts: 3 },
    ],
  },
  {
    id: "usd", name: "دلار", icon: "$", amount: 500,
    unit: "دلار", pricePerUnit: 62_000, change: -0.15, kind: "currency",
    todayProfit: 50_000, totalProfit: 200_000, locked: 0,
    transactions: [
      { id: "usd-1", type: "deposit", label: "واریز دلار", date: "۱۰ روز پیش · ۱۴:۰۰", amount: "+۵۰۰ دلار", positive: true, ts: 11 },
    ],
  },
  {
    id: "usdt", name: "USDT", icon: "₮", amount: 1200,
    unit: "تتر", pricePerUnit: 61_500, change: 0.10, kind: "currency",
    todayProfit: 100_000, totalProfit: 400_000, locked: 0,
    transactions: [
      { id: "usdt-1", type: "deposit", label: "واریز USDT", date: "۷ روز پیش · ۱۸:۱۰", amount: "+۱۲۰۰ تتر", positive: true, ts: 8 },
    ],
  },
  {
    id: "cash", name: "موجودی ریالی", icon: "﷼", amount: 245_000_000,
    unit: "تومان", pricePerUnit: 1, change: 0, kind: "cash",
    todayProfit: 0, totalProfit: 0,
    locked: 15_000_000, lockedReason: "سفارش خرید در انتظار",
    transactions: [
      { id: "cash-1", type: "deposit", label: "واریز ریالی", date: "۲ روز پیش · ۱۰:۰۰", amount: "+۲۰,۰۰۰,۰۰۰ تومان", positive: true, ts: 3 },
      { id: "cash-2", type: "buy", label: "خرید طلا (از کیف ریالی)", date: "دیروز · ۱۶:۲۰", amount: "−۱۹,۰۸۰,۰۰۰ تومان", positive: false, ts: 2 },
      { id: "cash-3", type: "withdraw", label: "برداشت به بانک", date: "۳ روز پیش · ۱۳:۰۰", amount: "−۵,۰۰۰,۰۰۰ تومان", positive: false, ts: 4 },
    ],
  },
];

// ---------- Chart helpers ----------
function buildChart(base: number, profit: number, seed: number) {
  const N = 24;
  const first = Math.max(base * 0.5, base - profit);
  const amp = base * 0.005;
  const pts: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const trend = first + (base - first) * t;
    const wave =
      (Math.sin(seed * 2.1 + i * 0.55) +
        Math.cos(seed * 1.3 + i * 0.31) * 0.6) * amp;
    pts.push(trend + wave * Math.sin(t * Math.PI));
  }
  pts[N - 1] = base;
  return pts;
}

function LineChart({
  pts, width = 520, height = 160,
  className = "w-full h-32", ariaLabel,
}: {
  pts: number[]; width?: number; height?: number;
  className?: string; ariaLabel: string;
}) {
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const pad = 12;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${height - pad} L${x(0).toFixed(1)},${height - pad} Z`;
  const profit = pts[pts.length - 1] - pts[0];
  const positive = profit >= 0;
  const stroke = positive ? "#239B72" : "#DC5959";
  const fill = positive ? "rgba(35,155,114,0.10)" : "rgba(220,89,89,0.10)";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className}
      preserveAspectRatio="none" aria-label={ariaLabel}>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={pad} y1={pad + (height - pad * 2) * t}
          x2={width - pad} y2={pad + (height - pad * 2) * t}
          stroke="var(--border)" strokeWidth="0.7" strokeDasharray="3 5"
          vectorEffect="non-scaling-stroke" />
      ))}
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2"
        strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r="3" fill={stroke} />
    </svg>
  );
}

function AssetChart({ asset }: { asset: Asset }) {
  const base = asset.amount * asset.pricePerUnit;
  const seed = asset.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) / 100;
  const pts = buildChart(base, asset.totalProfit, seed);
  const profit = pts[pts.length - 1] - pts[0];
  const profitPct = pts[0] > 0 ? (profit / pts[0]) * 100 : 0;
  const positive = profit >= 0;
  return (
    <div>
      <div className="flex items-end justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className="text-[10px] text-[var(--muted)]">ارزش فعلی</div>
          <div className="text-base font-bold">
            {format(base)} <span className="text-[10px] text-[var(--muted)]">تومان</span>
          </div>
        </div>
        <div className={`text-xs font-bold ${positive ? "positive" : "negative"}`}>
          {positive ? "+" : ""}{format(profit)}{" "}
          <span className="text-[10px]">({positive ? "+" : ""}{toFa(profitPct.toFixed(2))}٪)</span>
        </div>
      </div>
      <LineChart pts={pts} className="w-full h-32"
        ariaLabel={`نمودار ارزش ${asset.name} در ۳۰ روز گذشته`} />
      <div className="flex justify-between text-[9px] text-[var(--muted)] mt-1">
        <span>۳۰ روز پیش</span><span>امروز</span>
      </div>
    </div>
  );
}

function PortfolioChart({
  totalValue, totalProfit, hideBalance,
}: { totalValue: number; totalProfit: number; hideBalance: boolean }) {
  const pts = buildChart(totalValue, totalProfit, 3.14);
  const profit = pts[pts.length - 1] - pts[0];
  const profitPct = pts[0] > 0 ? (profit / pts[0]) * 100 : 0;
  const positive = profit >= 0;
  return (
    <div>
      <div className="flex items-end justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className="text-[10px] text-[var(--muted)]">ارزش کل</div>
          <div className="text-lg font-bold">
            {hideBalance ? "••••" : format(totalValue)}{" "}
            <span className="text-[10px] text-[var(--muted)]">تومان</span>
          </div>
        </div>
        <div className={`text-xs font-bold ${positive ? "positive" : "negative"}`}>
          {positive ? "+" : ""}{hideBalance ? "••••" : format(profit)}{" "}
          <span className="text-[10px]">({positive ? "+" : ""}{toFa(profitPct.toFixed(2))}٪)</span>
        </div>
      </div>
      <LineChart pts={pts} width={800} height={200}
        className="w-full h-40" ariaLabel="نمودار کلی ارزش پرتفو در ۳۰ روز گذشته" />
      <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1.5">
        <span>۳۰ روز پیش</span><span>۱۵ روز پیش</span><span>امروز</span>
      </div>
    </div>
  );
}

// ---------- Shared TxRow ----------
function TxRow({
  t, showShare, showAssetName,
}: {
  t: Tx & { assetName?: string };
  showShare: boolean;
  showAssetName: boolean;
}) {
  const s = txStyle(t.type);
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className={`w-8 h-8 rounded-lg grid place-items-center text-sm shrink-0 ${s.bg} ${s.color}`}>
        {s.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate">{t.label}</div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5">
          {showAssetName && t.assetName ? `${t.assetName} · ` : ""}
          {t.date}
        </div>
      </div>
      <span className={`text-xs font-bold shrink-0 ${t.positive ? "positive" : "negative"}`}>
        {t.amount}
      </span>
      {showShare && t.type === "transfer" && (
        <button
          type="button"
          onClick={() => shareTx(t)}
          className="w-8 h-8 rounded-lg grid place-items-center text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--panel-2)] transition shrink-0"
          aria-label="اشتراک‌گذاری"
          title="اشتراک‌گذاری"
        >
          <ShareIcon />
        </button>
      )}
    </div>
  );
}

// ---------- Asset detail modal ----------
function AssetDetailModal({
  asset, onClose, onTrade,
}: { asset: Asset; onClose: () => void; onTrade: () => void }) {
  const [filter, setFilter] = useState<"all" | "trade" | "transfer" | "cash">("all");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const visible = asset.transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "trade") return t.type === "buy" || t.type === "sell";
    if (filter === "transfer") return t.type === "transfer";
    return t.type === "deposit" || t.type === "withdraw";
  });
  const value = asset.amount * asset.pricePerUnit;
  const isCash = asset.kind === "cash";
  const isPhysical = asset.kind === "gold" || asset.kind === "coin";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-6"
      onClick={onClose} role="dialog" aria-modal="true" aria-label={`جزئیات ${asset.name}`}>
      <div className="max-w-2xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 p-4 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-lg grid place-items-center text-lg shrink-0"
            style={!isCash
              ? { background: "rgba(196,168,117,0.12)", color: "var(--gold)" }
              : { background: "var(--panel-2)", color: "var(--muted)" }}>
            {asset.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-sm">{asset.name}</strong>
              {!isCash && (
                <span className={`text-[10px] font-bold ${asset.change >= 0 ? "positive" : "negative"}`}>
                  {asset.change >= 0 ? "+" : ""}{toFa(String(asset.change))}٪
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-0.5">
              {isCash
                ? `${format(asset.amount)} تومان`
                : `${fmtQty(asset, asset.amount)} ${asset.unit} · ${format(value)} تومان`}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] text-2xl leading-none -mt-1 shrink-0"
            aria-label="بستن">×</button>
        </div>

        <div className="p-4 border-b border-[var(--border)]">
          <div className="text-[11px] text-[var(--muted)] mb-2">چه کاری می‌خواهی انجام دهی؟</div>
          <div className="grid grid-cols-2 gap-2">
            {!isCash && (
              <>
                <button type="button" onClick={onTrade}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition p-2.5 text-right">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-emerald-400 text-base">⚡</span>
                    <strong className="text-xs">آنی</strong>
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">معامله فوری با قیمت لحظه‌ای</div>
                </button>
                <button type="button" disabled title="به‌زودی"
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2.5 text-right opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[var(--gold)] text-base">⇄</span>
                    <strong className="text-xs">بازار</strong>
                    <span className="text-[9px] text-[var(--muted)]">به‌زودی</span>
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">P2P با سایر کاربران</div>
                </button>
              </>
            )}
            {isPhysical && (
              <button type="button" disabled title="به‌زودی"
                className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2.5 text-right opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sky-400 text-base">▣</span>
                  <strong className="text-xs">برداشت فیزیکی</strong>
                  <span className="text-[9px] text-[var(--muted)]">به‌زودی</span>
                </div>
                <div className="text-[10px] text-[var(--muted)]">تحویل از شعبه</div>
              </button>
            )}
            {!isCash && (
              <button type="button" disabled title="به‌زودی"
                className={`rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2.5 text-right opacity-60 cursor-not-allowed ${
                  !isPhysical ? "col-span-2" : ""
                }`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-violet-400 text-base">⇄</span>
                  <strong className="text-xs">انتقال</strong>
                  <span className="text-[9px] text-[var(--muted)]">به‌زودی</span>
                </div>
                <div className="text-[10px] text-[var(--muted)]">به کیف زرگر دیگر</div>
              </button>
            )}
            {isCash && (
              <>
                <button type="button" disabled title="به‌زودی"
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2.5 text-right opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sky-400 text-base">↓</span>
                    <strong className="text-xs">واریز</strong>
                    <span className="text-[9px] text-[var(--muted)]">به‌زودی</span>
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">از حساب بانکی</div>
                </button>
                <button type="button" disabled title="به‌زودی"
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2.5 text-right opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-amber-400 text-base">↑</span>
                    <strong className="text-xs">برداشت</strong>
                    <span className="text-[9px] text-[var(--muted)]">به‌زودی</span>
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">به حساب بانکی</div>
                </button>
                <button type="button" disabled title="به‌زودی"
                  className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2.5 text-right opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-violet-400 text-base">⇄</span>
                    <strong className="text-xs">انتقال</strong>
                    <span className="text-[9px] text-[var(--muted)]">به‌زودی</span>
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">به کیف زرگر دیگر</div>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-[var(--border)]">
          <div className="text-[11px] text-[var(--muted)] mb-2">ارزش دارایی در ۳۰ روز گذشته</div>
          <AssetChart asset={asset} />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <strong className="text-xs">گزارش تراکنش‌ها</strong>
            <div className="flex gap-1 text-[10px] flex-wrap">
              {([
                { id: "all", label: "همه" },
                { id: "trade", label: "معاملات" },
                { id: "transfer", label: "انتقال" },
                { id: "cash", label: "واریز و برداشت" },
              ] as const).map((f) => (
                <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                  className={`px-2 py-0.5 rounded-md transition ${
                    filter === f.id
                      ? "bg-[var(--panel-2)] text-[var(--gold)]"
                      : "text-[var(--muted)] hover:bg-[var(--panel-2)]"
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <div className="text-center text-[11px] text-[var(--muted)] py-6">
              تراکنشی در این دسته ثبت نشده است.
            </div>
          ) : (
            <div>
              {visible.map((t, idx) => (
                <div key={t.id} className={idx > 0 ? "border-t border-[var(--border)]" : ""}>
                  <TxRow t={{ ...t, assetName: asset.name }} showShare showAssetName={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Report modal ----------
function ReportModal({
  transactions, onClose, onTrade,
}: {
  transactions: TxWithAsset[];
  onClose: () => void;
  onTrade: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "trade" | "transfer" | "cash">("all");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const visible = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "trade") return t.type === "buy" || t.type === "sell";
    if (filter === "transfer") return t.type === "transfer";
    return t.type === "deposit" || t.type === "withdraw";
  });

  const handleShareAll = async () => {
    const text = "گزارش تراکنش‌های کیف زرگر";
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "کیف زرگر", text });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      /* noop */
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-6"
      onClick={onClose} role="dialog" aria-modal="true" aria-label="گزارش تراکنش‌ها">
      <div className="max-w-2xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-bold">گزارش تراکنش‌ها</h2>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">
              {toFaInt(String(transactions.length))} تراکنش ثبت‌شده
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={handleShareAll}
              className="w-8 h-8 rounded-lg grid place-items-center text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--panel-2)] transition"
              aria-label="اشتراک‌گذاری" title="اشتراک‌گذاری">
              <ShareIcon />
            </button>
            <button type="button" onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--text)] text-2xl leading-none w-8 h-8 grid place-items-center"
              aria-label="بستن">×</button>
          </div>
        </div>

        <div className="p-4 border-b border-[var(--border)]">
          <div className="text-[11px] text-[var(--muted)] mb-2">عملیات سریع</div>
          <div className="grid grid-cols-5 gap-1.5">
            <button type="button" onClick={onTrade}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition p-2 text-center">
              <div className="text-emerald-400 text-sm mb-0.5">↙</div>
              <div className="text-[10px] font-bold">خرید</div>
            </button>
            <button type="button" onClick={onTrade}
              className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition p-2 text-center">
              <div className="text-red-400 text-sm mb-0.5">↗</div>
              <div className="text-[10px] font-bold">فروش</div>
            </button>
            <button type="button" disabled
              className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-2 text-center opacity-60 cursor-not-allowed">
              <div className="text-violet-400 text-sm mb-0.5">⇄</div>
              <div className="text-[10px] font-bold">انتقال</div>
            </button>
            <button type="button" disabled
              className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-center opacity-60 cursor-not-allowed">
              <div className="text-sky-400 text-sm mb-0.5">↓</div>
              <div className="text-[10px] font-bold">واریز</div>
            </button>
            <button type="button" disabled
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-center opacity-60 cursor-not-allowed">
              <div className="text-amber-400 text-sm mb-0.5">↑</div>
              <div className="text-[10px] font-bold">برداشت</div>
            </button>
          </div>
        </div>

        <div className="p-4 pb-2 border-b border-[var(--border)]">
          <div className="flex gap-1 text-[10px] flex-wrap">
            {([
              { id: "all", label: "همه" },
              { id: "trade", label: "معاملات" },
              { id: "transfer", label: "انتقال دارایی" },
              { id: "cash", label: "واریز و برداشت" },
            ] as const).map((f) => (
              <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                className={`px-2 py-0.5 rounded-md transition ${
                  filter === f.id
                    ? "bg-[var(--panel-2)] text-[var(--gold)]"
                    : "text-[var(--muted)] hover:bg-[var(--panel-2)]"
                }`}>{f.label}</button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {visible.length === 0 ? (
            <div className="text-center text-[11px] text-[var(--muted)] py-6">
              تراکنشی در این دسته ثبت نشده است.
            </div>
          ) : (
            <div>
              {visible.map((t, idx) => (
                <div key={t.id} className={idx > 0 ? "border-t border-[var(--border)]" : ""}>
                  <TxRow t={t} showShare showAssetName />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function AssetsPage() {
  const router = useRouter();
  const [assets] = useState(initialAssets);
  const [hideBalance, setHideBalance] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [chartOpen, setChartOpen] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const investValue = assets
    .filter((a) => a.kind !== "cash")
    .reduce((s, a) => s + a.amount * a.pricePerUnit, 0);
  const cashValue = assets
    .filter((a) => a.kind === "cash")
    .reduce((s, a) => s + a.amount * a.pricePerUnit, 0);
  const totalValue = investValue + cashValue;
  const totalTodayProfit = assets.reduce((s, a) => s + a.todayProfit, 0);
  const totalProfit = assets.reduce((s, a) => s + a.totalProfit, 0);
  const goldGrams = assets
    .filter((a) => a.kind === "gold" && a.unit === "گرم")
    .reduce((s, a) => s + a.amount, 0);
  const goldCoins = assets
    .filter((a) => a.kind === "coin")
    .reduce((s, a) => s + a.amount, 0);
  const investPct = totalValue > 0 ? (investValue / totalValue) * 100 : 0;
  const cashPct = 100 - investPct;
  const lockedItems = assets.filter((a) => a.locked > 0);

  const allTransactions: TxWithAsset[] = assets
    .flatMap((a) => a.transactions.map((t) => ({ ...t, assetName: a.name })))
    .sort((a, b) => a.ts - b.ts);

  const display = (n: number) => (hideBalance ? "••••••" : format(n));
  const profitPct = ((totalProfit / Math.max(totalValue - totalProfit, 1)) * 100).toFixed(1);

  return (
    <div className="px-2.5 sm:px-4 pt-2.5 sm:pt-3 pb-3">
      {/* Stat pills */}
      <section
        className="flex sm:flex-wrap gap-1.5 mb-2.5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="خلاصه دارایی">
        <div className="snap-start shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 whitespace-nowrap">
          <span className="text-[10px] text-[var(--muted)]">سود امروز</span>
          <span className="text-xs font-bold positive">
            {hideBalance ? "••••" : `+${format(totalTodayProfit)}`}
          </span>
          <span className="text-[10px] text-[var(--muted)]">تومان</span>
        </div>
        <div className="snap-start shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 whitespace-nowrap">
          <span className="text-[10px] text-[var(--muted)]">سود کلی</span>
          <span className="text-xs font-bold positive">
            {hideBalance ? "••••" : `+${format(totalProfit)}`}
          </span>
          <span className="text-[10px] text-[var(--muted)]">تومان</span>
        </div>
        <div className="snap-start shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 whitespace-nowrap">
          <span className="text-[10px] text-[var(--muted)]">وزن طلا</span>
          <span className="text-xs font-bold">
            {hideBalance ? "••••" : toFa(goldGrams.toFixed(3))}
          </span>
          <span className="text-[10px] text-[var(--muted)]">گرم</span>
          {goldCoins > 0 && (
            <span className="text-[10px] text-[var(--muted)]">
              +{toFaInt(String(goldCoins))} سکه
            </span>
          )}
        </div>
      </section>

      {/* Portfolio summary */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5 sm:p-4 mb-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] text-[var(--muted)]">ارزش کل دارایی‌ها</div>
            <div className="mt-1 text-xl sm:text-2xl font-bold tracking-wide">
              {display(totalValue)}
              <span className="text-[11px] font-normal text-[var(--muted)] mr-2">تومان</span>
            </div>
          </div>
          <button type="button" onClick={() => setHideBalance((v) => !v)}
            className="w-8 h-8 rounded-lg grid place-items-center text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--panel-2)] transition-colors -mt-0.5"
            aria-label={hideBalance ? "نمایش موجودی" : "مخفی‌کردن موجودی"}
            title={hideBalance ? "نمایش موجودی" : "مخفی‌کردن موجودی"}>
            <EyeIcon closed={hideBalance} />
          </button>
        </div>

        <div className="h-px bg-[var(--border)] my-2.5" />

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <div>
            <div className="text-[10px] text-[var(--muted)] mb-0.5">ارزش سرمایه</div>
            <div className="font-semibold text-[11px]">
              {display(investValue)}{" "}
              <span className="text-[10px] text-[var(--muted)]">تومان</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] mb-0.5">موجودی ریال</div>
            <div className="font-semibold text-[11px]">
              {display(cashValue)}{" "}
              <span className="text-[10px] text-[var(--muted)]">تومان</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--muted)] mb-0.5">سود کل</div>
            <div className="font-semibold positive text-[11px]">
              {hideBalance ? "••••" : `+${format(totalProfit)}`}{" "}
              <span className="text-[10px]">+{toFa(profitPct)}٪</span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden flex bg-[#7a8ba0]/30">
            <div className="h-full bg-[var(--gold)] transition-all duration-500"
              style={{ width: `${investPct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <i className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" /> سرمایه · {toFa(investPct.toFixed(1))}٪
            </span>
            <span className="flex items-center gap-1">
              <i className="w-1.5 h-1.5 rounded-full bg-[#7a8ba0]" /> ریال · {toFa(cashPct.toFixed(1))}٪
            </span>
          </div>
        </div>

        <div className="pointer-events-none select-none absolute text-[var(--gold)] opacity-[0.06] font-serif"
          style={{ left: 20, bottom: -18, fontSize: 80, lineHeight: 1 }}>
          Au
        </div>
      </section>

      {/* Assets list */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 sm:p-3.5 mb-2.5">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-xs sm:text-sm">ریز دارایی‌ها</h2>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">
              روی هر دارایی کلیک کن
            </p>
          </div>
          <button type="button" onClick={() => router.push("/trade")}
            className="text-[11px] rounded-lg border border-[var(--border)] px-2.5 py-1 text-[var(--gold)] hover:bg-[var(--panel-2)] transition-colors">
            + معامله جدید
          </button>
        </div>

        <div className="mt-1.5">
          {assets.map((a, idx) => {
            const value = a.amount * a.pricePerUnit;
            return (
              <div key={a.id} className={idx > 0 ? "border-t border-[var(--border)]" : ""}>
                <button type="button" onClick={() => setSelected(a)}
                  className="w-full flex items-center gap-2.5 py-2.5 hover:bg-[var(--panel-2)] transition-colors rounded-lg text-right px-1 -mx-1">
                  <div className="w-9 h-9 rounded-lg grid place-items-center text-base shrink-0"
                    style={a.kind !== "cash"
                      ? { background: "rgba(196,168,117,0.12)", color: "var(--gold)" }
                      : { background: "var(--panel-2)", color: "var(--muted)" }}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="text-xs sm:text-sm">{a.name}</strong>
                      {a.kind !== "cash" && (
                        <span className={`text-[10px] font-bold ${a.change >= 0 ? "positive" : "negative"}`}>
                          {a.change >= 0 ? "+" : ""}{toFa(String(a.change))}٪
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">
                      {a.kind !== "cash"
                        ? `قیمت واحد: ${format(a.pricePerUnit)} تومان`
                        : "نقدینگی در کیف پول"}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-xs sm:text-sm font-bold">
                      {hideBalance ? "••••" : fmtQty(a, a.amount)}
                      <span className="text-[10px] text-[var(--muted)] mr-1">{a.unit}</span>
                    </div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">
                      {hideBalance ? "•••• تومان" : `${format(value)} تومان`}
                    </div>
                  </div>
                  <ChevronLeftIcon />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Locked */}
      {lockedItems.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 sm:p-3.5 mb-2.5">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <span className="text-[var(--gold)]"><LockIcon /></span>
                بلوکه‌شده
              </h2>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">در انتظار تکمیل سفارش</p>
            </div>
            <span className="text-[10px] text-[var(--muted)]">{toFaInt(String(lockedItems.length))} مورد</span>
          </div>
          <div>
            {lockedItems.map((a, idx) => (
              <div key={a.id} className={`flex items-center gap-2.5 py-2.5 ${idx > 0 ? "border-t border-[var(--border)]" : ""}`}>
                <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                  style={{ background: "rgba(196,168,117,0.10)", color: "var(--gold)" }}>
                  <LockIcon />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{a.name}</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">{a.lockedReason}</div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-xs font-bold">
                    {hideBalance ? "••••" : `${fmtQty(a, a.locked)} ${a.unit}`}
                  </div>
                </div>
                <button type="button" disabled title="به‌زودی"
                  className="text-[10px] text-[var(--gold)] border border-[var(--border)] rounded-md px-1.5 py-0.5 opacity-60 cursor-not-allowed shrink-0">
                  لغو
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chart */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] mb-2.5 overflow-hidden">
        <button type="button" onClick={() => setChartOpen((v) => !v)}
          aria-expanded={chartOpen}
          className="w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2.5 hover:bg-[var(--panel-2)] transition-colors text-right">
          <div>
            <h2 className="font-bold text-xs sm:text-sm">نمودار کلی پرتفو</h2>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">
              {hideBalance ? "••••" : format(totalValue)} تومان · ۳۰ روز گذشته
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs font-bold ${totalProfit >= 0 ? "positive" : "negative"}`}>
              {totalProfit >= 0 ? "+" : ""}{toFa(profitPct)}٪
            </span>
            <ChevronDownIcon open={chartOpen} />
          </div>
        </button>
        {chartOpen && (
          <div className="px-3 sm:px-3.5 pb-3 border-t border-[var(--border)] pt-3">
            <PortfolioChart totalValue={totalValue} totalProfit={totalProfit} hideBalance={hideBalance} />
          </div>
        )}
      </section>

      {/* Report */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] mb-2.5">
        <button type="button" onClick={() => setReportOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 sm:px-3.5 py-3 hover:bg-[var(--panel-2)] transition-colors text-right rounded-2xl">
          <span className="w-9 h-9 rounded-lg grid place-items-center bg-[var(--panel-2)] text-[var(--gold)] shrink-0">
            <ReportIcon />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <strong className="text-xs sm:text-sm">گزارش تراکنش‌ها</strong>
              <span className="text-[10px] text-[var(--muted)]">
                {toFaInt(String(allTransactions.length))} مورد
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] text-[var(--muted)] mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <i className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> خرید
              </span>
              <span className="flex items-center gap-1">
                <i className="w-1.5 h-1.5 rounded-full bg-red-400" /> فروش
              </span>
              <span className="flex items-center gap-1">
                <i className="w-1.5 h-1.5 rounded-full bg-violet-400" /> انتقال
              </span>
              <span className="flex items-center gap-1">
                <i className="w-1.5 h-1.5 rounded-full bg-sky-400" /> واریز
              </span>
              <span className="flex items-center gap-1">
                <i className="w-1.5 h-1.5 rounded-full bg-amber-400" /> برداشت
              </span>
            </div>
          </div>
          <ChevronLeftIcon />
        </button>
      </section>

      <footer className="text-center py-3 text-[10px] text-[var(--muted)]">
        کیف زرگر · مدیریت هوشمند دارایی طلا
      </footer>

      {selected && (
        <AssetDetailModal asset={selected} onClose={() => setSelected(null)}
          onTrade={() => { setSelected(null); router.push("/trade"); }} />
      )}
      {reportOpen && (
        <ReportModal transactions={allTransactions} onClose={() => setReportOpen(false)}
          onTrade={() => { setReportOpen(false); router.push("/trade"); }} />
      )}
    </div>
  );
}