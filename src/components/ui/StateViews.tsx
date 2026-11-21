"use client";


export function LoadingState({ title = "در حال بارگذاری...", rows = 3, compact = false }: { title?: string; rows?: number; compact?: boolean }) {
  return <div role="status" aria-live="polite" className={`w-full ${compact ? "py-5" : "py-8"}`}>
    <span className="sr-only">{title}</span>
    <div className="flex items-center justify-center gap-2 mb-5 text-xs text-[var(--muted)]"><span className="w-4 h-4 rounded-full border-2 border-[var(--gold)]/25 border-t-[var(--gold)] animate-spin" aria-hidden="true" />{title}</div>
    {!compact && <div className="space-y-3 max-w-3xl mx-auto px-2">{Array.from({ length: rows }).map((_, i) => <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 animate-pulse"><div className="h-3 w-1/3 rounded bg-[var(--panel-2)] mb-3"/><div className="h-2.5 w-2/3 rounded bg-[var(--panel-2)]"/></div>)}</div>}
  </div>;
}

export function EmptyState({ title, description, action, onAction, icon = "◇" }: { title: string; description?: string; action?: string; onAction?: () => void; icon?: string }) {
  return <div className="flex flex-col items-center justify-center text-center px-5 py-10 sm:py-14" role="status">
    <div className="w-14 h-14 rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] text-[var(--muted)] flex items-center justify-center text-2xl mb-4" aria-hidden="true">{icon}</div>
    <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
    {description && <p className="text-[11px] leading-6 text-[var(--muted)] mt-2 max-w-sm">{description}</p>}
    {action && onAction && <button type="button" onClick={onAction} className="mt-4 h-9 px-4 rounded-xl bg-[var(--gold)] text-black text-[11px] font-bold hover:brightness-105 transition">{action}</button>}
  </div>;
}

export function ErrorState({ title = "بارگذاری اطلاعات ناموفق بود", description = "لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div role="alert" className="flex flex-col items-center text-center px-5 py-10 rounded-2xl border border-[var(--red)]/20 bg-[var(--red)]/5">
    <div className="w-12 h-12 rounded-full bg-[var(--red)]/10 text-[var(--red)] flex items-center justify-center text-xl mb-3" aria-hidden="true">!</div>
    <h3 className="text-sm font-bold">{title}</h3><p className="text-[11px] text-[var(--muted)] mt-2 max-w-sm leading-6">{description}</p>
    {onRetry && <button type="button" onClick={onRetry} className="mt-4 h-9 px-4 rounded-xl border border-[var(--border)] text-xs font-bold hover:border-[var(--gold)] transition">تلاش دوباره</button>}
  </div>;
}

export function SuccessState({ title, description, action, onAction }: { title: string; description?: string; action?: string; onAction?: () => void }) {
  return <div role="status" className="flex flex-col items-center text-center px-5 py-8 rounded-2xl border border-[var(--green)]/25 bg-[var(--green)]/5">
    <div className="w-12 h-12 rounded-full bg-[var(--green)]/15 text-[var(--green)] flex items-center justify-center text-xl mb-3" aria-hidden="true">✓</div>
    <h3 className="text-sm font-bold">{title}</h3>{description && <p className="text-[11px] text-[var(--muted)] mt-2 leading-6">{description}</p>}
    {action && onAction && <button type="button" onClick={onAction} className="mt-4 h-9 px-4 rounded-xl bg-[var(--gold)] text-black text-xs font-bold">{action}</button>}
  </div>;
}
