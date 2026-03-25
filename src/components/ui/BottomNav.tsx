"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", chinese: "家", color: "var(--color-tab-1)" },
  { href: "/characters", chinese: "字", color: "var(--color-tab-2)" },
  { href: "/grammar", chinese: "文", color: "var(--color-tab-3)" },
  { href: "/sentences", chinese: "句", color: "var(--color-tab-4)" },
  { href: "/reading", chinese: "读", color: "var(--color-tab-5)" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-card/70 backdrop-blur-xl backdrop-saturate-150 safe-area-pb">
      <div className="flex justify-around items-center h-[4.8rem] max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center px-2 py-1 transition-colors"
              style={{ color: active ? tab.color : undefined }}
            >
              <span
                className={`text-xl leading-none ${
                  active ? "font-bold" : "text-muted-foreground"
                }`}
              >
                {tab.chinese}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
