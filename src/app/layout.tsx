import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DisplaySettingsProvider } from "@/hooks/useDisplaySettings";
import BottomNav from "@/components/ui/BottomNav";
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
  title: "HSK Master",
  description: "Master HSK 1-6 Chinese characters, grammar, and reading",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HSK Master",
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DisplaySettingsProvider>
          <main className="flex-1 pb-20 max-w-lg mx-auto w-full px-4 pt-4">
            {children}
          </main>
          <BottomNav />
        </DisplaySettingsProvider>
      </body>
    </html>
  );
}
