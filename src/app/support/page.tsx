"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, LoadingState } from "@/components/ui/StateViews";

type TicketStatus = "open" | "answered" | "closed";
type Message = { id: string; sender: "user" | "support"; text: string; time: string };
type Ticket = { id: string; subject: string; category: string; priority: "عادی" | "مهم"; status: TicketStatus; createdAt: string; updatedAt: string; messages: Message[] };

const STORAGE_KEY = "kif-zargar-support-tickets-v1";
const initialTickets: Ticket[] = [
  { id: "KZ-14028", subject: "پیگیری وضعیت سفارش طلا", category: "سفارشات و خرید", priority: "عادی", status: "answered", createdAt: "۱۴۰۵/۰۸/۱۹ - ۱۰:۲۴", updatedAt: "۱۴۰۵/۰۸/۱۹ - ۱۲:۱۰", messages: [
    { id: "m1", sender: "user", text: "سلام، سفارش من هنوز در مرحله آماده‌سازی است. لطفاً وضعیت آن را بررسی کنید.", time: "۱۰:۲۴" },
    { id: "m2", sender: "support", text: "سلام، درخواست شما بررسی شد. سفارش در صف بسته‌بندی قرار دارد و وضعیت آن به‌زودی به‌روزرسانی می‌شود.", time: "۱۲:۱۰" },
  ] },
  { id: "KZ-13971", subject: "سؤال درباره کارمزد معامله", category: "معاملات و قیمت‌ها", priority: "عادی", status: "open", createdAt: "۱۴۰۵/۰۸/۱۷ - ۱۶:۴۲", updatedAt: "۱۴۰۵/۰۸/۱۷ - ۱۶:۴۲", messages: [
    { id: "m3", sender: "user", text: "کارمزد خرید و فروش در معاملات اهرمی چگونه محاسبه می‌شود؟", time: "۱۶:۴۲" },
  ] },
  { id: "KZ-13820", subject: "اصلاح اطلاعات حساب کاربری", category: "حساب کاربری و احراز هویت", priority: "مهم", status: "closed", createdAt: "۱۴۰۵/۰۸/۱۲ - ۰۹:۱۵", updatedAt: "۱۴۰۵/۰۸/۱۳ - ۱۱:۰۵", messages: [
    { id: "m4", sender: "user", text: "برای اصلاح نام خانوادگی در حسابم راهنمایی می‌خواهم.", time: "۰۹:۱۵" },
    { id: "m5", sender: "support", text: "برای اصلاح اطلاعات هویتی، لطفاً از بخش احراز هویت درخواست اصلاح اطلاعات ثبت کنید.", time: "۱۱:۰۵" },
  ] },
];

const statusMeta: Record<TicketStatus, { label: string; className: string; dot: string }> = {
  open: { label: "در انتظار پاسخ", className: "text-amber-400 bg-amber-500/10 border-amber-500/25", dot: "bg-amber-400" },
  answered: { label: "پاسخ داده شده", className: "text-sky-400 bg-sky-500/10 border-sky-500/25", dot: "bg-sky-400" },
  closed: { label: "بسته شده", className: "text-[var(--muted)] bg-[var(--panel-2)] border-[var(--border)]", dot: "bg-[var(--muted)]" },
};
const categories = ["حساب کاربری و احراز هویت", "کیف پول و واریز/برداشت", "سفارشات و خرید", "معاملات و قیمت‌ها", "امنیت و ورود", "سایر موارد"];

