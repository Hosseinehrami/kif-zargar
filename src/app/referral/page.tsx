"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { format, toFa, toEnDigits } from "@/lib/format";
import { SETTINGS } from "@/lib/settings";

// ==========================================
// داده‌های نمونه
// ==========================================
type InviteStatus = "pending" | "confirmed" | "active";

type Invitee = {
  id: string;
  name: string;
  phone: string;
  joinedAt: string;
  status: InviteStatus;
  signupReward: number;
  tradeCount: number;
  tradeVolume: number;
  commissionEarned: number;
};

const STATUS_MAP: Record<InviteStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "در انتظار تایید",  color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30" },
  confirmed: { label: "تایید شده",        color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/30" },
  active:    { label: "فعال",             color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

export default function ReferralPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { signupReward, inviteeWelcomeReward, commissionRate, minPayout } = SETTINGS.referral;

  // ==========================================
  // 🔑 کد دعوت: اول ارقام فارسی → انگلیسی، بعد فقط عدد
  // ==========================================
  const referralCode = useMemo(() => {
    const phoneNum = toEnDigits(user?.phone || "").replace(/\D/g, "");
    if (phoneNum.length >= 6) {
      return `KZ${phoneNum.slice(-6)}`;
    }

    const nationalId = toEnDigits(user?.nationalId || "").replace(/\D/g, "");
    if (nationalId.length >= 6) {
      return `KZ${nationalId.slice(-6)}`;
    }

    try {
      const saved = localStorage.getItem("kif-referral-code");
      if (saved && /^KZ\d{6}$/.test(saved)) return saved;
      const random = String(Math.floor(100000 + Math.random() * 900000));
      const code = `KZ${random}`;
      localStorage.setItem("kif-referral-code", code);
      return code;
    } catch {
      return "KZ123456";
    }
  }, [user]);

  const referralLink = `https://kifzargar.com/r/${referralCode}`;

  // 🔑 بازگشت: اول back، اگه نبود خانه
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const invitees: Invitee[] = useMemo(() => [
    {
      id: "1", name: "سارا احمدی", phone: "0912***4567", joinedAt: "۱۴۰۴/۰۸/۰۲",
      status: "active", signupReward, tradeCount: 47,
      tradeVolume: 320_000_000, commissionEarned: 192_000,
    },
    {
      id: "2", name: "محمد کریمی", phone: "0935***1234", joinedAt: "۱۴۰۴/۰۸/۰۵",
      status: "active", signupReward, tradeCount: 128,
      tradeVolume: 850_000_000, commissionEarned: 510_000,
    },
    {
      id: "3", name: "نگار رضایی", phone: "0919***7890", joinedAt: "۱۴۰۴/۰۸/۱۰",
      status: "confirmed", signupReward, tradeCount: 0,
      tradeVolume: 0, commissionEarned: 0,
    },
    {
      id: "4", name: "علی موسوی", phone: "0912***3344", joinedAt: "۱۴۰۴/۰۸/۱۲",
      status: "pending", signupReward: 0, tradeCount: 0,
      tradeVolume: 0, commissionEarned: 0,
    },
  ], [signupReward]);

  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const stats = useMemo(() => {
    const totalInvites = invitees.length;
    const activeInvites = invitees.filter((i) => i.status === "active").length;
    const totalSignupReward = invitees.reduce((s, i) => s + i.signupReward, 0);
    const totalCommission = invitees.reduce((s, i) => s + i.commissionEarned, 0);
    const totalEarned = totalSignupReward + totalCommission;
    const totalTradeVolume = invitees.reduce((s, i) => s + i.tradeVolume, 0);
    return { totalInvites, activeInvites, totalSignupReward, totalCommission, totalEarned, totalTradeVolume };
  }, [invitees]);

  const visibleInvitees = showAll ? invitees : invitees.slice(0, 3);

  async function copyCode() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralCode);
      } else {
        const ta = document.createElement("textarea");
        ta.value = referralCode;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function shareInvite() {
    const text = `🪙 با کد دعوت من در کیف زرگر ثبت‌نام کن و ${format(inviteeWelcomeReward)} تومان پاداش بگیر!

کد دعوت: ${referralCode}
لینک ثبت‌نام: ${referralLink}

کیف زرگر — پلتفرم هوشمند سرمایه‌گذاری طلا`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "دعوت به کیف زرگر", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
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
        <div className="flex-1">
          <h1 className="font-bold text-base sm:text-lg">دعوت از دوستان</h1>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">پاداش یک‌باره + کمیسیون مستمر</p>
        </div>
      </div>

      {/* کارت هیرو */}
      <div className="relative rounded-2xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/15 via-[var(--gold)]/5 to-transparent p-4 mb-3 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[var(--gold)]/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] text-[var(--gold)] font-bold">کد دعوت اختصاصی شما</div>
              <div className="text-[9px] text-[var(--muted)] mt-0.5">با هر دعوت، دو منبع درآمد داری</div>
            </div>
            <div className="text-3xl">🎁</div>
          </div>

          <div className="rounded-xl bg-[var(--bg)]/60 backdrop-blur border border-[var(--gold)]/30 px-3 py-3 mb-2 flex items-center justify-between gap-2">
            <div className="text-2xl font-black text-[var(--gold)] font-mono tracking-widest text-center flex-1" dir="ltr">
              {referralCode}
            </div>
            <button
              onClick={copyCode}
              className={`shrink-0 h-9 px-3 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1.5 ${
                copied ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90"
              }`}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  کپی شد
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  کپی
                </>
              )}
            </button>
          </div>

          <div className="text-[9px] text-[var(--muted)] font-mono bg-[var(--bg)]/40 rounded-lg px-2 py-1.5 mb-3 truncate text-center" dir="ltr">
            {referralLink}
          </div>

          <button
            onClick={shareInvite}
            className="w-full h-11 rounded-xl bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black font-bold text-xs hover:opacity-90 transition shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            اشتراک‌گذاری لینک دعوت
          </button>
        </div>
      </div>

      {/* دو مدل درآمدی */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">💵</span>
            <span className="text-[9px] font-bold text-sky-400">پاداش یک‌باره</span>
          </div>
          <div className="text-[15px] font-black text-sky-400 leading-tight">
            {format(signupReward)} <span className="text-[9px] font-normal text-[var(--muted)]">تومان</span>
          </div>
          <div className="text-[9px] text-[var(--muted)] leading-relaxed mt-1">
            بعد از احراز هویت دعوت‌شده
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">📈</span>
            <span className="text-[9px] font-bold text-emerald-400">کمیسیون مستمر</span>
          </div>
          <div className="text-[15px] font-black text-emerald-400 leading-tight">
            {toFa(String(commissionRate * 100))}٪ <span className="text-[9px] font-normal text-[var(--muted)]">از کارمزد</span>
          </div>
          <div className="text-[9px] text-[var(--muted)] leading-relaxed mt-1">
            از هر خرید و فروش دعوت‌شده
          </div>
        </div>
      </div>

      {/* آمار اصلی */}
      <div className="rounded-2xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-3 mb-3">
        <div className="text-[10px] text-[var(--gold)] font-bold mb-2 flex items-center gap-1.5">
          <span>💰</span> مجموع درآمد شما از دعوت‌ها
        </div>
        <div className="text-2xl font-black text-[var(--gold)] mb-3">
          {format(stats.totalEarned)} <span className="text-xs font-normal text-[var(--muted)]">تومان</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[var(--bg)]/50 rounded-lg p-2 border border-sky-500/20">
            <div className="text-[8.5px] text-sky-400 mb-0.5">از پاداش ثبت‌نام</div>
            <div className="text-[11px] font-bold text-sky-400">{format(stats.totalSignupReward)} ت</div>
          </div>
          <div className="bg-[var(--bg)]/50 rounded-lg p-2 border border-emerald-500/20">
            <div className="text-[8.5px] text-emerald-400 mb-0.5">از کمیسیون معاملات</div>
            <div className="text-[11px] font-bold text-emerald-400">{format(stats.totalCommission)} ت</div>
          </div>
        </div>
        {stats.totalCommission >= minPayout && (
          <button className="w-full mt-2 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/25 transition">
            درخواست برداشت کمیسیون
          </button>
        )}
      </div>

      {/* آمار فرعی */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2.5 text-center">
          <div className="text-[9px] text-[var(--muted)] mb-1">کل دعوت‌ها</div>
          <div className="text-lg font-black text-[var(--text)]">{toFa(String(stats.totalInvites))}</div>
          <div className="text-[8.5px] text-[var(--muted)] mt-0.5">نفر</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-2.5 text-center">
          <div className="text-[9px] text-emerald-400 mb-1">فعال</div>
          <div className="text-lg font-black text-emerald-400">{toFa(String(stats.activeInvites))}</div>
          <div className="text-[8.5px] text-[var(--muted)] mt-0.5">معامله‌گر</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-2.5 text-center">
          <div className="text-[9px] text-amber-400 mb-1">حجم معاملات</div>
          <div className="text-[10px] font-black text-amber-400">{format(stats.totalTradeVolume)}</div>
          <div className="text-[8.5px] text-[var(--muted)] mt-0.5">تومان</div>
        </div>
      </div>

      {/* راهنما */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
        <div className="text-xs font-bold mb-3 flex items-center gap-1.5">
          <span className="text-base">✨</span>
          چطور درآمد کسب می‌کنی؟
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sm">🔗</div>
            <div className="flex-1">
              <div className="text-[11px] font-bold">۱. لینک دعوت رو بفرست</div>
              <div className="text-[9.5px] text-[var(--muted)] mt-0.5 leading-relaxed">دوستت با کد تو ثبت‌نام می‌کنه</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sm">📱</div>
            <div className="flex-1">
              <div className="text-[11px] font-bold">۲. احراز هویت می‌کنه</div>
              <div className="text-[9.5px] text-[var(--muted)] mt-0.5 leading-relaxed">
                <span className="text-sky-400 font-bold">{format(signupReward)} تومان</span> به کیف پول تو اضافه می‌شه
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm">📈</div>
            <div className="flex-1">
              <div className="text-[11px] font-bold">۳. شروع به معامله می‌کنه</div>
              <div className="text-[9.5px] text-[var(--muted)] mt-0.5 leading-relaxed">
                <span className="text-emerald-400 font-bold">{toFa(String(commissionRate * 100))}٪ از کارمزد</span> هر معامله‌ش به تو می‌رسه — مادام‌العمر
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* لیست دعوت‌شدگان */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-xs font-bold">دعوت‌شدگان</div>
          <div className="text-[10px] text-[var(--muted)]">{toFa(String(invitees.length))} نفر</div>
        </div>

        {invitees.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-40">👥</div>
            <div className="text-[11px] text-[var(--muted)]">هنوز کسی رو دعوت نکردی</div>
            <div className="text-[9.5px] text-[var(--muted)] mt-1">اولین دعوتت رو بفرست و درآمدت رو شروع کن</div>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleInvitees.map((inv) => {
              const s = STATUS_MAP[inv.status];
              return (
                <div key={inv.id} className="p-2.5 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] font-bold text-sm shrink-0">
                      {inv.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate">{inv.name}</div>
                      <div className="text-[9px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">{inv.phone}</div>
                    </div>
                    <div className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${s.color} ${s.bg} ${s.border}`}>
                      {s.label}
                    </div>
                  </div>

                  {inv.status === "active" && (
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[var(--border)]">
                      <div className="text-center">
                        <div className="text-[8px] text-[var(--muted)]">معاملات</div>
                        <div className="text-[10px] font-bold text-[var(--text)]">{toFa(String(inv.tradeCount))}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] text-[var(--muted)]">حجم</div>
                        <div className="text-[10px] font-bold text-[var(--text)]">{format(inv.tradeVolume)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] text-emerald-400">کمیسیون</div>
                        <div className="text-[10px] font-bold text-emerald-400">+{format(inv.commissionEarned)}</div>
                      </div>
                    </div>
                  )}

                  {inv.status === "confirmed" && inv.signupReward > 0 && (
                    <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                      <div className="text-[8.5px] text-[var(--muted)]">پاداش ثبت‌نام</div>
                      <div className="text-[10px] font-bold text-sky-400">+{format(inv.signupReward)} ت</div>
                    </div>
                  )}

                  {inv.status === "pending" && (
                    <div className="pt-2 border-t border-[var(--border)] text-[8.5px] text-amber-400 text-center">
                      در انتظار احراز هویت
                    </div>
                  )}
                </div>
              );
            })}

            {invitees.length > 3 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full h-8 rounded-lg border border-[var(--border)] text-[10.5px] font-bold text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/40 transition"
              >
                {showAll ? "نمایش کمتر" : `نمایش همه (${toFa(String(invitees.length))} نفر)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* قوانین */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3">
        <div className="text-xs font-bold mb-2 flex items-center gap-1.5">
          <span className="text-base">📋</span>
          قوانین پاداش
        </div>
        <ul className="space-y-1.5 text-[10px] text-[var(--muted)] leading-relaxed">
          <li className="flex gap-1.5">
            <span className="text-[var(--gold)] shrink-0">•</span>
            <span>پاداش یک‌باره پس از احراز هویت کامل دعوت‌شده واریز می‌شه.</span>
          </li>
          <li className="flex gap-1.5">
            <span className="text-[var(--gold)] shrink-0">•</span>
            <span>کمیسیون معاملات به‌صورت آنی از کارمزد هر معامله محاسبه و به کیف پول شما اضافه می‌شه.</span>
          </li>
          <li className="flex gap-1.5">
            <span className="text-[var(--gold)] shrink-0">•</span>
            <span>حداقل مبلغ برداشت کمیسیون {format(minPayout)} تومانه.</span>
          </li>
          <li className="flex gap-1.5">
            <span className="text-[var(--gold)] shrink-0">•</span>
            <span>هر کاربر فقط یک‌بار با کد دعوت ثبت‌نام می‌تونه بکنه.</span>
          </li>
          <li className="flex gap-1.5">
            <span className="text-[var(--gold)] shrink-0">•</span>
            <span>استفاده از روش‌های تقلبی موجب لغو پاداش و مسدودی حساب می‌شه.</span>
          </li>
          <li className="flex gap-1.5">
            <span className="text-[var(--gold)] shrink-0">•</span>
            <span>کیف زرگر حق تغییر نرخ کمیسیون را با اطلاع‌رسانی قبلی محفوظ می‌داند.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}