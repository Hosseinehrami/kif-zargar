export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // 👇 تغییر: justify-start pt-12 برای آمدن محتوا به بالا
    <div className="min-h-dvh flex flex-col items-center justify-start pt-12 sm:pt-20 bg-[var(--bg)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse opacity-30" />
        <div className="absolute top-[35%] right-[25%] w-1 h-1 bg-[var(--gold)] rounded-full animate-pulse opacity-20" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-[25%] left-[30%] w-2 h-2 bg-[var(--gold)] rounded-full animate-pulse opacity-15" style={{ animationDelay: "1s" }} />
      </div>

      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--gold)] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--gold)] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* 👇 لوگو و متن‌های بالای آن از اینجا به طور کامل حذف شدند */}

        {children}

        <div className="text-center mt-8 text-[9px] text-[var(--muted)] opacity-60 pb-4">
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