"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { id: "instant",  label: "آنّی",    icon: "⚡", href: "/trade" },
  { id: "leverage", label: "اهرم‌دار", icon: "🎚️", href: "/trade/leverage" },
  { id: "p2p",      label: "P2P",     icon: "🤝", href: "/trade/p2p" },
] as const;

export default function TradeTabs() {
  const pathname = usePathname();

  const isActive = (id: string) => {
    if (id === "instant") return pathname === "/trade";
    if (id === "leverage") return pathname.startsWith("/trade/leverage");
    if (id === "p2p") return pathname.startsWith("/trade/p2p");
    return false;
  };

  return (
    <nav
      className="mb-2.5 sm:mb-3 p-1 rounded-2xl border border-[var(--border)] bg-[var(--panel)]/60 backdrop-blur-xl shadow-lg"
      aria-label="حالت معامله"
    >
      <div className="grid grid-cols-3 gap-1">
        {tabs.map((tab) => {
          const active = isActive(tab.id);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 leading-none ${
                active
                  ? "bg-gradient-to-b from-[var(--gold)]/25 to-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-[var(--muted)] border border-transparent hover:text-[var(--text)] hover:bg-[var(--panel-2)]/40"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-sm leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--gold)] shadow-[0_0_6px_var(--gold)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}