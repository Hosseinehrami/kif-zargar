"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      className="h-[calc(100dvh-130px)] flex items-center justify-center bg-[var(--bg)] px-6"
      dir="rtl"
    >
      <div className="text-center max-w-md">
        {/* عدد ۴۰۴ بزرگ */}
        <div className="relative mb-6">
          <div className="text-[100px] sm:text-[140px] font-black leading-none text-[var(--gold)]/10 font-mono select-none">
            ۴۰۴
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--gold)]/15 border-2 border-[var(--gold)]/40 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--gold)]"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="12" />
                <line x1="11" y1="16" x2="11.01" y2="16" />
              </svg>
            </div>
          </div>
        </div>

        {/* متن */}
        <h1 className="text-lg font-bold text-[var(--text)] mb-2">
          صفحه یافت نشد
        </h1>
        <p className="text-[12px] text-[var(--muted)] leading-relaxed mb-6">
          آدرسی که دنبالش هستید وجود ندارد یا حذف شده است.
        </p>

        {/* دکمه‌ها */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex-1 h-10 rounded-xl bg-[var(--gold)] text-black text-[11px] font-bold hover:bg-[var(--gold)]/90 transition flex items-center justify-center gap-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            صفحه اصلی
          </button>
          <button
            onClick={() => router.back()}
            className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] text-[11px] font-bold hover:bg-[var(--panel-2)] transition flex items-center justify-center gap-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            بازگشت
          </button>
        </div>

        {/* لینک‌های مفید */}
        <div className="pt-4 border-t border-[var(--border)]">
          <div className="text-[10px] text-[var(--muted)] mb-2">شاید این صفحات مفید باشند:</div>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "بازار", href: "/market" },
              { label: "کیف پول", href: "/wallet" },
              { label: "معاملات", href: "/trade" },
              { label: "پشتیبانی", href: "/support" },
            ].map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--panel)] text-[10px] text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/40 transition"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* برند */}
        <div className="mt-8 text-[9px] text-[var(--muted)] opacity-60">
          کیف زرگر · مدیریت هوشمند دارایی طلا
        </div>
      </div>
    </div>
  );
}