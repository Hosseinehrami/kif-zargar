export default function Loading() {
  return (
    <div className="h-[calc(100dvh-130px)] flex items-center justify-center bg-[var(--bg)]" dir="rtl">
      <div className="text-center px-6">
        {/* لوگو */}
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-3xl border-2 border-[var(--gold)]/30 animate-pulse" />
          <div className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-[var(--gold)] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 border border-[var(--gold)]/40 flex items-center justify-center">
              <span className="text-2xl font-black text-[var(--gold)]">ک</span>
            </div>
          </div>
        </div>

        {/* متن */}
        <div className="text-sm font-bold text-[var(--gold)] font-serif italic tracking-widest mb-1">
          KIFE ZARGAR
        </div>
        <div className="text-[10px] text-[var(--muted)] mb-4">در حال بارگذاری...</div>

        {/* نوار پیشرفت */}
        <div className="w-32 h-1 rounded-full bg-[var(--border)] overflow-hidden mx-auto">
          <div
            className="h-full bg-gradient-to-l from-[var(--gold)] to-[#d4b885] rounded-full"
            style={{
              animation: "loading-bar 1.5s ease-in-out infinite",
            }}
          />
        </div>

        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}