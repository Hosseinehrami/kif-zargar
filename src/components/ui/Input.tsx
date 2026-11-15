"use client";

import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  fullWidth?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      icon,
      suffix,
      fullWidth = true,
      className = "",
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`;
    const hasError = !!error;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {(label || hint) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <label
                htmlFor={inputId}
                className="text-[10px] text-[var(--muted)]"
              >
                {label}
              </label>
            )}
            {hint && (
              <span className="text-[9px] text-[var(--muted)]">{hint}</span>
            )}
          </div>
        )}

        <div
          className={`
            flex items-center gap-2 h-10 rounded-xl border-2 bg-[var(--bg)] px-3
            transition-all
            ${
              hasError
                ? "border-[var(--red)]/50"
                : "border-[var(--border)] focus-within:border-[var(--gold)]"
            }
            ${className}
          `}
        >
          {icon && (
            <span className="shrink-0 text-[var(--muted)]">{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            {...rest}
            className="flex-1 min-w-0 bg-transparent outline-none text-[12px] font-bold text-[var(--text)] placeholder:text-[var(--muted)] placeholder:font-normal"
          />
          {suffix && (
            <span className="shrink-0 text-[10px] text-[var(--muted)]">
              {suffix}
            </span>
          )}
        </div>

        {error && (
          <p className="text-[10px] text-[var(--red)] mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };