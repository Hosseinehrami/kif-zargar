"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/StateViews";

type Session = {
  id: number;
  device: string;
  browser: string;
  platform: string;
  location: string;
  ip: string;
  lastActive: string;
  current?: boolean;
  status: "active" | "idle";
};

const INITIAL_SESSIONS: Session[] = [
  { id: 1, device: "Windows · دسکتاپ", browser: "Chrome 157", platform: "Windows 11", location: "استانبول، ترکیه", ip: "این دستگاه", lastActive: "اکنون", current: true, status: "active" },
  { id: 2, device: "iPhone · موبایل", browser: "Safari", platform: "iOS", location: "تهران، ایران", ip: "185.XX.XX.42", lastActive: "۲ ساعت پیش", status: "active" },
  { id: 3, device: "Android · موبایل", browser: "Chrome Mobile", platform: "Android", location: "کرج، ایران", ip: "5.XX.XX.118", lastActive: "دیروز، ۱۸:۴۰", status: "idle" },
];

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [confirmId, setConfirmId] = useState<number | "others" | null>(null);
  const [notice, setNotice] = useState("");
  const otherCount = useMemo(() => sessions.filter((s) => !s.current).length, [sessions]);

  function terminateConfirmed() {
    if (confirmId === "others") {
      setSessions((items) => items.filter((s) => s.current));
      setNotice("تمام نشست‌های دیگر در حالت نمایشی بسته شدند.");
    } else if (typeof confirmId === "number") {
      setSessions((items) => items.filter((s) => s.id !== confirmId));
      setNotice("نشست انتخاب‌شده در حالت نمایشی بسته شد.");
    }
    setConfirmId(null);
  }

  return (
    <main dir="rtl" className="px-3 sm:px-5 pt-4 pb-10 font-sans max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/settings" aria-label="بازگشت به تنظیمات" className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)]">→</Link>
        <div className="min-w-0">
          <h1 className="font-bold text-lg sm:text-xl">نشست‌های فعال</h1>
          <p className="text-[11px] text-[var(--muted)] mt-1">دستگاه‌هایی که به حساب شما دسترسی دارند</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center text-xl shrink-0">⌁</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">وضعیت امنیت حساب</div>
            <p className="text-[11px] text-[var(--muted)] leading-6 mt-1">نشست‌های واردشده را بررسی کنید. اگر دستگاهی را نمی‌شناسید، نشست آن را ببندید و رمز یا کد امن خود را تغییر دهید.</p>
          </div>
          <span className="text-[10px] font-bold rounded-full px-2.5 py-1 bg-[var(--green)]/10 text-[var(--green)] whitespace-nowrap">{sessions.length} نشست</span>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-bold text-sm">دستگاه‌های متصل</h2>
          <p className="text-[10px] text-[var(--muted)] mt-1">نشست فعلی قابل بستن نیست.</p>
        </div>
        <button onClick={() => setConfirmId("others")} disabled={otherCount === 0} className="h-10 px-4 rounded-xl border border-[var(--red)]/30 text-[var(--red)] text-xs font-bold hover:bg-[var(--red)]/5 disabled:opacity-40 disabled:cursor-not-allowed transition">خروج از تمام دستگاه‌های دیگر</button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <article key={session.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] flex items-center justify-center text-xl shrink-0">{session.device.startsWith("Windows") ? "▣" : session.device.startsWith("iPhone") ? "▯" : "▤"}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm">{session.device}</h3>
                  {session.current && <span className="text-[9px] px-2 py-1 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] font-bold">این دستگاه</span>}
                  <span className={`text-[9px] px-2 py-1 rounded-full font-bold ${session.status === "active" ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--panel-2)] text-[var(--muted)]"}`}>{session.status === "active" ? "فعال" : "غیرفعال"}</span>
                </div>
                <p className="text-[10px] text-[var(--muted)] mt-1" dir="ltr">{session.browser} · {session.platform}</p>
              </div>
              {!session.current && <button onClick={() => setConfirmId(session.id)} className="text-[10px] font-bold text-[var(--red)] border border-[var(--red)]/25 rounded-lg px-3 py-2 hover:bg-[var(--red)]/5 shrink-0">خروج</button>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-3 mt-4 pt-4 border-t border-[var(--border)]">
              <Info label="موقعیت تقریبی" value={session.location} />
              <Info label="آدرس IP" value={session.ip} ltr />
              <Info label="آخرین فعالیت" value={session.lastActive} />
            </div>
          </article>
        ))}
        {sessions.length === 0 && <div className="rounded-2xl border border-dashed border-[var(--border)]"><EmptyState icon="💻" title="نشست فعالی وجود ندارد" description="در حال حاضر دستگاه دیگری به حساب شما متصل نیست." /></div>}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--gold)]/20 bg-[var(--gold)]/5 p-3 text-[10px] text-[var(--muted)] leading-6">
        <span className="font-bold text-[var(--gold)]">توجه:</span> اطلاعات دستگاه‌ها، موقعیت و عملیات خروج در این نسخه آزمایشی هستند و به نشست‌های واقعی حساب متصل نیستند.
      </div>
      {notice && <div role="status" className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-40 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] shadow-xl px-4 py-3 text-xs font-bold">{notice}<button onClick={() => setNotice("")} className="mr-3 text-[var(--gold)]">بستن</button></div>}

      <ConfirmDialog
        open={confirmId !== null}
        title={confirmId === "others" ? "خروج از تمام دستگاه‌های دیگر؟" : "بستن این نشست؟"}
        description={confirmId === "others" ? "تمام نشست‌های دیگر بسته می‌شوند و فقط این دستگاه متصل می‌ماند." : "این دستگاه از حساب شما خارج خواهد شد."}
        confirmText="تأیید خروج"
        variant="danger"
        onConfirm={terminateConfirmed}
        onClose={() => setConfirmId(null)}
      />
    </main>
  );
}

function Info({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return <div className="min-w-0"><div className="text-[9px] text-[var(--muted)] mb-1">{label}</div><div className="text-[10px] font-semibold truncate" dir={ltr ? "ltr" : "rtl"}>{value}</div></div>;
}
