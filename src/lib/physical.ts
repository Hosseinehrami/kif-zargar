import { SETTINGS } from "@/lib/settings";

// ==========================================
// قوانین و ثابت‌ها
// ==========================================
export const MIN_WEIGHT = 1;
export const ADMIN_APPROVAL_THRESHOLD = 20;
export const MIN_NOTE_LENGTH = 10;

export const MINTING_FEE_RATE = SETTINGS.fees.mintingFeeRate;
export const INSURANCE_RATE = SETTINGS.fees.insuranceRate;
export const COURIER_FEE = SETTINGS.fees.courierFee;
export const ENGRAVING_FEE = SETTINGS.fees.engravingFee;

// ==========================================
// انواع
// ==========================================
export type AssetType = "bar" | "coin" | "melted";
export type CoinType = "full" | "half" | "quarter" | "gram";
export type DeliveryMethod = "branch" | "agency" | "courier";

export type Location = {
  id: string;
  type: "branch" | "agency";
  city: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  rating?: number;
  stock?: string;
};

// ==========================================
// دارایی‌ها
// ==========================================
export const ASSET_OPTIONS = {
  bar: {
    label: "شمش طلا",
    icon: "🧱",
    unit: "گرم",
    sizes: [1, 5, 10, 20, 50, 100],
    available: 12.45,
  },
  coin: {
    label: "سکه",
    icon: "🪙",
    unit: "عدد",
    available: 0, // از COIN_TYPES خونده می‌شه
  },
  melted: {
    label: "آب‌شده",
    icon: "🔥",
    unit: "گرم",
    sizes: undefined,
    available: 12.45,
  },
} as const;

export const COIN_TYPES = {
  full:    { label: "تمام", weight: 8.13, available: 2, price: 195_000_000 },
  half:    { label: "نیم",  weight: 4.06, available: 1, price: 98_000_000  },
  quarter: { label: "ربع",  weight: 2.03, available: 1, price: 52_000_000  },
  gram:    { label: "گرمی", weight: 1.00, available: 3, price: 24_000_000  },
} as const;

// ==========================================
// مکان‌های تحویل
// ==========================================
export const LOCATIONS: Location[] = [
  { id: "b1", type: "branch", city: "تهران", name: "شعبه مرکزی", address: "خیابان ولیعصر، پلاک ۱۲", phone: "۰۲۱-۹۱۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۰۰" },
  { id: "b2", type: "branch", city: "تهران", name: "شعبه بازار", address: "بازار بزرگ، پاساژ زرگرها", phone: "۰۲۱-۹۱۰۰۰۰۰۱", hours: "۹:۰۰ - ۱۷:۰۰" },
  { id: "b3", type: "branch", city: "مشهد", name: "شعبه احمدآباد", address: "بلوار احمدآباد، نبش چهارراه", phone: "۰۵۱-۳۸۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۰۰" },
  { id: "b4", type: "branch", city: "اصفهان", name: "شعبه چهارباغ", address: "چهارباغ بالا، مجتمع تجاری", phone: "۰۳۱-۳۲۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۰۰" },
  { id: "a1", type: "agency", city: "تهران", name: "طلافروشی زرین", address: "خیابان ولیعصر، کوچه بهار، پلاک ۴۵", phone: "۰۲۱-۸۸۷۷۶۶۵۵", hours: "۹:۳۰ - ۱۹:۰۰", rating: 4.8, stock: "۴۵ گرم موجود" },
  { id: "a2", type: "agency", city: "تهران", name: "گالری آریا", address: "میدان ونک، خیابان گاندی", phone: "۰۲۱-۸۸۶۶۵۵۴۴", hours: "۱۰:۰۰ - ۲۰:۰۰", rating: 4.6, stock: "۲۰ گرم موجود" },
  { id: "a3", type: "agency", city: "شیراز", name: "طلافروشی پارس", address: "خیابان زند، پاساژ آریا", phone: "۰۷۱-۳۲۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۳۰", rating: 4.9, stock: "۳۰ گرم موجود" },
  { id: "a4", type: "agency", city: "کرج", name: "طلا و جواهر نگین", address: "بلوار طالقانی، پلاک ۸", phone: "۰۲۶-۳۴۰۰۰۰۰۰", hours: "۹:۰۰ - ۱۸:۰۰", rating: 4.5, stock: "۱۵ گرم موجود" },
];

export const DEFAULT_COURIER_ADDRESS = "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳";

// ==========================================
// توابع رسید
// ==========================================
const RECEIPT_SECRET = "KFZ_2025_SECRET";

export function generateReceiptHash(data: Record<string, unknown>): string {
  const payload = JSON.stringify(data) + RECEIPT_SECRET;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  let hash2 = hash;
  for (let i = 0; i < payload.length; i++) {
    hash2 ^= payload.charCodeAt(i) ^ 0xa5;
    hash2 = Math.imul(hash2, 0x01000193) >>> 0;
  }
  return (hash.toString(16).padStart(8, "0") + hash2.toString(16).padStart(8, "0")).toUpperCase();
}

export function generateVerificationCode(hash: string): string {
  return `KFZ-${hash.slice(0, 4)}-${hash.slice(8, 12)}`;
}

export function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateSerialNumber(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 999999) + 1).padStart(6, "0");
  return `KZ-AU-${year}-${num}`;
}

export function generateQRPattern(seed: string, size = 21): boolean[][] {
  const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;

  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (ox + x < size && oy + y < size) grid[oy + y][ox + x] = isBorder || isCenter;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) continue;
      if (x < 8 && y < 8) continue;
      if (x >= size - 8 && y < 8) continue;
      if (x < 8 && y >= size - 8) continue;
      s = (s * 1103515245 + 12345) >>> 0;
      grid[y][x] = (s & 1) === 1;
    }
  }
  return grid;
}