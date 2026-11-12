"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ⏱ طول عمر نشست: ۲۴ ساعت
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// 🔑 نسخه‌ی قوانین (باید با TERMS_VERSION در legal.ts یکسان باشه)
const CURRENT_TERMS_VERSION = "2.1";

export type KycStatus = "none" | "verified";

export type AuthUser = {
  phone: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  kycStatus: KycStatus;
  securityPin?: string;
  sessionExpiresAt?: number;
  // 👇 جدید — پذیرش قوانین
  termsAcceptedAt?: number;
  termsVersion?: string;
  termsSignature?: string;
};

type VerifyOtpResult = {
  isVerified: boolean;
  hasPin: boolean;
};

type ShahkarResult = {
  success: boolean;
  firstName?: string;
  lastName?: string;
  hasPin?: boolean;
  error?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isVerified: boolean;
  hasPin: boolean;
  isTermsAccepted: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<VerifyOtpResult>;
  verifyShahkar: (nationalId: string) => Promise<ShahkarResult>;
  setPin: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  removePin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  validatePin: (pin: string) => boolean;
  unlockSession: () => void;
  lockSession: () => void;
  isSessionUnlocked: () => boolean;
  getSessionRemaining: () => { hours: number; minutes: number } | null;
  logout: () => void;
  sendTermsCode: () => Promise<{ success: boolean; demoCode?: string; error?: string }>;
  verifyTermsCode: (code: string) => Promise<{ success: boolean; signature?: string; error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "kif-auth";
const UNLOCK_KEY = "kif-unlocked";
const EXPIRED_FLAG = "kif-session-expired";
const TERMS_CODE_KEY = "kif-terms-code";
const TERMS_CODE_TTL = 5 * 60 * 1000; // ۵ دقیقه

async function mockShahkarLookup(phone: string, nationalId: string) {
  await new Promise(r => setTimeout(r, 1500));
  if (!/^\d{10}$/.test(nationalId)) return { success: false, error: "کد ملی باید ۱۰ رقم باشد" };
  if (nationalId.startsWith("0000")) return { success: false, error: "کد ملی با شماره موبایل تطابق ندارد" };
  return { success: true, firstName: "علی", lastName: "رضایی" };
}

// 🔑 تولید امضای دیجیتال (بدون import — محلی)
function generateTermsSignatureLocal(phone: string, version: string, timestamp: number): string {
  const SECRET = "KFZ_LEGAL_SIG_2025_V2";
  const payload = `${phone}|${version}|${timestamp}|${SECRET}`;

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ===== بارگذاری اولیه با بررسی انقضا =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthUser;
        const expired = parsed.sessionExpiresAt && Date.now() > parsed.sessionExpiresAt;

        if (expired) {
          sessionStorage.setItem(EXPIRED_FLAG, "1");
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(UNLOCK_KEY);
        } else {
          setUser(parsed);
          if (!parsed.securityPin) {
            sessionStorage.setItem(UNLOCK_KEY, "1");
          }
        }
      }
    } catch {}
    setIsLoading(false);
  }, []);

  // ===== ذخیره کاربر =====
  useEffect(() => {
    if (isLoading) return;
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user, isLoading]);

  // ===== بررسی انقضا در حین استفاده =====
  useEffect(() => {
    if (!user?.sessionExpiresAt) return;
    const check = () => {
      if (user.sessionExpiresAt && Date.now() > user.sessionExpiresAt) {
        sessionStorage.setItem(EXPIRED_FLAG, "1");
        sessionStorage.removeItem(UNLOCK_KEY);
        setUser(null);
      }
    };
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [user]);

  const sendOtp = async (phone: string) => {
    await new Promise(r => setTimeout(r, 800));
    sessionStorage.setItem("kif-pending-phone", phone);
  };

  // ===== تأیید OTP =====
  const verifyOtp = async (phone: string, code: string): Promise<VerifyOtpResult> => {
    await new Promise(r => setTimeout(r, 800));
    if (code !== "1234") throw new Error("کد وارد شده اشتباه است");

    const sessionExpiresAt = Date.now() + SESSION_DURATION;
    sessionStorage.removeItem(UNLOCK_KEY);

    const existingUser = user && user.phone === phone ? user : null;
    const willBeVerified = existingUser?.kycStatus === "verified" && !!existingUser?.nationalId;
    const willHavePin = !!existingUser?.securityPin;

    if (willBeVerified && !willHavePin) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
    }

    setUser(prev => {
      if (prev && prev.phone === phone) {
        return { ...prev, sessionExpiresAt };
      }
      return {
        phone,
        nationalId: "",
        firstName: "",
        lastName: "",
        kycStatus: "none",
        sessionExpiresAt,
      };
    });

    return { isVerified: willBeVerified, hasPin: willHavePin };
  };

  // ===== استعلام شاهکار =====
  const verifyShahkar = async (nationalId: string): Promise<ShahkarResult> => {
    if (!user?.phone) return { success: false, error: "ابتدا وارد شوید" };

    const result = await mockShahkarLookup(user.phone, nationalId);
    if (result.success && result.firstName && result.lastName) {
      const hasExistingPin = !!user.securityPin;

      setUser(prev => prev ? {
        ...prev,
        nationalId,
        firstName: result.firstName!,
        lastName: result.lastName!,
        kycStatus: "verified",
      } : null);

      if (hasExistingPin) {
        sessionStorage.removeItem(UNLOCK_KEY);
      } else {
        sessionStorage.setItem(UNLOCK_KEY, "1");
      }

      return { success: true, hasPin: hasExistingPin };
    }
    return result;
  };

  // ===== پذیرش قوانین — ارسال کد =====
  const sendTermsCode = async (): Promise<{ success: boolean; demoCode?: string; error?: string }> => {
    if (!user?.phone) return { success: false, error: "ابتدا وارد شوید" };
    await new Promise(r => setTimeout(r, 600));

    const isDev = process.env.NODE_ENV !== "production";
    const code = isDev ? "654321" : String(Math.floor(100000 + Math.random() * 900000));

    try {
      sessionStorage.setItem(
        TERMS_CODE_KEY,
        JSON.stringify({ code, expiresAt: Date.now() + TERMS_CODE_TTL })
      );
    } catch {}

    return { success: true, demoCode: isDev ? code : undefined };
  };

  // ===== پذیرش قوانین — تایید کد و تولید امضا =====
  const verifyTermsCode = async (code: string): Promise<{ success: boolean; signature?: string; error?: string }> => {
    if (!user?.phone) return { success: false, error: "ابتدا وارد شوید" };
    await new Promise(r => setTimeout(r, 700));

    let stored: { code: string; expiresAt: number } | null = null;
    try {
      const raw = sessionStorage.getItem(TERMS_CODE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {}

    const isDev = process.env.NODE_ENV !== "production";
    const isValid =
      (isDev && code === "654321") ||
      (stored && stored.code === code && Date.now() <= stored.expiresAt);

    if (!isValid) {
      return { success: false, error: "کد وارد شده اشتباه یا منقضی شده است" };
    }

    const now = Date.now();
    const signature = generateTermsSignatureLocal(user.phone, CURRENT_TERMS_VERSION, now);

    setUser(prev =>
      prev
        ? {
            ...prev,
            termsAcceptedAt: now,
            termsVersion: CURRENT_TERMS_VERSION,
            termsSignature: signature,
          }
        : null
    );

    try {
      sessionStorage.removeItem(TERMS_CODE_KEY);
    } catch {}

    return { success: true, signature };
  };

  const setPin = async (pin: string) => {
    if (!/^\d{4}$/.test(pin)) throw new Error("کد امن باید ۴ رقم باشد");
    await new Promise(r => setTimeout(r, 400));
    setUser(prev => prev ? { ...prev, securityPin: pin } : null);
    sessionStorage.setItem(UNLOCK_KEY, "1");
  };

  const changePin = async (oldPin: string, newPin: string) => {
    if (!user?.securityPin) return { success: false, error: "کد امنی تنظیم نشده است" };
    if (user.securityPin !== oldPin) return { success: false, error: "کد امن فعلی اشتباه است" };
    if (!/^\d{4}$/.test(newPin)) return { success: false, error: "کد جدید باید ۴ رقم باشد" };
    if (oldPin === newPin) return { success: false, error: "کد جدید با کد فعلی یکسان است" };
    await new Promise(r => setTimeout(r, 400));
    setUser(prev => prev ? { ...prev, securityPin: newPin } : null);
    return { success: true };
  };

  const removePin = async (pin: string) => {
    if (!user?.securityPin) return { success: false, error: "کد امنی تنظیم نشده است" };
    if (user.securityPin !== pin) return { success: false, error: "کد امن اشتباه است" };
    await new Promise(r => setTimeout(r, 400));
    setUser(prev => prev ? { ...prev, securityPin: undefined } : null);
    sessionStorage.setItem(UNLOCK_KEY, "1");
    return { success: true };
  };

  const validatePin = (pin: string) => !!user?.securityPin && user.securityPin === pin;
  const unlockSession = () => sessionStorage.setItem(UNLOCK_KEY, "1");
  const lockSession = () => sessionStorage.removeItem(UNLOCK_KEY);
  const isSessionUnlocked = () => sessionStorage.getItem(UNLOCK_KEY) === "1";

  const getSessionRemaining = () => {
    if (!user?.sessionExpiresAt) return null;
    const remain = user.sessionExpiresAt - Date.now();
    if (remain <= 0) return null;
    return {
      hours: Math.floor(remain / 3600000),
      minutes: Math.floor((remain % 3600000) / 60000),
    };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(UNLOCK_KEY);
    sessionStorage.removeItem("kif-pending-phone");
    sessionStorage.removeItem(TERMS_CODE_KEY);
  };

  const isLoggedIn = !!user?.phone;
  const isVerified = user?.kycStatus === "verified" && !!user?.nationalId;
  const hasPin = !!user?.securityPin;
  // 👇 پذیرش قوانین — هم باید ثبت شده باشه، هم نسخه‌ش با نسخه‌ی فعلی یکسان باشه
  const isTermsAccepted =
    !!user?.termsAcceptedAt && user?.termsVersion === CURRENT_TERMS_VERSION;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn,
      isVerified,
      hasPin,
      isTermsAccepted,
      sendOtp,
      verifyOtp,
      verifyShahkar,
      setPin,
      changePin,
      removePin,
      validatePin,
      unlockSession,
      lockSession,
      isSessionUnlocked,
      getSessionRemaining,
      logout,
      sendTermsCode,
      verifyTermsCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}