import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/Appshell";
import SplashScreen from "@/components/SplashScreen";
import { AuthProvider } from "@/lib/auth-context";

const vazir = localFont({
  src: "./fonts/Vazirmatn[wght].woff2",
  variable: "--font-vazir",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "کیف زرگر | مدیریت هوشمند دارایی طلا",
  description: "پلتفرم مدیریت دارایی، خرید و فروش و معاملات طلا",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazir.variable}>
      <body>
        <SplashScreen />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}