"use client";

import { useState } from "react";
import Link from "next/link";
import AddCardModal from "@/components/AddCardModal";
import DeleteCardModal from "@/components/DeleteCardModal";
import { useBankCards, type BankCard } from "@/lib/bank-cards";
import { useToast } from "@/components/ui/Toast";

export default function BankAccountsPage() {
  const { cards, ready, addCard, removeCard, setDefault } = useBankCards();
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankCard | null>(null);

  async function copyIban(iban: string) {
    try { await navigator.clipboard.writeText(iban); toast.success("شماره شبا کپی شد"); }
    catch { toast.error("کپی انجام نشد"); }
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-3"><Link href="/profile" className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--panel)] grid place-items-center">→</Link><div className="flex-1"><h1 className="text-lg font-black">مدیریت حساب‌های بانکی</h1><p className="text-[10px] text-[var(--muted)] mt-1">کارت‌ها و شبای مقصد برای واریز و برداشت</p></div><span className="text-2xl">🏦</span></div>

      <div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"><div className="text-[9px] text-[var(--muted)]">تعداد حساب‌ها</div><div className="text-xl font-black mt-1">{ready ? cards.length.toLocaleString("fa-IR") : "—"}</div></div><div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"><div className="text-[9px] text-[var(--muted)]">حساب پیش‌فرض</div><div className="text-sm font-black mt-2 truncate">{cards.find(c => c.isDefault)?.bank || "انتخاب نشده"}</div></div></div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2"><div><h2 className="text-xs font-black">حساب‌های ثبت‌شده</h2><p className="text-[9px] text-[var(--muted)] mt-1">حساب پیش‌فرض برای برداشت‌های جدید انتخاب می‌شود.</p></div><button onClick={() => setShowAdd(true)} disabled={!ready} className="h-9 px-3 rounded-xl bg-[var(--gold)] text-black text-[10px] font-black shrink-0 disabled:opacity-40">+ افزودن حساب</button></div>
        {!ready ? <div className="p-8 text-center text-xs text-[var(--muted)]">در حال بارگذاری حساب‌ها...</div> : cards.length === 0 ? <div className="p-8 text-center"><div className="text-3xl mb-2">🏦</div><div className="text-xs font-bold">هنوز حساب بانکی ثبت نکرده‌اید</div><p className="text-[9px] text-[var(--muted)] mt-1">برای برداشت وجه، یک کارت و شبای متعلق به خودتان اضافه کنید.</p><button onClick={() => setShowAdd(true)} disabled={!ready} className="mt-4 px-4 py-2 rounded-lg bg-[var(--gold)] text-black text-[10px] font-bold disabled:opacity-40">افزودن اولین حساب</button></div> : <div className="p-3 sm:p-4 space-y-3">{cards.map(card => <div key={card.id} className={`rounded-2xl border p-3 sm:p-4 ${card.isDefault ? "border-[var(--gold)]/50 bg-[var(--gold)]/[0.04]" : "border-[var(--border)] bg-[var(--panel-2)]"}`}>
          <div className="flex items-start gap-3"><div className="w-11 h-11 rounded-xl bg-[var(--gold)]/10 grid place-items-center text-xl shrink-0">🏦</div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black">{card.bank}</span>{card.isDefault && <span className="text-[8px] rounded-full px-2 py-1 text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/30">پیش‌فرض</span>}<span className="text-[8px] rounded-full px-2 py-1 text-[var(--green)] bg-[var(--green)]/10">ثبت‌شده آزمایشی</span></div><div className="text-[10px] text-[var(--muted)] font-mono mt-2" dir="ltr">•••• •••• •••• {card.last4}</div><div className="text-[9px] text-[var(--muted)] font-mono mt-1" dir="ltr">{card.iban ? `${card.iban.slice(0, 4)} •••• •••• •••• ${card.iban.slice(-4)}` : "شبا ثبت نشده"}</div></div></div>
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border)]"><button onClick={() => copyIban(card.iban)} disabled={!card.iban} className="h-8 px-3 rounded-lg border border-[var(--border)] text-[9px] font-bold disabled:opacity-40">کپی شبا</button>{!card.isDefault && <button onClick={() => { setDefault(card.id); toast.success("حساب پیش‌فرض تغییر کرد"); }} className="h-8 px-3 rounded-lg border border-[var(--gold)]/30 text-[var(--gold)] text-[9px] font-bold">انتخاب پیش‌فرض</button>}<button onClick={() => setDeleteTarget(card)} className="h-8 px-3 rounded-lg border border-red-500/20 text-red-400 text-[9px] font-bold mr-auto">حذف حساب</button></div>
        </div>)}</div>}
      </section>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[9px] leading-5 text-amber-300">برای امنیت، شماره کامل کارت در مرورگر ذخیره نمی‌شود و فقط چهار رقم پایانی نمایش داده می‌شود. استعلام بانکی و مالکیت حساب در این نسخه شبیه‌سازی شده است؛ پیش از اتصال به سرویس واقعی باید تأیید مالکیت از سمت سرور انجام شود.</div>
      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onAdd={(card) => { addCard(card); setShowAdd(false); toast.success("حساب بانکی اضافه شد"); }} />}
      {deleteTarget && <DeleteCardModal card={deleteTarget} onClose={() => setDeleteTarget(null)} onDelete={() => { removeCard(deleteTarget.id); setDeleteTarget(null); toast.success("حساب بانکی حذف شد"); }} />}
    </div>
  );
}
