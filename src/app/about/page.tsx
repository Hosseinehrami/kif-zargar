"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toFa } from "@/lib/format";
import { COMPANY_INFO } from "@/lib/company-info";

const FEATURES = [
  {
    icon: "🛡",
    title: "امنیت در سطح بانکی",
    desc: "احراز هویت چند مرحله‌ای، رمزنگاری داده و نظارت ۲۴/۷",
  },
  {
    icon: "⚡",
    title: "معاملات آنی",
    desc: "خرید و فروش طلا در هر ساعت شبانه‌روز، بدون تعطیلی",
  },
  {
    icon: "📦",
    title: "تحویل فیزیکی",
    desc: "دریافت شمش و سکه درب منزل یا شعب حضوری",
  },
  {
    icon: "🔐",
    title: "مالکیت واقعی",
    desc: "طلای شما با سریال اختصاصی به نام شما ثبت می‌شود",
  },
  {
    icon: "💎",
    title: "شفافیت کامل",
    desc: "قیمت‌ها لحظه‌ای، کارمزد شفاف، بدون هزینه پنهان",
  },
  {
    icon: "🌐",
    title: "پشتیبانی همیشگی",
    desc: "تیم پاسخگو از طریق چت، تلفن و ایمیل",
  },
];

const STATS = [
  { value: 45, suffix: "هزار", label: "کاربر فعال" },
  { value: 320, suffix: "تن", label: "حجم معاملات" },
  { value: 5, suffix: "سال", label: "تجربه در بازار طلا" },
];

