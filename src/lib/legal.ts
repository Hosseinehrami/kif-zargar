// ==========================================
// اطلاعات نسخه‌ی قوانین — هر تغییر، نسخه رو بالا ببر
// ==========================================
export const TERMS_VERSION = "2.1";
export const TERMS_UPDATED_AT = "۱۴۰۴/۰۸/۱۵";
export const TERMS_SIGNATURE_SECRET = "KFZ_LEGAL_SIG_2025_V2";

// ==========================================
// خلاصه‌ی ۶ بند اصلی — برای نمایش قبل از تایید
// ==========================================
export const TERMS_SUMMARY = [
  { icon: "🛡", title: "امنیت حساب", desc: "حفظ رمز عبور، PIN و اطلاعات ورود با شماست." },
  { icon: "📊", title: "معاملات قطعی", desc: "پس از تأیید نهایی معامله، لغو یا بازگشت ممکن نیست." },
  { icon: "💰", title: "مالکیت طلا", desc: "طلا با سریال اختصاصی به نام شما ثبت می‌شود." },
  { icon: "🔐", title: "احراز هویت", desc: "برای تمام خدمات، احراز هویت الزامی است." },
  { icon: "📜", title: "تغییر قوانین", desc: "تغییرات با اطلاع‌رسانی قبلی و نسخه‌بندی اعمال می‌شود." },
  { icon: "⚖️", title: "حل اختلاف", desc: "مرجع صالح، دادگاه‌های عمومی و انقلاب تهران است." },
] as const;

// ==========================================
// تولید کد تأیید ۶ رقمی (شبیه‌سازی SMS)
// ==========================================
export function generateTermsVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ==========================================
// تولید امضای دیجیتال از روی: phone + version + timestamp
// ==========================================
export function generateTermsSignature(
  phone: string,
  version: string,
  timestamp: number
): string {
  const payload = `${phone}|${version}|${timestamp}|${TERMS_SIGNATURE_SECRET}`;

  // دو هش FNV-1a با دانه‌های متفاوت — خروجی ۳۲ کاراکتری
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c ^ 0xa5;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }

  const s1 = h1.toString(16).padStart(8, "0").toUpperCase();
  const s2 = h2.toString(16).padStart(8, "0").toUpperCase();

  return `SIG-${s1.slice(0, 4)}-${s1.slice(4, 8)}-${s2.slice(0, 4)}`;
}