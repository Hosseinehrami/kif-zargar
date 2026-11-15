"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

// ==========================================
// انواع Toast
// ==========================================
export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastContextType = {
  show: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

// ==========================================
// آیکون‌ها
// ==========================================
const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const COLORS = {
  success: {
    border: "border-[var(--green)]/40",
    bg: "bg-[var(--green)]/10",
    text: "text-[var(--green)]",
    iconBg: "bg-[var(--green)]/20",
    progress: "bg-[var(--green)]",
  },
  error: {
    border: "border-[var(--red)]/40",
    bg: "bg-[var(--red)]/10",
    text: "text-[var(--red)]",
    iconBg: "bg-[var(--red)]/20",
    progress: "bg-[var(--red)]",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    iconBg: "bg-amber-500/20",
    progress: "bg-amber-400",
  },
  info: {
    border: "border-sky-500/40",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    iconBg: "bg-sky-500/20",
    progress: "bg-sky-400",
  },
};

// ==========================================
// تک Toast
// ==========================================
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 3500;
  const colors = COLORS[toast.type];

  useEffect(() => {
    // Progress bar animation
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration]);

  function handleDismiss() {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 250);
  }

  return (
    <div
      role="alert"
      className={`
        relative overflow-hidden rounded-xl border-2 backdrop-blur-md
        ${colors.border} ${colors.bg}
        shadow-2xl shadow-black/30
        w-full max-w-sm
        transition-all duration-300
        ${isExiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}
        animate-toast-in
      `}
    >
      <div className="flex items-start gap-3 p-3.5 pb-4">
        <div className={`shrink-0 w-9 h-9 rounded-lg ${colors.iconBg} ${colors.text} flex items-center justify-center`}>
          {ICONS[toast.type]}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[12px] font-bold leading-relaxed text-[var(--text)]">
            {toast.message}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 w-6 h-6 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 flex items-center justify-center transition"
          aria-label="بستن"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
        <div
          className={`h-full ${colors.progress} transition-[width] duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ==========================================
// Provider
// ==========================================
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((type: ToastType, message: string, duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => show("success", message, duration), [show]);
  const error = useCallback((message: string, duration?: number) => show("error", message, duration), [show]);
  const warning = useCallback((message: string, duration?: number) => show("warning", message, duration), [show]);
  const info = useCallback((message: string, duration?: number) => show("info", message, duration), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, dismiss }}>
      {children}
      {/* Toast Container */}
      <div
        className="fixed top-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 z-[100] flex flex-col gap-2 pointer-events-none"
        dir="rtl"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-in {
          0% { opacity: 0; transform: translateX(100%) scale(0.9); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-toast-in {
          animation: toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// ==========================================
// Hook
// ==========================================
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}