// ==========================================
// توابع مشترک فرمت‌گذاری — قابل استفاده در همه‌ی صفحات
// ==========================================

/** عدد رو با جداکننده‌ی هزارگان فارسی برمی‌گردونه */
export const format = (n: number): string =>
  Math.round(n).toLocaleString("fa-IR");

/** ارقام فارسی/عربی رو به انگلیسی تبدیل می‌کنه (برای input) */
export const toEnDigits = (s: string): string =>
  s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

/** ارقام انگلیسی رو به فارسی تبدیل می‌کنه (برای نمایش) */
export const toFa = (s: string): string =>
  s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/\./g, "٫");

/** نمایش مبلغ به تومان */
export const formatToman = (n: number): string => `${format(n)} تومان`;

/** نمایش مقدار طلا با واحد */
export const formatGold = (
  n: number,
  unit: string = "گرم",
  decimals: number = 3
): string => `${toFa(n.toFixed(decimals))} ${unit}`;

/** نمایش درصد */
export const formatPercent = (n: number, decimals: number = 1): string =>
  `${toFa(n.toFixed(decimals))}٪`;