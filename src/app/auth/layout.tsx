export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse opacity-30" />
        <div className="absolute top-[35%] right-[25%] w-1 h-1 bg-[var(--gold)] rounded-full animate-pulse opacity-20" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-[25%] left-[30%] w-2 h-2 bg-[var(--gold)] rounded-full animate-pulse opacity-15" style={{ animationDelay: "1s" }} />
      </div>

      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--gold)] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--gold)] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-7">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[var(--gold)] opacity-20 rounded-xl blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 flex items-center justify-center text-2xl font-black text-[var(--gold)]">
              ک
            </div>
          </div>
          <div className="mt-3 text-lg font-black text-[var(--gold)] font-serif italic tracking-[0.15em]">
            KIFE ZARGAR
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-1 tracking-widest">پلتفرم هوشمند طلا</div>
        </div>

        {children}

        <div className="text-center mt-5 text-[9px] text-[var(--muted)] opacity-60">
          © ۱۴۰۵ کیف زرگر · تمام حقوق محفوظ است
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-shake { animation: shake 0.4s ease; }
        .slide-in-right { animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .slide-in-left { animation: slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .fade-in { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  );
}