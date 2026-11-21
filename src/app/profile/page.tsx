"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useBankCards } from "@/lib/bank-cards";
import { useToast } from "@/components/ui/Toast";

export default function ProfilePage() {
  const { user, updateProfile, isVerified } = useAuth();
  const { cards, ready } = useBankCards();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate editable profile fields from the authenticated user
    setEmail(user?.email || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate editable profile fields from the authenticated user
    setBirthDate(user?.birthDate || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate editable profile fields from the authenticated user
    setAddress(user?.address || "");
  }, [user]);

  function saveProfile() {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("فرمت ایمیل معتبر نیست");
      return;
    }
    updateProfile({ email: email.trim(), birthDate, address: address.trim() });
    setEditing(false);
    toast.success("اطلاعات پروفایل ذخیره شد");
  }

  const fullName = `${user?.firstName || "کاربر"} ${user?.lastName || "کیف زرگر"}`.trim();
  const fields: { label: string; value: string; locked: boolean; ltr?: boolean }[] = [
    { label: "نام و نام خانوادگی", value: fullName, locked: isVerified },
    { label: "شماره موبایل", value: user?.phone || "—", locked: true, ltr: true },
    { label: "کد ملی", value: user?.nationalId || "ثبت نشده", locked: true, ltr: true },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-lg sm:text-xl font-black">پروفایل کاربری</h1><p className="text-[10px] sm:text-xs text-[var(--muted)] mt-1">مدیریت مشخصات و اطلاعات حساب شما</p></div>
        <Link href="/settings" className="h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[10px] font-bold flex items-center gap-2">⚙ تنظیمات</Link>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 text-[var(--gold)] grid place-items-center text-xl font-black">{user?.firstName?.charAt(0) || "؟"}</div>
          <div className="flex-1 min-w-0"><div className="font-black text-sm sm:text-base truncate">{fullName}</div><div className="text-[10px] text-[var(--muted)] font-mono mt-1" dir="ltr">{user?.phone || "—"}</div></div>
          <span className={`text-[9px] font-bold rounded-full px-2.5 py-1 border ${isVerified ? "text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/30" : "text-amber-400 bg-amber-500/10 border-amber-500/30"}`}>{isVerified ? "احراز هویت‌شده" : "احراز هویت تکمیل نشده"}</span>
        </div>
        {!isVerified && <Link href="/verify" className="mt-4 block rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-[10px] text-amber-300">برای استفاده از تمام امکانات، احراز هویت خود را تکمیل کنید ←</Link>}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2"><div><h2 className="text-xs font-black">اطلاعات هویتی</h2><p className="text-[9px] text-[var(--muted)] mt-1">اطلاعات تأییدشده برای جلوگیری از مغایرت قابل ویرایش نیستند.</p></div><span className="text-lg">🪪</span></div>
        <div className="grid sm:grid-cols-2 gap-3 p-4">
          {fields.map((field) => <div key={field.label} className="rounded-xl bg-[var(--panel-2)] border border-[var(--border)] p-3"><div className="text-[9px] text-[var(--muted)] mb-1.5">{field.label}</div><div className="text-[11px] font-bold" dir={field.ltr ? "ltr" : "rtl"}>{field.value || "—"}</div>{field.locked && <div className="text-[8px] text-[var(--muted)] mt-1">🔒 غیرقابل ویرایش</div>}</div>)}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between"><div><h2 className="text-xs font-black">اطلاعات تکمیلی</h2><p className="text-[9px] text-[var(--muted)] mt-1">ایمیل و اطلاعات تماس اختیاری</p></div><button onClick={() => setEditing(v => !v)} className="text-[10px] font-bold text-[var(--gold)]">{editing ? "لغو ویرایش" : "ویرایش اطلاعات"}</button></div>
        <div className="p-4 grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="block text-[9px] text-[var(--muted)] mb-1.5">ایمیل</span><input disabled={!editing} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] disabled:opacity-70 px-3 text-xs outline-none focus:border-[var(--gold)]" dir="ltr" /></label>
          <label className="block"><span className="block text-[9px] text-[var(--muted)] mb-1.5">تاریخ تولد (اختیاری)</span><input disabled={!editing} type="text" value={birthDate} onChange={e => setBirthDate(e.target.value)} placeholder="مثلاً ۱۳۷۰/۰۵/۱۲" className="w-full h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] disabled:opacity-70 px-3 text-xs outline-none focus:border-[var(--gold)]" /></label>
          <label className="block sm:col-span-2"><span className="block text-[9px] text-[var(--muted)] mb-1.5">نشانی (اختیاری)</span><textarea disabled={!editing} value={address} onChange={e => setAddress(e.target.value)} rows={2} maxLength={300} placeholder="نشانی محل سکونت..." className="w-full rounded-xl bg-[var(--panel-2)] border border-[var(--border)] disabled:opacity-70 p-3 text-xs outline-none focus:border-[var(--gold)] resize-y" /></label>
          {editing && <div className="sm:col-span-2 flex justify-end"><button onClick={saveProfile} className="h-10 px-6 rounded-xl bg-[var(--gold)] text-black text-xs font-black">ذخیره تغییرات</button></div>}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 grid place-items-center text-lg">🏦</div><div className="flex-1"><h2 className="text-xs font-black">حساب‌های بانکی</h2><p className="text-[9px] text-[var(--muted)] mt-1">{ready ? `${cards.length.toLocaleString("fa-IR")} کارت ثبت‌شده` : "در حال بارگذاری..."}</p></div><Link href="/profile/banks" className="text-[10px] font-bold text-[var(--gold)]">مدیریت حساب‌ها ←</Link></div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QuickLink href="/orders" icon="🧾" label="سفارشات من" /><QuickLink href="/reports" icon="▤" label="گزارش فعالیت‌ها" /><QuickLink href="/notifications" icon="🔔" label="اعلان‌ها" /><QuickLink href="/settings/sessions" icon="💻" label="نشست‌های فعال" />
      </div>
      <p className="text-[9px] leading-5 text-[var(--muted)]">این نسخه نمایشی اطلاعات پروفایل را در حافظه محلی مرورگر نگهداری می‌کند. برای استفاده عملیاتی، تغییرات باید از طریق API امن و همراه با تأیید سمت سرور ذخیره شوند.</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return <Link href={href} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 flex items-center gap-2 hover:border-[var(--gold)]/40 transition"><span className="text-base">{icon}</span><span className="text-[10px] font-bold">{label}</span></Link>;
}
