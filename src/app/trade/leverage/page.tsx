import TradeComingSoon from "@/components/TradeComingSoon";

export default function LeveragePage() {
  return (
    <TradeComingSoon
      title="معاملات اهرم‌دار"
      description="با اهرم تا ۱۰ برابر معامله کن و سود خودت را چند برابر کن. این بخش به‌زودی در دسترس خواهد بود."
      icon="🎚️"
      features={[
        "اهرم تا ۱۰ برابر",
        "پوزیشن خرید و فروش",
        "حد ضرر و حد سود",
        "لیکوییدیشن هوشمند",
      ]}
    />
  );
}