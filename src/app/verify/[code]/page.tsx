"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import ReceiptDisplay from "@/components/ReceiptDisplay";

export default function VerifyCodePage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  return (
    <div className="min-h-dvh bg-[var(--bg)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--gold)] opacity-[0.08] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[var(--gold)] opacity-[0.08] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative" dir="rtl">
        {/* برند */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[var(--gold)] opacity-20 rounded-2xl blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 flex items-center justify-center text-2xl font-black text-[var(--gold)]">
              🔍
            </div>
          </div>
          <div className="mt-4 text-lg font-black text-[var(--gold)] font-serif italic tracking-[0.15em]">
            KIFE ZARGAR
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-1 tracking-widest">
            سامانه استعلام رسیدها
          </div>
        </div>

        {/* نمایش رسید */}
        <ReceiptDisplay code={code} />

        {/* لینک‌های بازگشت */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <Link
            href="/verify"
            className="text-[11px] text-[var(--muted)] hover:text-[var(--gold)] transition"
          >
            استعلام کد دیگر
          </Link>
          <span className="text-[var(--muted)] opacity-30">·</span>
          <Link
            href="/"
            className="text-[11px] text-[var(--muted)] hover:text-[var(--gold)] transition"
          >
            کیف زرگر
          </Link>
        </div>
      </div>
    </div>
  );
}