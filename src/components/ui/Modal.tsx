"use client";

import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

// ==========================================
// Modal پایه
// ==========================================
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
};

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnBackdrop = true,
  showCloseButton = true,
}: ModalProps) {
  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-modal-backdrop"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal content */}
      <div
        className={`relative w-full ${SIZE_CLASSES[size]} rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl shadow-black/50 overflow-hidden animate-modal-content`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-3 p-4 border-b border-[var(--border)]">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="font-bold text-sm text-[var(--text)]">{title}</h2>
              )}
              {description && (
                <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition flex items-center justify-center shrink-0 -mt-1 -ml-1"
                aria-label="بستن"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>

      <style>{`
        @keyframes modal-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-content-in {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-backdrop { animation: modal-backdrop-in 0.2s ease; }
        .animate-modal-content { animation: modal-content-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>,
    document.body
  );
}

// ==========================================
// Confirm Dialog (بر اساس Modal)
// ==========================================
type ConfirmVariant = "danger" | "warning" | "info" | "success";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
};

const VARIANT_STYLE = {
  danger: {
    iconBg: "bg-[var(--red)]/15",
    iconBorder: "border-[var(--red)]/40",
    icon: "text-[var(--red)]",
    confirmBtn: "bg-[var(--red)] hover:bg-[var(--red)]/90",
  },
  warning: {
    iconBg: "bg-amber-500/15",
    iconBorder: "border-amber-500/40",
    icon: "text-amber-400",
    confirmBtn: "bg-amber-500 hover:bg-amber-500/90",
  },
  info: {
    iconBg: "bg-sky-500/15",
    iconBorder: "border-sky-500/40",
    icon: "text-sky-400",
    confirmBtn: "bg-sky-500 hover:bg-sky-500/90",
  },
  success: {
    iconBg: "bg-[var(--green)]/15",
    iconBorder: "border-[var(--green)]/40",
    icon: "text-[var(--green)]",
    confirmBtn: "bg-[var(--green)] hover:bg-[var(--green)]/90",
  },
};

const VARIANT_ICON = {
  danger: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "تایید",
  cancelText = "انصراف",
  variant = "info",
  loading = false,
}: ConfirmDialogProps) {
  const style = VARIANT_STYLE[variant];

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 animate-modal-backdrop"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl shadow-black/50 overflow-hidden animate-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="p-5 pb-4">
          <div className="flex flex-col items-center text-center mb-4">
            <div className={`w-14 h-14 rounded-full ${style.iconBg} ${style.iconBorder} border-2 flex items-center justify-center ${style.icon} mb-3`}>
              {VARIANT_ICON[variant]}
            </div>
            <h2 className="text-sm font-bold text-[var(--text)] mb-1">{title}</h2>
            {description && (
              <p className="text-[11px] text-[var(--muted)] leading-relaxed max-w-xs">
                {description}
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] text-[var(--text)] text-[11px] font-bold hover:bg-[var(--panel)] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 h-10 rounded-xl text-white text-[11px] font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${style.confirmBtn}`}
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? "در حال انجام..." : confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modal-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-content-in {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-backdrop { animation: modal-backdrop-in 0.2s ease; }
        .animate-modal-content { animation: modal-content-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>,
    document.body
  );
}