"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * فوکوس صفحه‌کلید را درون یک کانتینر محدود می‌کند.
 * - در زمان فعال شدن، اولین عنصر قابل فوکوس را فوکوس می‌کند.
 * - Tab/Shift+Tab را در ابتدا و انتها می‌چرخاند.
 * - در زمان غیرفعال شدن، فوکوس را به عنصر قبلی برمی‌گرداند.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // ذخیره عنصری که قبل از باز شدن فوکوس داشت
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        // فیلتر عناصر مخفی
        .filter((el) => el.offsetParent !== null);

    // فوکوس اولیه
    const initial = getFocusable();
    if (initial.length > 0) {
      initial[0].focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusables = getFocusable();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (activeEl === first || activeEl === container)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // بازگرداندن فوکوس به عنصر قبلی
      previousFocusRef.current?.focus?.();
    };
  }, [active]);

  return containerRef;
}