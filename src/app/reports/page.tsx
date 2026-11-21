"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/StateViews";

type ReportKind = "buy" | "sell" | "physical" | "deposit" | "withdraw";
type Market = "spot" | "p2p" | "leverage" | "physical" | "wallet";
type ReportStatus = "completed" | "pending" | "cancelled";
type ReportItem = {
  id: string;
  kind: ReportKind;
  market: Market;
  title: string;
  asset: string;
  quantity: string;
  amount: number;
  fee: number;
  date: string;
  dateKey: string;
  status: ReportStatus;
  reference: string;
  description: string;
};

const DEMO_REPORTS: ReportItem[] = [
  { id: "R-2601", kind: "buy", market: "spot", title: "خرید طلای ۱۸ عیار", asset: "طلای ۱۸ عیار", quantity: "۲٫۵۰۰ گرم", amount: 15875000, fee: 47500, date: "۱۴۰۵/۰۸/۲۱ · ۱۲:۴۰", dateKey: "1405-08-21", status: "completed", reference: "SP-845921", description: "خرید از بازار نقدی با قیمت لحظه‌ای" },
  { id: "R-2602", kind: "sell", market: "spot", title: "فروش طلای ۱۸ عیار", asset: "طلای ۱۸ عیار", quantity: "۱٫۰۰۰ گرم", amount: 6320000, fee: 18960, date: "۱۴۰۵/۰۸/۲۰ · ۱۶:۲۰", dateKey: "1405-08-20", status: "completed", reference: "SP-845733", description: "فروش دارایی به بازار نقدی" },
  { id: "R-2603", kind: "buy", market: "p2p", title: "خرید طلای آب‌شده", asset: "طلای آب‌شده", quantity: "۵٫۰۰۰ گرم", amount: 31600000, fee: 95000, date: "۱۴۰۵/۰۸/۱۹ · ۱۰:۱۵", dateKey: "1405-08-19", status: "completed", reference: "P2P-319420", description: "معامله همتا‌به‌همتا با فروشنده تأییدشده" },
  { id: "R-2604", kind: "sell", market: "p2p", title: "فروش طلای آب‌شده", asset: "طلای آب‌شده", quantity: "۲٫۰۰۰ گرم", amount: 12650000, fee: 38000, date: "۱۴۰۵/۰۸/۱۸ · ۱۴:۵۰", dateKey: "1405-08-18", status: "pending", reference: "P2P-319188", description: "در انتظار تأیید طرف معامله" },
  { id: "R-2605", kind: "buy", market: "leverage", title: "خرید موقعیت اهرمی", asset: "XAU / طلای ۱۸ عیار", quantity: "۰٫۸۰۰ گرم · اهرم ۵×", amount: 5060000, fee: 15200, date: "۱۴۰۵/۰۸/۱۷ · ۱۱:۳۲", dateKey: "1405-08-17", status: "completed", reference: "LV-771032", description: "ثبت موقعیت آزمایشی در بازار معاملات اهرمی" },
  { id: "R-2606", kind: "sell", market: "leverage", title: "بستن موقعیت اهرمی", asset: "XAU / طلای ۱۸ عیار", quantity: "۰٫۸۰۰ گرم · اهرم ۵×", amount: 5240000, fee: 15700, date: "۱۴۰۵/۰۸/۱۷ · ۱۳:۰۵", dateKey: "1405-08-17", status: "completed", reference: "LV-771084", description: "بستن کامل موقعیت؛ مبلغ نمایش‌داده‌شده نمونه است" },
  { id: "R-2607", kind: "physical", market: "physical", title: "درخواست دریافت فیزیکی طلا", asset: "طلای ۱۸ عیار", quantity: "۱۰٫۰۰۰ گرم", amount: 0, fee: 250000, date: "۱۴۰۵/۰۸/۱۶ · ۰۹:۲۰", dateKey: "1405-08-16", status: "pending", reference: "PH-551208", description: "درخواست دریافت فیزیکی؛ در انتظار آماده‌سازی و تحویل" },
  { id: "R-2608", kind: "physical", market: "physical", title: "تحویل فیزیکی سکه", asset: "سکه امامی", quantity: "۱ عدد", amount: 0, fee: 180000, date: "۱۴۰۵/۰۸/۱۲ · ۱۵:۴۵", dateKey: "1405-08-12", status: "completed", reference: "PH-550914", description: "تحویل حضوری با ثبت رسید دریافت" },
  { id: "R-2609", kind: "deposit", market: "wallet", title: "واریز از درگاه بانکی", asset: "تومان", quantity: "—", amount: 25000000, fee: 0, date: "۱۴۰۵/۰۸/۱۱ · ۱۲:۱۰", dateKey: "1405-08-11", status: "completed", reference: "DP-910277", description: "شارژ کیف پول از طریق درگاه پرداخت" },
  { id: "R-2610", kind: "withdraw", market: "wallet", title: "برداشت به حساب بانکی", asset: "تومان", quantity: "—", amount: 8000000, fee: 5000, date: "۱۴۰۵/۰۸/۱۰ · ۱۱:۴۰", dateKey: "1405-08-10", status: "completed", reference: "WD-620491", description: "ثبت درخواست برداشت به شبای تأییدشده" },
  { id: "R-2611", kind: "deposit", market: "wallet", title: "واریز دستی با فیش", asset: "تومان", quantity: "—", amount: 12000000, fee: 0, date: "۱۴۰۵/۰۸/۰۹ · ۰۸:۵۵", dateKey: "1405-08-09", status: "pending", reference: "DP-910044", description: "فیش بانکی ارسال شده و در انتظار بررسی" },
  { id: "R-2612", kind: "sell", market: "spot", title: "فروش سکه بهار آزادی", asset: "بهار آزادی", quantity: "۱ عدد", amount: 174500000, fee: 523500, date: "۱۴۰۵/۰۸/۰۷ · ۱۷:۰۰", dateKey: "1405-08-07", status: "cancelled", reference: "SP-844920", description: "سفارش توسط کاربر لغو شده است" },
  { id: "R-2613", kind: "withdraw", market: "wallet", title: "برداشت وجه", asset: "تومان", quantity: "—", amount: 3500000, fee: 5000, date: "۱۴۰۵/۰۸/۰۵ · ۱۳:۱۵", dateKey: "1405-08-05", status: "cancelled", reference: "WD-619830", description: "درخواست برداشت لغو شده است" },
];

