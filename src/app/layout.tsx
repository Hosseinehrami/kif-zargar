import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/Appshell";
import SplashScreen from "@/components/SplashScreen";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/Toast";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const vazir = localFont({
  src: "./fonts/Vazirmatn[wght].woff2",
  variable: "--font-vazir",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "کیف زرگر | مدیریت هوشمند دارایی طلا",
  description: "پلتفرم مدیریت دارایی، خرید و فروش و معاملات طلا",
  applicationName: "کیف زرگر",
  appleWebApp: {
    capable: true,
    title: "کیف زرگر",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#17191c" },
    { media: "(prefers-color-scheme: light)", color: "#f2f0eb" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazir.variable}>
      <body>
        <SplashScreen />
        <ServiceWorkerRegister />
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}