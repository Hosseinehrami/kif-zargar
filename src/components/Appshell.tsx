"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

// ---------- Icons ----------
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

const navItems = [
  { id: "home", label: "خانه", icon: "⌂", href: "/" },
  { id: "market", label: "بازار", icon: "◈", href: "/market" },
  { id: "trade", label: "معامله", icon: "⇄", href: "/trade" },
  { id: "assets", label: "دارایی‌ها", icon: "▤", href: "/assets" },
  { id: "wallet", label: "کیف پول", icon: "💳", href: "/wallet" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isLoggedIn, isVerified, hasPin, logout, lockSession, isSessionUnlocked } = useAuth();

  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // === بارگذاری تم از localStorage ===
  useEffect(() => {
    const saved = localStorage.getItem("kif-theme");
    const initialTheme = saved === "dark" || saved === "light" ? saved : "dark";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    setMounted(true);
  }, []);

  // === ذخیره‌ی تم ===
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kif-theme", theme);
  }, [theme, mounted]);

  // === محافظت از مسیرها — نیاز به ورود و تایید هویت ===
  useEffect(() => {
    if (isLoading) return;
    const isPublicPage = pathname.startsWith("/auth") || pathname.startsWith("/verify");
    if (isPublicPage) return;
    if (!isLoggedIn) { router.replace("/auth/login"); return; }
    if (!isVerified) { router.replace("/auth/verify"); return; }
  }, [isLoading, isLoggedIn, isVerified, pathname, router]);

  // === قفل PIN — هدایت به صفحه ورود کد امن ===
  useEffect(() => {
    if (isLoading) return;
    const isPublicPage = pathname.startsWith("/auth") || pathname.startsWith("/verify");
    if (isPublicPage) return;
    if (hasPin && !isSessionUnlocked()) {
      router.replace("/auth/pin");
    }
  }, [isLoading, hasPin, pathname, router]);

  // === بستن منوها با کلیک بیرون ===
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    if (notifOpen || profileOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [notifOpen, profileOpen]);

  const isActive = (id: string) => {
    if (id === "home") return pathname === "/";
    if (id === "market") return pathname.startsWith("/market");
    if (id === "trade") return pathname.startsWith("/trade");
    if (id === "assets") return pathname.startsWith("/assets");
    if (id === "wallet") return pathname.startsWith("/wallet");
    return false;
  };

  // === لودینگ اولیه ===
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]" dir="rtl">
        <div className="text-center">
          <div className="text-2xl font-black text-[var(--gold)] mb-3 font-serif italic tracking-wider">KIFE ZARGAR</div>
          <div className="w-8 h-8 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // === صفحات عمومی: auth و verify — بدون shell ===
  if (pathname.startsWith("/auth") || pathname.startsWith("/verify")) {
    return <>{children}</>;
  }

  // === نیاز به ورود و تایید — redirect در effect انجام شده ===
  if (!isLoggedIn || !isVerified) return null;

  // === قفل PIN — redirect در effect انجام شده، اینجا فقط وضعیت گذرا ===
  if (hasPin && !isSessionUnlocked()) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl border-2 border-[var(--gold)]/30 bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-3 text-[var(--gold)]">
            <LockIcon />
          </div>
          <p className="text-[11px] text-[var(--muted)]">در حال هدایت به صفحه ورود کد امن…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="app-shell" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ک</div>
          <div><strong>کیف زرگر</strong><small>پلتفرم هوشمند طلا</small></div>
        </div>
        <div className="side-caption">منوی اصلی</div>
        <nav className="side-nav">
          {navItems.map((item) => {
            const active = isActive(item.id);
            return (
              <Link key={item.id} href={item.href} className={active ? "side-link selected" : "side-link"}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {active && <span className="active-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card"><span>؟</span><strong>نیاز به راهنمایی داری؟</strong><small>پشتیبانی کیف زرگر</small></div>
          <div className="version">نسخه نمایشی ۰.۱</div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark">ک</div><strong>کیف زرگر</strong></div>
          <div className="welcome">
            <span>چهارشنبه، ۱۳ آبان ۱۴۰۵</span>
            <strong>سلام، {user?.firstName} {user?.lastName} 👋</strong>
          </div>
          <div className="top-actions">
            <button onClick={() => setTheme((c) => (c === "dark" ? "light" : "dark"))} className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/50 transition">
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <div ref={notifRef} className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition ${notifOpen ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--gold)]"}`}>
                <BellIcon />
              </button>
              {notifOpen && (
                <div className="absolute top-12 left-0 sm:left-auto sm:right-0 w-[290px] rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl z-50 p-4">
                  <p className="text-xs text-center text-[var(--muted)]">اعلان‌ها اینجا قرار می‌گیرند</p>
                </div>
              )}
            </div>

            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="w-10 h-10 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)] font-bold text-sm hover:border-[var(--gold)] transition">
                {user?.firstName?.charAt(0) || "؟"}
              </button>
              {profileOpen && (
                <div className="absolute left-0 top-12 z-50 w-60 rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden">
                  <div className="p-3 border-b border-[var(--border)]">
                    <div className="text-xs font-bold truncate">{user?.firstName} {user?.lastName}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5 font-mono" dir="ltr">{user?.phone}</div>
                  </div>

                  <Link href="/orders" onClick={() => setProfileOpen(false)} className="w-full text-right px-3 py-2.5 text-xs text-[var(--text)] hover:bg-[var(--panel-2)] transition flex items-center gap-2">
                    <OrdersIcon /> سفارشات من
                  </Link>

                  <Link
                    href="/verify"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-right px-3 py-2.5 text-xs text-[var(--text)] hover:bg-[var(--panel-2)] transition flex items-center gap-2 border-t border-[var(--border)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    استعلام رسید
                  </Link>

                  <Link href="/settings" onClick={() => setProfileOpen(false)} className="w-full text-right px-3 py-2.5 text-xs text-[var(--text)] hover:bg-[var(--panel-2)] transition flex items-center gap-2 border-t border-[var(--border)]">
                    <SettingsIcon /> تنظیمات
                  </Link>

                  {hasPin && (
                    <button
                      onClick={() => { setProfileOpen(false); lockSession(); router.replace("/auth/pin"); }}
                      className="w-full text-right px-3 py-2.5 text-xs text-amber-400 hover:bg-amber-500/10 transition flex items-center gap-2 border-t border-[var(--border)]"
                    >
                      <LockIcon /> قفل کردن اپ
                    </button>
                  )}

                  <button
                    onClick={() => { setProfileOpen(false); logout(); router.replace("/auth/login"); }}
                    className="w-full text-right px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition flex items-center gap-2 border-t border-[var(--border)]"
                  >
                    <LogoutIcon /> خروج از حساب
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="main-scroll">{children}</div>

        <nav className="mobile-nav">
          <div className="mobile-nav-inner">
            {navItems.map((item) => {
              const active = isActive(item.id);
              return (
                <Link key={item.id} href={item.href} className={active ? "mobile-link mobile-active" : "mobile-link"}>
                  <span className="mobile-icon">{item.icon}</span>
                  <small>{item.label}</small>
                </Link>
              );
            })}
          </div>
        </nav>
      </section>
    </main>
  );
}