const KIND_OPTIONS = [
  { id: "all", label: "همه فعالیت‌ها" }, { id: "buy", label: "خرید طلا" }, { id: "sell", label: "فروش طلا" },
  { id: "physical", label: "دریافت فیزیکی" }, { id: "deposit", label: "واریز وجه" }, { id: "withdraw", label: "برداشت وجه" },
] as const;
const MARKET_OPTIONS = [
  { id: "all", label: "همه بازارها" }, { id: "spot", label: "بازار نقدی" }, { id: "p2p", label: "بازار همتا‌به‌همتا" },
  { id: "leverage", label: "بازار اهرمی" }, { id: "physical", label: "بازار فیزیکی" }, { id: "wallet", label: "کیف پول" },
] as const;
const kindMeta: Record<ReportKind, { label: string; icon: string; tone: string }> = {
  buy: { label: "خرید", icon: "↙", tone: "text-[var(--green)] bg-[var(--green)]/10" },
  sell: { label: "فروش", icon: "↗", tone: "text-[var(--red)] bg-[var(--red)]/10" },
  physical: { label: "دریافت فیزیکی", icon: "▣", tone: "text-violet-400 bg-violet-500/10" },
  deposit: { label: "واریز وجه", icon: "↓", tone: "text-sky-400 bg-sky-500/10" },
  withdraw: { label: "برداشت وجه", icon: "↑", tone: "text-amber-400 bg-amber-500/10" },
};
const marketLabel: Record<Market, string> = { spot: "نقدی", p2p: "همتا‌به‌همتا", leverage: "اهرمـی", physical: "فیزیکی", wallet: "کیف پول" };
const statusMeta: Record<ReportStatus, { label: string; tone: string }> = {
  completed: { label: "تکمیل‌شده", tone: "text-[var(--green)] bg-[var(--green)]/10" },
  pending: { label: "در انتظار", tone: "text-amber-400 bg-amber-500/10" },
  cancelled: { label: "لغوشده", tone: "text-[var(--muted)] bg-[var(--panel-2)]" },
};
const money = (n: number) => `${new Intl.NumberFormat("fa-IR").format(n)} تومان`;
const digits = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function DownloadIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></svg>; }
function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
function CloseIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m18 6-12 12M6 6l12 12"/></svg>; }

