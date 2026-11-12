"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { COMPANY_INFO } from "@/lib/company-info";

const SECTIONS = [
  {
    id: "acceptance",
    title: "۱. پذیرش قوانین",
    body: `با ثبت‌نام و استفاده از پلتفرم ${COMPANY_INFO.brandName}، شما تأیید می‌کنید که این قوانین را به‌طور کامل مطالعه کرده و می‌پذیرید. استفاده از خدمات به معنای پذیرش بی‌قید و شرط این شرایط است. در صورت عدم موافقت، لطفاً از خدمات استفاده نکنید.`,
  },
  {
    id: "eligibility",
    title: "۲. شرایط استفاده",
    body: `استفاده از پلتفرم تنها برای اشخاص حقیقی بالای ۱۸ سال و دارای اهلیت قانونی مجاز است. کاربر متعهد می‌شود اطلاعات صحیح، کامل و به‌روز ارائه دهد. هرگونه سوءاستفاده از حساب کاربری، تلاش برای نفوذ، یا اقدام خلاف قوانین جمهوری اسلامی ایران موجب تعلیق فوری حساب و پیگرد قانونی خواهد شد.`,
  },
  {
    id: "kyc",
    title: "۳. احراز هویت",
    body: `برای استفاده از تمامی خدمات (خرید، فروش، برداشت فیزیکی و انتقال)، کاربر باید مراحل احراز هویت را تکمیل نماید. مدارک مورد نیاز شامل شماره موبایل، کد ملی و در صورت لزوم، مدارک تکمیلی است. اطلاعات هویتی نزد پلتفرم محرمانه باقی می‌ماند و تنها در صورت الزام قانونی با مراجع ذیصلاح به اشتراک گذاشته می‌شود.`,
  },
  {
    id: "trading",
    title: "۴. معاملات و کارمزد",
    body: `تمامی معاملات در پلتفرم بر اساس قیمت لحظه‌ای بازار انجام می‌شود. کارمزد خرید و فروش، هزینه ضرب، بیمه و هزینه‌های برداشت فیزیکی به‌صورت شفاف در صفحه معامله نمایش داده می‌شود. قیمت‌ها با نوسانات بازار ممکن است در لحظه تغییر کند. پس از تأیید نهایی معامله، امکان لغو یا بازگشت وجود ندارد.`,
  },
  {
    id: "responsibility",
    title: "۵. مسئولیت‌ها",
    body: `کاربر مسئول حفظ رمز عبور، کد امن (PIN) و اطلاعات حساب خود است. هرگونه تراکنش انجام‌شده با استفاده از اطلاعات ورود کاربر، معتبر تلقی می‌شود. پلتفرم مسئولیتی در قبال خسارات ناشی از افشای اطلاعات توسط کاربر، حملات فیشینگ یا دسترسی غیرمجاز به دلیل سهل‌انگاری کاربر ندارد. همچنین پلتفرم مسئولیتی در قبال نوسانات قیمت طلا و ضررهای ناشی از آن ندارد.`,
  },
  {
    id: "termination",
    title: "۶. تعلیق و لغو حساب",
    body: `پلتفرم محفوظ می‌دارد در صورت مشاهده هرگونه فعالیت مشکوک، نقض قوانین، ارائه اطلاعات نادرست یا به درخواست مراجع قانونی، حساب کاربری را موقتاً تعلیق یا به‌طور دائم لغو نماید. در صورت لغو حساب، دارایی کاربر پس از کسر هزینه‌های قانونی به وی بازگردانده می‌شود.`,
  },
  {
    id: "dispute",
    title: "۷. حل اختلاف",
    body: `در صورت بروز هرگونه اختلاف بین کاربر و پلتفرم، طرفین ابتدا تلاش می‌کنند از طریق مذاکره و میانجی‌گری اختلاف را حل کنند. در صورت عدم توافق، مرجع صالح، دادگاه‌های عمومی و انقلاب تهران خواهد بود. این قوانین تابع قوانین جمهوری اسلامی ایران است.`,
  },
  {
    id: "changes",
    title: "۸. تغییرات قوانین",
    body: `پلتفرم محفوظ می‌دارد این قوانین را در هر زمان تغییر دهد. تغییرات از طریق اعلان در اپلیکیشن یا ایمیل به کاربر اطلاع داده می‌شود. استفاده‌ی مستمر کاربر پس از اعمال تغییرات به معنای پذیرش نسخه‌ی جدید است. توصیه می‌شود کاربران به‌طور دوره‌ای این صفحه را مطالعه کنند.`,
  },
];

export default function TermsPage() {
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
          <h1 className="font-bold text-base sm:text-lg">قوانین و مقررات</h1>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">شرایط استفاده از خدمات</p>
        </div>
      </div>

      {/* هشدار */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-base shrink-0">⚠️</span>
          <div className="text-[10px] text-amber-400 leading-relaxed">
            لطفاً این قوانین را به‌طور کامل مطالعه کنید. ثبت‌نام و استفاده از خدمات به معنای پذیرش کامل این شرایط است.
          </div>
        </div>
      </div>

      {/* اطلاعات نسخه */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-[var(--muted)]">آخرین به‌روزرسانی</div>
          <div className="text-[11px] font-bold text-[var(--text)] mt-0.5">۱۴۰۴/۰۸/۱۵</div>
        </div>
        <div className="text-left">
          <div className="text-[9px] text-[var(--muted)]">نسخه</div>
          <div className="text-[11px] font-bold text-[var(--text)] mt-0.5">۲.۱</div>
        </div>
      </div>

      {/* فهرست مطالب */}
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
            <p className="text-[10.5px] text-[var(--text)]/85 leading-[1.9] text-justify">
              {s.body}
            </p>
          </section>
        ))}
      </div>

      {/* پانوشت */}
      <div className="rounded-xl bg-[var(--panel-2)] border border-[var(--border)] p-3 mt-4">
        <div className="text-[10px] text-[var(--muted)] leading-relaxed text-center">
          در صورت داشتن هرگونه سؤال درباره این قوانین، با پشتیبانی {COMPANY_INFO.brandName} تماس بگیرید.
        </div>
        <div className="mt-2 text-[10px] text-center font-bold text-[var(--gold)]" dir="ltr">
          {COMPANY_INFO.email}
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
          href="/privacy"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2.5 text-center hover:border-[var(--gold)]/40 transition"
        >
          <div className="text-[10.5px] font-bold text-[var(--text)]">حریم خصوصی</div>
        </Link>
      </div>
    </div>
  );
}