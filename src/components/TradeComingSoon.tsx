import Link from "next/link";

type Props = {
  title: string;
  description: string;
  icon: string;
  features: string[];
};

export default function TradeComingSoon({
  title,
  description,
  icon,
  features,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-10 text-center">
      {/* Glow پس‌زمینه */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--gold)]/25 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        <div className="text-5xl sm:text-6xl mb-4 select-none">{icon}</div>

        <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 mb-3 animate-pulse">
          به‌زودی
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold mb-2">{title}</h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mb-6 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto mb-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-2.5 text-right text-[11px] sm:text-xs flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] grid place-items-center text-[10px] font-bold shrink-0">
                ✓
              </span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-sm mx-auto">
          <Link
            href="/trade"
            className="flex-1 rounded-xl py-2.5 px-4 text-sm font-bold bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90 transition text-center"
          >
            بازگشت به معاملات آنی
          </Link>
          <button
            type="button"
            disabled
            title="به‌زودی"
            className="flex-1 rounded-xl py-2.5 px-4 text-sm font-bold border border-[var(--border)] text-[var(--muted)] cursor-not-allowed"
          >
            اطلاع‌رسانی
          </button>
        </div>
      </div>
    </div>
  );
}