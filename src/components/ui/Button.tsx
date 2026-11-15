"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
type Size = "sm" | "md" | "lg" | "xl";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: "right" | "left";
  children?: ReactNode;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-gradient-to-l from-[var(--gold)] to-[#d4b885] text-black hover:opacity-90 shadow-lg shadow-[var(--gold)]/20",
  secondary: "bg-[var(--panel-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--panel)]",
  ghost: "bg-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]",
  danger: "bg-[var(--red)] text-white hover:bg-[var(--red)]/90 shadow-md shadow-[var(--red)]/20",
  success: "bg-[var(--green)] text-white hover:bg-[var(--green)]/90 shadow-md shadow-[var(--green)]/20",
  warning: "bg-amber-500 text-white hover:bg-amber-500/90 shadow-md shadow-amber-500/20",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-[10px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-[11px] rounded-xl gap-2",
  lg: "h-11 px-5 text-xs rounded-xl gap-2",
  xl: "h-12 px-6 text-sm rounded-xl gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = "right",
  children,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-bold transition
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
      {!loading && icon && iconPosition === "right" && icon}
      {children}
      {!loading && icon && iconPosition === "left" && icon}
    </button>
  );
}