export default function AboutPage() {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <div className="px-2.5 sm:px-4 pt-3 pb-8">
      {/* هدر */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goBack}
          className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition"
          aria-label="بازگشت"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <div>
          <h1 className="font-bold text-base sm:text-lg">درباره ما</h1>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">{COMPANY_INFO.brandName}</p>
        </div>
      </div>

      {/* هیرو */}
      <div className="relative rounded-2xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/15 via-[var(--gold)]/5 to-transparent p-6 mb-3 overflow-hidden text-center">
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[var(--gold)]/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/25 to-[var(--gold)]/5 flex items-center justify-center text-3xl font-black text-[var(--gold)] mb-3 shadow-xl shadow-[var(--gold)]/20">
            ک
          </div>
          <div className="text-lg font-black text-[var(--gold)] font-serif italic tracking-[0.2em] mb-1">
            KIFE ZARGAR
          </div>
          <div className="text-[11px] text-[var(--muted)] tracking-wider mb-3">
            پلتفرم هوشمند سرمایه‌گذاری طلا
          </div>
          <p className="text-[11px] text-[var(--text)]/80 leading-relaxed max-w-md mx-auto">
            ما با هدف دموکراتیزه کردن سرمایه‌گذاری طلا در ایران، امکان خرید و فروش امن، سریع و شفاف این دارایی ارزشمند را برای همه فراهم کرده‌ایم.
          </p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {STATS.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-center"
          >
            <div className="text-lg font-black text-[var(--gold)]">
              {toFa(String(s.value))}
              <span className="text-[9px] font-normal text-[var(--muted)] mr-0.5">{s.suffix}</span>
            </div>
            <div className="text-[9px] text-[var(--muted)] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ماموریت */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3">
        <div className="text-xs font-bold mb-2 flex items-center gap-1.5">
          <span className="text-base">🎯</span>
          ماموریت ما
        </div>
        <p className="text-[11px] text-[var(--text)]/85 leading-relaxed">
          در بازار پرنوسان اقتصادی، طلا همیشه پناهگاه امن سرمایه بوده. ما معتقدیم هر ایرانی باید بتونه به راحتی و با کمترین مبلغ، بخشی از دارایی خودش رو به طلا اختصاص بده. کیف زرگر با حذف موانع سنتی مثل نیاز به مراجعه حضوری، حداقل مبلغ بالا و کارمزدهای نامشخص، این امکان رو برای همه فراهم کرده.
        </p>
      </div>

      {/* ویژگی‌ها */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3">
        <div className="text-xs font-bold mb-3 flex items-center gap-1.5">
          <span className="text-base">✨</span>
          چرا کیف زرگر؟
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-lg bg-[var(--panel-2)] border border-[var(--border)] p-3">
              <div className="flex items-start gap-2">
                <span className="text-xl shrink-0">{f.icon}</span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[var(--text)] mb-0.5">{f.title}</div>
                  <div className="text-[9.5px] text-[var(--muted)] leading-relaxed">{f.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* اطلاعات شرکت */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 mb-3">
        <div className="text-xs font-bold mb-3 flex items-center gap-1.5">
          <span className="text-base">🏢</span>
          اطلاعات حقوقی شرکت
        </div>
        <div className="space-y-2 text-[10.5px]">
          {[
            { label: "نام برند", value: COMPANY_INFO.brandName },
            { label: "نام حقوقی", value: COMPANY_INFO.legalName },
            { label: "شناسه ملی", value: COMPANY_INFO.nationalId, ltr: true },
            { label: "کد اقتصادی", value: COMPANY_INFO.economicCode, ltr: true },
            { label: "شماره ثبت", value: COMPANY_INFO.registrationNumber, ltr: true },
            { label: "تاریخ ثبت", value: COMPANY_INFO.registrationDate },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-2 border-b border-[var(--border)] last:border-0 pb-2 last:pb-0">
              <span className="text-[var(--muted)] shrink-0">{row.label}</span>
              <span
                className="font-bold text-[var(--text)] text-left truncate"
                dir={row.ltr ? "ltr" : "rtl"}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* تماس */}
      <div className="rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/5 to-transparent p-4 mb-3">
        <div className="text-xs font-bold mb-3 flex items-center gap-1.5">
          <span className="text-base">📞</span>
          راه‌های ارتباطی
        </div>
        <div className="space-y-2.5">
          <a href={`tel:${COMPANY_INFO.phone.replace(/\D/g, "")}`} className="flex items-start gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-sm shrink-0">📱</div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-[var(--muted)]">تلفن پشتیبانی</div>
              <div className="text-[11px] font-bold text-[var(--text)] group-hover:text-[var(--gold)] transition" dir="ltr">{COMPANY_INFO.phone}</div>
            </div>
          </a>
          <a href={`mailto:${COMPANY_INFO.email}`} className="flex items-start gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-sm shrink-0">✉️</div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-[var(--muted)]">ایمیل</div>
              <div className="text-[11px] font-bold text-[var(--text)] group-hover:text-[var(--gold)] transition truncate" dir="ltr">{COMPANY_INFO.email}</div>
            </div>
          </a>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-sm shrink-0">📍</div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-[var(--muted)]">آدرس دفتر مرکزی</div>
              <div className="text-[10.5px] text-[var(--text)] leading-relaxed">{COMPANY_INFO.address}</div>
              <div className="text-[9px] text-[var(--muted)] mt-1">کد پستی: {COMPANY_INFO.postalCode}</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-sm shrink-0">🌐</div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-[var(--muted)]">وب‌سایت</div>
              <div className="text-[11px] font-bold text-[var(--text)]" dir="ltr">{COMPANY_INFO.website}</div>
            </div>
          </div>
        </div>
      </div>

      {/* لینک‌های حقوقی */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Link
          href="/terms"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 hover:border-[var(--gold)]/40 transition group"
        >
          <div className="text-base mb-1">📋</div>
          <div className="text-[11px] font-bold text-[var(--text)] group-hover:text-[var(--gold)] transition">
            قوانین و مقررات
          </div>
          <div className="text-[9px] text-[var(--muted)] mt-0.5">شرایط استفاده</div>
        </Link>
        <Link
          href="/privacy"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 hover:border-[var(--gold)]/40 transition group"
        >
          <div className="text-base mb-1">🔒</div>
          <div className="text-[11px] font-bold text-[var(--text)] group-hover:text-[var(--gold)] transition">
            حریم خصوصی
          </div>
          <div className="text-[9px] text-[var(--muted)] mt-0.5">نحوه محافظت از داده‌ها</div>
        </Link>
      </div>

      <div className="text-center text-[9px] text-[var(--muted)] leading-relaxed mt-4">
        © {toFa(String(new Date().getFullYear()))} {COMPANY_INFO.legalName} — تمامی حقوق محفوظ است
        <br />
        نسخه نمایشی ۰.۱
      </div>
    </div>
  );
}