export default function ReportsPage() {
  const [kind, setKind] = useState<string>("all");
  const [market, setMarket] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [period, setPeriod] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReportItem | null>(null);

  const filtered = useMemo(() => DEMO_REPORTS.filter((item) => {
    const matchesKind = kind === "all" || item.kind === kind;
    const matchesMarket = market === "all" || item.market === market;
    const matchesStatus = status === "all" || item.status === status;
    const matchesQuery = !query.trim() || [item.id, item.title, item.asset, item.reference, item.description].some((v) => v.toLowerCase().includes(query.trim().toLowerCase()));
    const matchesPeriod = period === "all" || (period === "recent" ? item.dateKey >= "1405-08-07" : item.dateKey >= "1405-07-22");
    return matchesKind && matchesMarket && matchesStatus && matchesQuery && matchesPeriod;
  }), [kind, market, status, period, query]);

  const completedRows = filtered.filter((x) => x.status === "completed");
  const completed = completedRows.length;
  const buySellCount = filtered.filter((x) => x.kind === "buy" || x.kind === "sell").length;
  const depositsTotal = completedRows.filter(x => x.kind === "deposit").reduce((sum, x) => sum + x.amount, 0);
  const withdrawalsTotal = completedRows.filter(x => x.kind === "withdraw").reduce((sum, x) => sum + x.amount, 0);
  const feesTotal = completedRows.reduce((sum, x) => sum + x.fee, 0);
  const purchaseTotal = completedRows.filter(x => x.kind === "buy").reduce((sum, x) => sum + x.amount, 0);
  const salesTotal = completedRows.filter(x => x.kind === "sell").reduce((sum, x) => sum + x.amount, 0);
  const netCashFlow = depositsTotal - withdrawalsTotal;
  const exportCsv = () => {
    const header = ["شناسه", "نوع", "بازار", "عنوان", "دارایی", "مقدار", "مبلغ (تومان)", "کارمزد", "تاریخ", "وضعیت", "کد پیگیری"];
    const rows = filtered.map((x) => [x.id, kindMeta[x.kind].label, marketLabel[x.market], x.title, x.asset, x.quantity, x.amount, x.fee, x.date, statusMeta[x.status].label, x.reference]);
    const summaryRows = [
      ["", "خلاصه مالی", "", "مجموع واریز تکمیل‌شده", "", "", depositsTotal, 0, "", "", ""],
      ["", "خلاصه مالی", "", "مجموع برداشت تکمیل‌شده", "", "", withdrawalsTotal, 0, "", "", ""],
      ["", "خلاصه مالی", "", "مجموع کارمزد تکمیل‌شده", "", "", "", feesTotal, "", "", ""],
      ["", "خلاصه مالی", "", "مجموع خریدهای تکمیل‌شده", "", "", purchaseTotal, 0, "", "", ""],
      ["", "خلاصه مالی", "", "مجموع فروش‌های تکمیل‌شده", "", "", salesTotal, 0, "", "", ""],
      ["", "خلاصه مالی", "", "خالص واریز/برداشت", "", "", netCashFlow, "", "", "", ""],
    ];
    const csv = "\uFEFF" + [header, ...rows, ...summaryRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "kif-zargar-reports.csv"; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="reports-print-root max-w-6xl mx-auto p-3 sm:p-5 lg:p-7 space-y-5" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-lg sm:text-xl font-black">گزارش کامل فعالیت‌ها</h1><span className="text-[9px] rounded-full px-2 py-1 border border-amber-500/30 text-amber-400 bg-amber-500/10">اطلاعات آزمایشی</span></div>
          <p className="text-[11px] text-[var(--muted)] mt-1">تاریخچه یکپارچه خرید، فروش، دریافت فیزیکی طلا و گردش وجه در تمام بازارها</p>
          <p className="text-[9px] text-[var(--muted)] mt-1">محدوده گزارش: {period === "recent" ? "۱۵ روز اخیر" : period === "month" ? "۳۰ روز اخیر" : "تمام تاریخ‌ها"} · نوع: {KIND_OPTIONS.find(option => option.id === kind)?.label || "همه فعالیت‌ها"} · بازار: {market === "all" ? "همه بازارها" : marketLabel[market as Market]} · وضعیت: {status === "all" ? "همه وضعیت‌ها" : statusMeta[status as ReportStatus].label}</p>
        </div>
        <div className="reports-no-print flex flex-wrap gap-2">
          <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/10 px-4 py-2.5 text-xs font-bold transition"><DownloadIcon /> خروجی اکسل‌خوان (CSV)</button>
          <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:border-[var(--gold)]/50 px-4 py-2.5 text-xs font-bold transition">▣ چاپ / ذخیره PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        <SummaryCard label="کل فعالیت‌های ثبت‌شده" value={digits(DEMO_REPORTS.length)} note="در تمام دسته‌ها" icon="▤" />
        <SummaryCard label="فعالیت‌های این فیلتر" value={digits(filtered.length)} note="نتایج مطابق جستجو" icon="⌕" />
        <SummaryCard label="معاملات خرید و فروش" value={digits(buySellCount)} note="بازارهای نقدی، P2P و اهرمی" icon="⇄" />
        <SummaryCard label="تکمیل‌شده‌ها" value={digits(completed)} note={`${digits(filtered.length - completed)} مورد در انتظار یا لغوشده`} icon="✓" />
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xs font-black">خلاصه صورت‌حساب مالی</h2><p className="text-[9px] text-[var(--muted)] mt-1">محاسبه بر اساس ردیف‌های تکمیل‌شده و فیلترهای فعلی</p></div><span className="text-[8px] rounded-full px-2 py-1 border border-[var(--green)]/25 text-[var(--green)]">فقط موارد تکمیل‌شده</span></div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
          <SummaryCard label="مجموع واریز وجه" value={money(depositsTotal)} note="واریزهای تکمیل‌شده" icon="↙" />
          <SummaryCard label="مجموع برداشت وجه" value={money(withdrawalsTotal)} note="برداشت‌های تکمیل‌شده" icon="↗" />
          <SummaryCard label="مجموع کارمزدها" value={money(feesTotal)} note="کارمزد فعالیت‌های تکمیل‌شده" icon="٪" />
          <SummaryCard label="مجموع خریدها" value={money(purchaseTotal)} note="خریدهای تکمیل‌شده" icon="↓" />
          <SummaryCard label="مجموع فروش‌ها" value={money(salesTotal)} note="فروش‌های تکمیل‌شده" icon="↑" />
          <SummaryCard label="خالص واریز/برداشت" value={money(netCashFlow)} note="واریز منهای برداشت" icon="⇄" />
        </div>
      </section>

      <section className="reports-no-print rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-xs font-black">فیلتر و جستجوی گزارش‌ها</h2><button onClick={() => { setKind("all"); setMarket("all"); setStatus("all"); setPeriod("all"); setQuery(""); }} className="reports-no-print text-[10px] text-[var(--gold)] hover:underline">پاک کردن فیلترها</button></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
          <label className="sm:col-span-2 xl:col-span-1 relative"><span className="sr-only">جستجو</span><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"><SearchIcon /></span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو عنوان، شناسه، دارایی..." className="w-full h-10 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] pr-9 pl-3 text-[11px] outline-none focus:border-[var(--gold)]" /></label>
          <SelectFilter label="نوع فعالیت" value={kind} onChange={setKind} options={KIND_OPTIONS} />
          <SelectFilter label="بازار" value={market} onChange={setMarket} options={MARKET_OPTIONS} />
          <SelectFilter label="وضعیت" value={status} onChange={setStatus} options={[{ id: "all", label: "همه وضعیت‌ها" }, { id: "completed", label: "تکمیل‌شده" }, { id: "pending", label: "در انتظار" }, { id: "cancelled", label: "لغوشده" }]} />
          <SelectFilter label="بازه زمانی" value={period} onChange={setPeriod} options={[{ id: "all", label: "تمام تاریخ‌ها" }, { id: "recent", label: "۱۵ روز اخیر" }, { id: "month", label: "۳۰ روز اخیر" }]} />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {KIND_OPTIONS.map((o) => <button key={o.id} onClick={() => setKind(o.id)} className={`px-3 py-1.5 rounded-full text-[10px] border transition ${kind === o.id ? "bg-[var(--gold)]/15 border-[var(--gold)]/50 text-[var(--gold)]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}>{o.label}</button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2"><div><h2 className="text-xs font-black">ریز تراکنش‌ها</h2><p className="text-[9px] text-[var(--muted)] mt-1">{digits(filtered.length)} رکورد مطابق فیلترها</p></div><span className="text-[9px] text-[var(--muted)]">جدیدترین ابتدا</span></div>
        {filtered.length === 0 ? <div className="p-8"><EmptyState title="گزارشی پیدا نشد" description="فیلترها یا عبارت جستجو را تغییر دهید." /></div> : <>
          <div className="hidden lg:block overflow-x-auto reports-print-table"><table className="w-full text-right min-w-[900px]"><thead className="bg-[var(--panel-2)] text-[9px] text-[var(--muted)]"><tr>{["نوع فعالیت", "عنوان و دارایی", "بازار", "مقدار", "مبلغ", "تاریخ", "وضعیت", ""].map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--panel-2)]/60 transition cursor-pointer" onClick={() => setSelected(item)}><td className="px-4 py-3"><KindPill kind={item.kind} /></td><td className="px-4 py-3"><div className="text-[11px] font-bold">{item.title}</div><div className="text-[9px] text-[var(--muted)] mt-1">{item.asset} · {item.id}</div></td><td className="px-4 py-3 text-[10px] text-[var(--muted)]">{marketLabel[item.market]}</td><td className="px-4 py-3 text-[10px] font-mono">{item.quantity}</td><td className="px-4 py-3"><div className="text-[10px] font-bold font-mono">{item.amount ? money(item.amount) : "—"}</div>{item.fee > 0 && <div className="text-[9px] text-[var(--muted)] mt-1">کارمزد: {money(item.fee)}</div>}</td><td className="px-4 py-3 text-[9px] text-[var(--muted)] whitespace-nowrap">{item.date}</td><td className="px-4 py-3"><StatusPill status={item.status} /></td><td className="px-4 py-3 text-left"><button onClick={(e) => { e.stopPropagation(); setSelected(item); }} className="text-[10px] text-[var(--gold)] hover:underline">جزئیات</button></td></tr>)}</tbody></table></div>
          <div className="lg:hidden divide-y divide-[var(--border)] reports-print-mobile">{filtered.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="w-full text-right p-3.5 hover:bg-[var(--panel-2)]/60 transition"><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2 min-w-0"><KindPill kind={item.kind} /><div className="min-w-0"><div className="text-[11px] font-bold truncate">{item.title}</div><div className="text-[9px] text-[var(--muted)] mt-1">{item.asset} · {marketLabel[item.market]}</div></div></div><StatusPill status={item.status} /></div><div className="flex items-center justify-between gap-2 mt-3"><div className="text-[10px] font-bold font-mono">{item.amount ? money(item.amount) : item.quantity}</div><div className="text-[9px] text-[var(--muted)]">{item.date}</div></div><div className="text-[9px] text-[var(--muted)] mt-1">شناسه: {item.id}</div></button>)}</div>
        </>}
      </section>

      <div className="reports-no-print rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-3 text-[10px] leading-6 text-[var(--muted)]"><b className="text-[var(--gold)]">توجه:</b> این صفحه در حال حاضر نمونه رابط کاربری است و اطلاعات آن آزمایشی است. برای نمایش سوابق واقعی، باید گزارش‌ها به API و پایگاه داده تراکنش‌های حساب متصل شوند. مبالغ، شناسه‌ها و رکوردهای نمونه، سند مالی یا رسید واقعی محسوب نمی‌شوند.</div>

      {selected && <div className="reports-no-print fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)} role="presentation"><div role="dialog" aria-modal="true" aria-label="جزئیات گزارش" onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden"><div className="flex items-center justify-between p-4 border-b border-[var(--border)]"><div><h3 className="text-sm font-black">جزئیات فعالیت</h3><p className="text-[9px] text-[var(--muted)] mt-1 font-mono" dir="ltr">{selected.reference}</p></div><button onClick={() => setSelected(null)} aria-label="بستن" className="p-2 rounded-lg hover:bg-[var(--panel-2)]"><CloseIcon /></button></div><div className="p-4 space-y-3"><div className="flex items-center justify-between"><KindPill kind={selected.kind} /><StatusPill status={selected.status} /></div><div className="text-base font-black">{selected.title}</div><div className="grid grid-cols-2 gap-2">{[["شناسه فعالیت", selected.id], ["بازار", marketLabel[selected.market]], ["دارایی", selected.asset], ["مقدار", selected.quantity], ["مبلغ", selected.amount ? money(selected.amount) : "—"], ["کارمزد", money(selected.fee)], ["تاریخ و ساعت", selected.date], ["کد پیگیری", selected.reference]].map(([label, value]) => <div key={label} className="rounded-xl bg-[var(--panel-2)] p-3"><div className="text-[9px] text-[var(--muted)] mb-1">{label}</div><div className="text-[10px] font-bold break-words">{value}</div></div>)}</div><div className="rounded-xl border border-[var(--border)] p-3"><div className="text-[9px] text-[var(--muted)] mb-1">توضیحات</div><p className="text-[10px] leading-6">{selected.description}</p></div><button onClick={() => setSelected(null)} className="w-full rounded-xl bg-[var(--gold)] text-[#17191c] py-3 text-xs font-black">بستن جزئیات</button></div></div></div>}
    </div>
  );
}

function SummaryCard({ label, value, note, icon }: { label: string; value: string; note: string; icon: string }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 sm:p-4"><div className="flex items-center justify-between gap-2"><span className="text-[9px] sm:text-[10px] text-[var(--muted)]">{label}</span><span className="w-7 h-7 rounded-lg bg-[var(--gold)]/10 text-[var(--gold)] grid place-items-center text-sm">{icon}</span></div><div className="text-lg sm:text-xl font-black font-mono mt-2 break-words leading-tight">{value}</div><div className="text-[9px] text-[var(--muted)] mt-1">{note}</div></div>;
}
function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly { id: string; label: string }[] }) {
  return <label className="block"><span className="block text-[9px] text-[var(--muted)] mb-1">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] px-2.5 text-[10px] outline-none focus:border-[var(--gold)]">{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
}
function KindPill({ kind }: { kind: ReportKind }) { const meta = kindMeta[kind]; return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] whitespace-nowrap ${meta.tone}`}><b>{meta.icon}</b>{meta.label}</span>; }
function StatusPill({ status }: { status: ReportStatus }) { const meta = statusMeta[status]; return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] whitespace-nowrap ${meta.tone}`}>{meta.label}</span>; }
