"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("خطای برنامه:", error);
  }, [error]);

  return (
    <div className="h-[calc(100dvh-130px)] flex items-center justify-center bg-[var(--bg)] px-6" dir="rtl">
      <div className="text-center max-w-md">
        {/* آیکون */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[var(--red)]/15 border-2 border-[var(--red)]/40 flex items-center justify-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--red)]"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* متن */}
        <h1 className="text-lg font-bold text-[var(--text)] mb-2">
          خطایی رخ داد
        </h1>
        <p className="text-[12px] text-[var(--muted)] leading-relaxed mb-1">
          متأسفانه در بارگذاری این صفحه مشکلی پیش آمد.
        </p>
        <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-6">
          می‌توانید دوباره تلاش کنید یا به صفحه اصلی برگردید.
        </p>

        {/* جزئیات خطا (فقط در dev) */}
        {process.env.NODE_ENV !== "production" && error.message && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-left">
            <div className="text-[9px] font-bold text-[var(--muted)] mb-1">
              جزئیات فنی (فقط در حالت توسعه):
            </div>
            <div
              className="text-[10px] text-[var(--red)] font-mono break-all leading-relaxed"
              dir="ltr"
            >
              {error.message}
            </div>
            {error.digest && (
              <div className="text-[9px] text-[var(--muted)] font-mono mt-1" dir="ltr">
                Digest: {error.digest}
              </div>
            )}
          </div>
        )}

        {/* دکمه‌ها */}
        <div className="flex gap-2">
          <button
            onClick={reset}
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
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            تلاش مجدد
          </button>
                    <Link
            href="/"
            className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] text-[11px] font-bold hover:bg-[var(--panel-2)] transition flex items-center justify-center"
          >
            صفحه اصلی
          </Link>
        </div>

        {/* راهنما */}
        <div className="mt-6 text-[9.5px] text-[var(--muted)] leading-relaxed">
          اگر مشکل ادامه داشت با پشتیبانی تماس بگیرید
          <div className="font-mono mt-1 text-[var(--gold)]" dir="ltr">
            ۰۲۱-۹۱۰۰۰۰۰۰
          </div>
        </div>
      </div>
    </div>
  );
}