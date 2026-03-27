import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DisplaySettingsProvider } from "@/hooks/useDisplaySettings";
import BottomNav from "@/components/ui/BottomNav";
import SwipeGuard from "@/components/ui/SwipeGuard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "回到船上 - Back on the Boat",
  description: "回到船上 - Master HSK 1-6 Chinese characters, grammar, and reading",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "回到船上",
  },
  icons: {
    icon: "/icons/sailboat.png",
    apple: "/icons/sailboat.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#121218",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="h-full flex flex-col bg-background text-foreground overflow-hidden overscroll-none">
        <DisplaySettingsProvider>
          <main className="flex-1 pb-20 max-w-lg mx-auto w-full px-4 pt-4 overflow-y-auto overscroll-none">
            {children}
          </main>
          <BottomNav />
        </DisplaySettingsProvider>
        <SwipeGuard />
        <div className="landscape-block" aria-hidden="true">
          <span style={{ fontSize: "3rem" }}>↺</span>
          <p style={{ fontSize: "1.1rem", color: "var(--muted-foreground)" }}>
            Please rotate your device to portrait mode
          </p>
        </div>
      </body>
    </html>
  );
}
