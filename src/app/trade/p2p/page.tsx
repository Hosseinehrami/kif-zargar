import TradeComingSoon from "@/components/TradeComingSoon";

export default function P2PPage() {
  return (
    <TradeComingSoon
      title="بازار P2P"
      description="خرید و فروش مستقیم طلا بین کاربران، با قیمت‌گذاری آزاد و ضمانت کیف زرگر."
      icon="🤝"
      features={[
        "معامله مستقیم بین کاربران",
        "قیمت‌گذاری آزاد",
        "سیستم ضمانت و امانت",
        "پشتیبانی ۲۴/۷",
      ]}
    />
  );
}