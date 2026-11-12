"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { COMPANY_INFO } from "@/lib/company-info";

const SECTIONS = [
  {
    id: "collection",
    title: "۱. اطلاعاتی که جمع‌آوری می‌کنیم",
    items: [
      "اطلاعات هویتی: نام، نام خانوادگی، کد ملی، تاریخ تولد (برای احراز هویت)",
      "اطلاعات تماس: شماره موبایل، ایمیل، آدرس (برای اطلاع‌رسانی و ارسال)",
      "اطلاعات مالی: شماره شبا، تاریخچه تراکنش‌ها (برای انجام عملیات مالی)",
      "اطلاعات فنی: نوع دستگاه، مرورگر، IP، زمان ورود (برای امنیت)",
      "اطلاعات استفاده: صفحات بازدیدشده، کلیک‌ها، مدت استفاده (برای بهبود سرویس)",
    ],
  },
  {
    id: "usage",
    title: "۲. نحوه استفاده از اطلاعات",
    items: [
      "تکمیل فرآیند احراز هویت و پیشگیری از پول‌شویی",
      "انجام و تسویه تراکنش‌های خرید، فروش و برداشت",
      "ارسال اطلاعیه‌های امنیتی و اعلان‌های مهم حساب",
      "پشتیبانی از کاربر و پاسخ به درخواست‌ها",
      "بهبود کیفیت خدمات و تجربه کاربری",
      "رعایت الزامات قانونی و پاسخ به مراجع قضایی (در صورت درخواست رسمی)",
    ],
  },
  {
    id: "sharing",
    title: "۳. اشتراک‌گذاری با اشخاص ثالث",
    body: `اطلاعات شما هرگز فروخته نمی‌شود. تنها در موارد زیر ممکن است با اشخاص ثالث به اشتراک گذاشته شود: (۱) ارائه‌دهندگان خدمات زیرساختی مانند درگاه پرداخت و سرویس پیامک که تحت قرارداد محرمانگی با ما هستند؛ (۲) در پاسخ به درخواست رسمی مراجع قضایی یا نظارتی؛ (۳) در صورت ادغام یا خرید شرکت، که اطلاعات به خریدار جدید منتقل می‌شود اما کاربران مطلع خواهند شد.`,
  },
  {
    id: "security",
    title: "۴. امنیت داده‌ها",
    items: [
      "استفاده از رمزنگاری SSL/TLS برای تمام ارتباطات",
      "ذخیره‌سازی داده‌های حساس به‌صورت رمزنگاری‌شده",
      "دسترسی محدود به اطلاعات کاربران برای کارمندان مجاز",
      "پایش ۲۴/۷ سیستم‌ها برای شناسایی فعالیت‌های مشکوک",
      "پشتیبان‌گیری منظم و بازیابی در صورت بروز حادثه",
    ],
  },
  {
    id: "rights",
    title: "۵. حقوق کاربران",
    items: [
      "دسترسی به اطلاعات شخصی خود و دریافت نسخه از آن",
      "اصلاح اطلاعات نادرست یا ناقص",
      "درخواست حذف حساب کاربری و اطلاعات مرتبط (با رعایت الزامات قانونی)",
      "لغو اشتراک اعلان‌های تبلیغاتی (بدون تأثیر بر اطلاعیه‌های امنیتی)",
      "اعتراض به نحوه پردازش اطلاعات شخصی",
    ],
  },
  {
    id: "cookies",
    title: "۶. کوکی‌ها و فناوری‌های مشابه",
    body: `پلتفرم از کوکی‌ها و فناوری‌های ذخیره‌سازی محلی (localStorage) برای نگهداری نشست کاربر، به‌خاطر سپردن تنظیمات (مانند تم روشن/تاریک) و بهبود تجربه استفاده می‌کند. کاربر می‌تواند از طریق تنظیمات مرورگر خود کوکی‌ها را مدیریت کند، اما در این صورت ممکن است بخشی از خدمات به‌درستی کار نکند.`,
  },
  {
    id: "changes",
    title: "۷. تغییرات در این سیاست",
    body: `این سیاست‌نامه ممکن است در آینده به‌روزرسانی شود. تغییرات مهم از طریق اعلان در اپلیکیشن یا ایمیل به کاربران اطلاع داده خواهد شد. توصیه می‌شود کاربران به‌طور دوره‌ای این صفحه را مطالعه کنند. تاریخ آخرین به‌روزرسانی در بالای صفحه درج شده است.`,
  },
];