export default function SupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState<"عادی" | "مهم">("عادی");
  const [description, setDescription] = useState("");
  const [reply, setReply] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Ticket[];
        if (Array.isArray(parsed)) setTickets(parsed);
      }
    } catch { /* keep demo data if storage is unavailable */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); } catch { /* storage may be disabled */ }
  }, [tickets, ready]);

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const filtered = useMemo(() => tickets.filter((ticket) => {
    const matchesStatus = filter === "all" || ticket.status === filter;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || `${ticket.id} ${ticket.subject} ${ticket.category}`.toLowerCase().includes(needle);
    return matchesStatus && matchesQuery;
  }), [tickets, filter, query]);

  function createTicket() {
    if (subject.trim().length < 4 || description.trim().length < 12) {
      toast.warning("عنوان و شرح درخواست را کامل‌تر وارد کنید.");
      return;
    }
    const now = new Date();
    const time = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("fa-IR");
    const id = `KZ-${Math.floor(10000 + Math.random() * 89999)}`;
    const ticket: Ticket = { id, subject: subject.trim(), category, priority, status: "open", createdAt: `${date} - ${time}`, updatedAt: `${date} - ${time}`, messages: [{ id: `m-${Date.now()}`, sender: "user", text: description.trim(), time }] };
    setTickets((current) => [ticket, ...current]);
    setSelectedId(id);
    setCreating(false);
    setSubject(""); setDescription(""); setPriority("عادی"); setCategory(categories[0]);
    toast.success("تیکت آزمایشی شما ثبت شد.");
  }

  function sendReply() {
    if (!selected || !reply.trim()) return;
    const time = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    const date = new Date().toLocaleDateString("fa-IR");
    setTickets((current) => current.map((ticket) => ticket.id !== selected.id ? ticket : {
      ...ticket, status: "open", updatedAt: `${date} - ${time}`,
      messages: [...ticket.messages, { id: `m-${Date.now()}`, sender: "user", text: reply.trim(), time }],
    }));
    setReply("");
    toast.success("پیام شما به تیکت اضافه شد.");
  }

  function closeTicket() {
    if (!selected) return;
    setTickets((current) => current.map((ticket) => ticket.id === selected.id ? { ...ticket, status: "closed" } : ticket));
    setConfirmClose(false);
    toast.success("تیکت بسته شد.");
  }

  const counts = { all: tickets.length, open: tickets.filter(t => t.status === "open").length, answered: tickets.filter(t => t.status === "answered").length, closed: tickets.filter(t => t.status === "closed").length };

  if (!ready) return <div className="px-3 sm:px-5 lg:px-7 pt-8 max-w-[1440px] mx-auto" dir="rtl"><LoadingState title="در حال دریافت تیکت‌ها..." rows={3} /></div>;

  return (
    <div className="px-3 sm:px-5 lg:px-7 pt-4 pb-10 font-sans max-w-[1440px] mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div><div className="flex items-center gap-2 mb-1"><span className="w-9 h-9 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center text-lg">◉</span><h1 className="font-black text-lg sm:text-xl">مرکز پشتیبانی</h1></div><p className="text-[11px] sm:text-xs text-[var(--muted)]">ثبت تیکت، مشاهده پاسخ‌ها و پیگیری درخواست‌ها</p></div>
        <button onClick={() => { setSelectedId(null); setCreating(true); }} className="h-10 px-4 rounded-xl bg-[var(--gold)] text-black font-bold text-xs flex items-center justify-center gap-2 hover:brightness-105 transition"><span className="text-lg leading-none">＋</span> ثبت تیکت جدید</button>
      </div>

      {!selected && !creating && <>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mb-4">
          {[{ key: "all", label: "همه درخواست‌ها", value: counts.all, icon: "▤" }, { key: "open", label: "در انتظار پاسخ", value: counts.open, icon: "◷" }, { key: "answered", label: "پاسخ داده شده", value: counts.answered, icon: "✓" }, { key: "closed", label: "بسته شده", value: counts.closed, icon: "—" }].map((item) => <button key={item.key} onClick={() => setFilter(item.key as typeof filter)} className={`rounded-2xl border p-3 text-right transition ${filter === item.key ? "border-[var(--gold)]/50 bg-[var(--gold)]/5" : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--gold)]/30"}`}><div className="flex items-center justify-between"><span className="text-[10px] text-[var(--muted)]">{item.label}</span><span className="text-[var(--gold)] text-sm">{item.icon}</span></div><div className="font-black text-xl mt-1 tabular-nums">{item.value.toLocaleString("fa-IR")}</div></button>)}
        </div>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"><div><h2 className="text-sm font-bold">درخواست‌های من</h2><p className="text-[10px] text-[var(--muted)] mt-1">برای مشاهده جزئیات و پاسخ‌ها، یک تیکت را انتخاب کنید.</p></div><div className="relative w-full sm:w-64"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در تیکت‌ها..." className="w-full h-9 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] px-3 pr-8 text-[11px] outline-none focus:border-[var(--gold)]/60"/><span className="absolute right-3 top-2 text-[var(--muted)] text-xs">⌕</span></div></div>
          <div className="flex gap-1.5 px-3 sm:px-4 py-2.5 border-b border-[var(--border)] overflow-x-auto">{[{key:"all",label:"همه"},{key:"open",label:"در انتظار پاسخ"},{key:"answered",label:"پاسخ داده شده"},{key:"closed",label:"بسته شده"}].map(tab=><button key={tab.key} onClick={()=>setFilter(tab.key as typeof filter)} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${filter===tab.key?"bg-[var(--gold)]/15 text-[var(--gold)]":"text-[var(--muted)] hover:bg-[var(--panel-2)]"}`}>{tab.label}</button>)}</div>
          {filtered.length ? <div className="divide-y divide-[var(--border)]">{filtered.map(ticket => <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className="w-full text-right p-3.5 sm:px-4 sm:py-4 hover:bg-[var(--panel-2)]/70 transition"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--gold)]">✉</div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2 mb-1"><span className="font-bold text-xs truncate">{ticket.subject}</span><span className={`text-[9px] border rounded-full px-2 py-0.5 ${statusMeta[ticket.status].className}`}>{statusMeta[ticket.status].label}</span></div><div className="text-[10px] text-[var(--muted)] flex flex-wrap gap-x-3 gap-y-1"><span dir="ltr">{ticket.id}</span><span>{ticket.category}</span><span>{ticket.updatedAt}</span></div><p className="text-[10px] text-[var(--muted)] mt-2 truncate">{ticket.messages[ticket.messages.length-1]?.text}</p></div><span className="text-[var(--muted)] self-center">‹</span></div></button>)}</div> : tickets.length === 0 ? <EmptyState icon="✉" title="هنوز تیکتی ثبت نکرده‌اید" description="اگر به راهنمایی نیاز دارید، اولین درخواست خود را ثبت کنید." action="ثبت تیکت جدید" onAction={() => setCreating(true)} /> : <EmptyState icon="⌕" title="تیکتی پیدا نشد" description="عبارت جستجو یا فیلتر انتخاب‌شده نتیجه‌ای نداشت. فیلترها را تغییر دهید یا جستجو را پاک کنید." action={query ? "پاک کردن جستجو" : undefined} onAction={query ? () => setQuery("") : undefined} />}
        </section>
        <div className="mt-4 rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold)]/5 p-3.5 flex gap-3"><span className="text-lg">💡</span><div><div className="text-[11px] font-bold">قبل از ثبت تیکت</div><p className="text-[10px] text-[var(--muted)] leading-6 mt-1">موضوع و جزئیات درخواست را دقیق بنویسید تا تیم پشتیبانی بهتر راهنمایی‌تان کند. اطلاعات محرمانه مثل رمز عبور و کد امن را ارسال نکنید.</p></div></div>
      </>}

      {creating && <section className="max-w-3xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden"><div className="p-4 border-b border-[var(--border)] flex items-center justify-between"><div><h2 className="font-bold text-sm">ثبت درخواست پشتیبانی</h2><p className="text-[10px] text-[var(--muted)] mt-1">فرم زیر را تکمیل کنید.</p></div><button onClick={()=>setCreating(false)} className="w-8 h-8 rounded-lg bg-[var(--panel-2)] text-[var(--muted)]">✕</button></div><div className="p-4 sm:p-5 space-y-4"><div><label className="block text-[11px] font-bold mb-2">موضوع درخواست</label><input value={subject} onChange={e=>setSubject(e.target.value)} maxLength={90} placeholder="مثلاً مشکل در واریز وجه" className="w-full h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] px-3 text-xs outline-none focus:border-[var(--gold)]/60"/></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="block text-[11px] font-bold mb-2">دسته‌بندی</label><select value={category} onChange={e=>setCategory(e.target.value)} className="w-full h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] px-3 text-xs outline-none">{categories.map(c=><option key={c}>{c}</option>)}</select></div><div><label className="block text-[11px] font-bold mb-2">اولویت</label><div className="grid grid-cols-2 gap-2">{(["عادی","مهم"] as const).map(p=><button key={p} onClick={()=>setPriority(p)} className={`h-11 rounded-xl border text-xs font-bold ${priority===p?"border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]":"border-[var(--border)] bg-[var(--panel-2)] text-[var(--muted)]"}`}>{p}</button>)}</div></div></div><div><label className="block text-[11px] font-bold mb-2">شرح درخواست</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={6} maxLength={2000} placeholder="مشکل یا سؤال خود را با جزئیات توضیح دهید..." className="w-full resize-y min-h-32 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] p-3 text-xs leading-6 outline-none focus:border-[var(--gold)]/60"/><div className="text-left text-[9px] text-[var(--muted)] mt-1">{description.length.toLocaleString("fa-IR")} / ۲۰۰۰</div></div><div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-[10px] text-amber-300 leading-5">اطلاعات بانکی، رمز عبور، کد یک‌بارمصرف یا کد امن خود را در متن تیکت وارد نکنید.</div><div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end"><button onClick={()=>setCreating(false)} className="h-10 px-5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)]">انصراف</button><button onClick={createTicket} className="h-10 px-6 rounded-xl bg-[var(--gold)] text-black text-xs font-bold">ثبت تیکت</button></div></div></section>}

      {selected && <section className="max-w-4xl mx-auto"><button onClick={()=>{setSelectedId(null);setReply("");}} className="text-[11px] text-[var(--gold)] font-bold mb-3 flex items-center gap-2">→ بازگشت به فهرست تیکت‌ها</button><div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden"><div className="p-4 sm:p-5 border-b border-[var(--border)]"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2 mb-2"><span className="text-[10px] text-[var(--muted)]" dir="ltr">{selected.id}</span><span className={`text-[9px] border rounded-full px-2 py-0.5 ${statusMeta[selected.status].className}`}>{statusMeta[selected.status].label}</span></div><h2 className="font-bold text-sm sm:text-base">{selected.subject}</h2><p className="text-[10px] text-[var(--muted)] mt-1">{selected.category} · ثبت {selected.createdAt}</p></div>{selected.status!=="closed"&&<button onClick={()=>setConfirmClose(true)} className="h-9 px-3 rounded-xl border border-[var(--border)] text-[10px] text-[var(--muted)] hover:text-[var(--red)] hover:border-[var(--red)]/40">بستن تیکت</button>}</div></div><div className="p-3 sm:p-5 bg-[var(--bg)]/40"><div className="space-y-3">{selected.messages.map(message=><div key={message.id} className={`flex ${message.sender==="user"?"justify-start":"justify-end"}`}><div className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-3 border ${message.sender==="user"?"bg-[var(--panel)] border-[var(--border)] rounded-tr-sm":"bg-[var(--gold)]/10 border-[var(--gold)]/20 rounded-tl-sm"}`}><div className="flex items-center justify-between gap-5 mb-2"><span className={`text-[10px] font-bold ${message.sender==="support"?"text-[var(--gold)]":"text-[var(--text)]"}`}>{message.sender==="user"?"شما":"پشتیبانی کیف زرگر"}</span><span className="text-[9px] text-[var(--muted)]">{message.time}</span></div><p className="text-[11px] leading-6 whitespace-pre-wrap">{message.text}</p></div></div>)}</div></div>{selected.status!=="closed"?<div className="p-3 sm:p-4 border-t border-[var(--border)]"><label className="block text-[11px] font-bold mb-2">ارسال پیام جدید</label><div className="flex flex-col sm:flex-row gap-2"><textarea value={reply} onChange={e=>setReply(e.target.value)} rows={2} maxLength={1500} placeholder="پاسخ یا توضیح تکمیلی خود را بنویسید..." className="flex-1 min-h-14 resize-y rounded-xl bg-[var(--panel-2)] border border-[var(--border)] p-3 text-xs outline-none focus:border-[var(--gold)]/60"/><button onClick={sendReply} disabled={!reply.trim()} className="h-11 sm:self-end px-5 rounded-xl bg-[var(--gold)] text-black text-xs font-bold disabled:opacity-40">ارسال پیام</button></div></div>:<div className="p-4 border-t border-[var(--border)] text-center text-[10px] text-[var(--muted)]">این تیکت بسته شده است. برای ادامه گفتگو، یک تیکت جدید ثبت کنید.</div>}</div></section>}
      <ConfirmDialog open={confirmClose} title="بستن این تیکت؟" description="پس از بستن، امکان ارسال پیام جدید در این گفت‌وگو غیرفعال می‌شود. می‌توانید در صورت نیاز تیکت تازه‌ای ثبت کنید." confirmText="بله، بستن تیکت" variant="danger" onConfirm={closeTicket} onClose={() => setConfirmClose(false)} />
      <p className="text-center text-[9px] text-[var(--muted)] mt-6">مرکز پشتیبانی آزمایشی · پاسخ‌ها و تیکت‌ها در همین مرورگر ذخیره می‌شوند.</p>
    </div>
  );
}
