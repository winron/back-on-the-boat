"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useTodayStats, useStreak } from "@/hooks/useStats";
import { useHskLevel } from "@/hooks/useHskLevel";
import LevelSelector from "@/components/shared/LevelSelector";
import Link from "next/link";

export default function Dashboard() {
  const { level, setLevel } = useHskLevel();
  const todayStats = useTodayStats();
  const streak = useStreak();

  const dueCount = useLiveQuery(async () => {
    const now = new Date();
    return db.srsCards
      .where("due")
      .belowOrEqual(now)
      .count();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">HSK Master</h1>
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Settings"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </Link>
      </div>

      <LevelSelector currentLevel={level} onSelect={setLevel} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 text-center border border-border">
          <p className="text-2xl font-bold text-primary">{dueCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Due Today</p>
        </div>
        <div className="bg-card rounded-xl p-4 text-center border border-border">
          <p className="text-2xl font-bold">{todayStats?.cardsReviewed ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Reviewed</p>
        </div>
        <div className="bg-card rounded-xl p-4 text-center border border-border">
          <p className="text-2xl font-bold">{streak}</p>
          <p className="text-xs text-muted-foreground mt-1">Day Streak</p>
        </div>
      </div>

      {/* Accuracy */}
      {todayStats && todayStats.totalCount > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Today&apos;s Accuracy
            </span>
            <span className="text-sm font-medium">
              {Math.round((todayStats.correctCount / todayStats.totalCount) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${(todayStats.correctCount / todayStats.totalCount) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Study</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/characters", label: "Characters", icon: "字", desc: "Learn & review" },
            { href: "/grammar", label: "Grammar", icon: "文", desc: "Patterns & rules" },
            { href: "/sentences", label: "Sentences", icon: "句", desc: "Build sentences" },
            { href: "/dialogue", label: "Dialogue", icon: "话", desc: "Read & practice" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-card rounded-xl p-4 border border-border hover:border-primary transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="font-medium mt-2">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
