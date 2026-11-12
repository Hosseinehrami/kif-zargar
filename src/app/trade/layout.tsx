import TradeTabs from "@/components/TradeTabs";

export default function TradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-2.5 sm:px-4 pt-2.5 sm:pt-3 pb-3" dir="rtl">
      <header className="mb-2">
        <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold pb-2 border-b border-[var(--border)]">
          خرید و فروش <span className="text-[var(--gold)]">طلا</span>
        </h1>
      </header>

      <TradeTabs />

      {children}
    </div>
  );
}