export default function PrivacyPage() {
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
          <h1 className="font-bold text-base sm:text-lg">حریم خصوصی</h1>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">نحوه محافظت از اطلاعات شما</p>
        </div>
      </div>

      {/* هیرو */}
      <div className="rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-4 mb-3 text-center">
        <div className="text-3xl mb-2">🔒</div>
        <div className="text-[11px] font-bold text-[var(--gold)] mb-1">اطلاعات شما امانت است</div>
        <p className="text-[10px] text-[var(--muted)] leading-relaxed">
          ما متعهد به حفاظت از اطلاعات شخصی شما هستیم و آن را تنها برای ارائه‌ی خدمات بهتر استفاده می‌کنیم.
        </p>
      </div>

      {/* اطلاعات نسخه */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-[var(--muted)]">آخرین به‌روزرسانی</div>
          <div className="text-[11px] font-bold text-[var(--text)] mt-0.5">۱۴۰۴/۰۸/۱۵</div>
        </div>
        <div className="text-left">
          <div className="text-[9px] text-[var(--muted)]">نسخه</div>
          <div className="text-[11px] font-bold text-[var(--text)] mt-0.5">۱.۵</div>
        </div>
      </div>

      {/* فهرست */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
        <div className="text-xs font-bold mb-2 flex items-center gap-1.5">
          <span className="text-base">📑</span>
          فهرست مطالب
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-[10.5px] text-[var(--muted)] hover:text-[var(--gold)] py-1.5 transition border-b border-[var(--border)] last:border-0"
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* بخش‌ها */}
      <div className="space-y-2.5">
        {SECTIONS.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 scroll-mt-4"
          >
            <h2 className="text-[11.5px] font-bold text-[var(--gold)] mb-2 flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-[var(--gold)]" />
              {s.title}
            </h2>
            {"body" in s && s.body ? (
              <p className="text-[10.5px] text-[var(--text)]/85 leading-[1.9] text-justify">
                {s.body}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {"items" in s && s.items && s.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-[10.5px] text-[var(--text)]/85 leading-[1.85]">
                    <span className="text-[var(--gold)] shrink-0 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* تماس */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-3 mt-4">
        <div className="flex items-start gap-2">
          <span className="text-base shrink-0">📧</span>
          <div className="flex-1">
            <div className="text-[10.5px] font-bold text-emerald-400 mb-1">سوال یا نگرانی دارید؟</div>
            <div className="text-[9.5px] text-[var(--muted)] leading-relaxed mb-1.5">
              برای هرگونه سوال درباره‌ی حریم خصوصی یا درخواست حذف اطلاعات، با ما تماس بگیرید.
            </div>
            <div className="text-[10px] font-bold text-[var(--gold)]" dir="ltr">
              {COMPANY_INFO.email}
            </div>
          </div>
        </div>
      </div>

      {/* لینک‌ها */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <Link
          href="/about"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2.5 text-center hover:border-[var(--gold)]/40 transition"
        >
          <div className="text-[10.5px] font-bold text-[var(--text)]">درباره ما</div>
        </Link>
        <Link
          href="/terms"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2.5 text-center hover:border-[var(--gold)]/40 transition"
        >
          <div className="text-[10.5px] font-bold text-[var(--text)]">قوانین و مقررات</div>
        </Link>
      </div>
    </div>
  );
}