"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ⏱ طول عمر نشست: ۲۴ ساعت
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export type KycStatus = "none" | "verified";
export type AuthUser = {
  phone: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  kycStatus: KycStatus;
  securityPin?: string;
  sessionExpiresAt?: number;
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
};

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "kif-auth";
const UNLOCK_KEY = "kif-unlocked";
const EXPIRED_FLAG = "kif-session-expired";

async function mockShahkarLookup(phone: string, nationalId: string) {
  await new Promise(r => setTimeout(r, 1500));
  if (!/^\d{10}$/.test(nationalId)) return { success: false, error: "کد ملی باید ۱۰ رقم باشد" };
  if (nationalId.startsWith("0000")) return { success: false, error: "کد ملی با شماره موبایل تطابق ندارد" };
  return { success: true, firstName: "علی", lastName: "رضایی" };
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
          // اگر PIN ندارد → خودکار آنلاک
          if (!parsed.securityPin) {
            sessionStorage.setItem(UNLOCK_KEY, "1");
          } else {
            // اگر PIN دارد و نشست معتبر است، فقط با بستن تب، UNLOCK_KEY پاک می‌شود
            // پس اگر الان UNLOCK_KEY هست، یعنی در همان تب قبلی آنلاک کرده، نگه می‌داریم
            // اگر نیست، صفحه PIN لاز�� است
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

  // ===== بررسی انقضا در حین استفاده (هر ۳۰ ثانیه) =====
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
  // حالا Promise برمی‌گردونه که login بدونه کجا بره
  const verifyOtp = async (phone: string, code: string): Promise<VerifyOtpResult> => {
    await new Promise(r => setTimeout(r, 800));
    if (code !== "1234") throw new Error("کد وارد شده اشتباه است");

    const sessionExpiresAt = Date.now() + SESSION_DURATION;

    // 🔒 همیشه UNLOCK_KEY را پاک کن → PIN اجباری (اگر فعال باشد)
    sessionStorage.removeItem(UNLOCK_KEY);

    // تعیین وضعیت بعدی کاربر
    const existingUser = user && user.phone === phone ? user : null;
    const willBeVerified = existingUser?.kycStatus === "verified" && !!existingUser?.nationalId;
    const willHavePin = !!existingUser?.securityPin;

    // اگر PIN ندارد → بعد از verify، آنلاک می‌شود
    // اگر PIN دارد → قفل می‌ماند تا PIN بزند
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
        // PIN دارد → قفل می‌ماند تا بزند
        sessionStorage.removeItem(UNLOCK_KEY);
      } else {
        sessionStorage.setItem(UNLOCK_KEY, "1");
      }

      return { success: true, hasPin: hasExistingPin };
    }
    return result;
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
  };

  const isLoggedIn = !!user?.phone;
  const isVerified = user?.kycStatus === "verified" && !!user?.nationalId;
  const hasPin = !!user?.securityPin;

  return (
    <AuthContext.Provider value={{
      user, isLoading, isLoggedIn, isVerified, hasPin,
      sendOtp, verifyOtp, verifyShahkar,
      setPin, changePin, removePin, validatePin,
      unlockSession, lockSession, isSessionUnlocked,
      getSessionRemaining,
      logout,
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