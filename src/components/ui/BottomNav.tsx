"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";

const tabs = [
  { href: "/", chinese: "家", pinyin: "jiā", english: "Home", color: "var(--color-tab-1)" },
  { href: "/characters", chinese: "字", pinyin: "zì", english: "Chars", color: "var(--color-tab-2)" },
  { href: "/grammar", chinese: "文", pinyin: "wén", english: "Grammar", color: "var(--color-tab-3)" },
  { href: "/sentences", chinese: "句", pinyin: "jù", english: "Sentences", color: "var(--color-tab-4)" },
  { href: "/reading", chinese: "读", pinyin: "dú", english: "Reading", color: "var(--color-tab-5)" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { showPinyin, showEnglish } = useDisplaySettings();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0 px-2 py-1 transition-colors"
              style={{ color: active ? tab.color : undefined }}
            >
              {showPinyin && (
                <span className="text-[8px] leading-tight text-muted-foreground">
                  {tab.pinyin}
                </span>
              )}
              <span
                className={`text-lg leading-none ${
                  active ? "font-bold" : "text-muted-foreground"
                }`}
              >
                {tab.chinese}
              </span>
              {showEnglish && (
                <span
                  className={`text-[8px] leading-tight ${
                    active ? "" : "text-muted-foreground"
                  }`}
                >
                  {tab.english}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
