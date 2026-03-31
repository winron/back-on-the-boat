"use client";

import { formatTimer } from "@/hooks/usePageTimer";
import type { HskLevel } from "@/types";

interface ProgressCardProps {
  label: string;
  hskLevel: HskLevel;
  mastered: number;
  total: number;
  timerSeconds: number;
  gradient: string;
  loading: boolean;
}

export default function ProgressCard({
  label,
  hskLevel,
  mastered,
  total,
  timerSeconds,
  gradient,
  loading,
}: ProgressCardProps) {
  const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="space-y-1">
      {/* HSK level label — left aligned, small */}
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold" style={{ color: "var(--color-tab-1)" }}>
          HSK {hskLevel}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>

      {/* Stats row: count | timer | percent */}
      <div className="flex justify-between items-center text-xs font-medium text-foreground">
        <span>{loading ? "..." : `${mastered} / ${total}`}</span>
        <span className="font-mono text-muted-foreground tabular-nums">
          {loading ? "--:--" : formatTimer(timerSeconds)}
        </span>
        <span>{loading ? "..." : `${percent}%`}</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-[2.8rem] bg-muted rounded-lg overflow-hidden border border-white">
        <div
          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
          style={{ width: `${percent}%`, background: gradient }}
        />
      </div>
    </div>
  );
}
