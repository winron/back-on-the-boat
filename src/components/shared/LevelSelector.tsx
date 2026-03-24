"use client";

import type { HskLevel } from "@/types";

interface LevelSelectorProps {
  currentLevel: HskLevel;
  onSelect: (level: HskLevel) => void;
  unlockedLevel?: HskLevel;
}

const levels: HskLevel[] = [1, 2, 3, 4, 5, 6];

export default function LevelSelector({
  currentLevel,
  onSelect,
  unlockedLevel = 6,
}: LevelSelectorProps) {
  return (
    <div className="flex gap-2">
      {levels.map((level) => {
        const locked = level > unlockedLevel;
        return (
          <button
            key={level}
            onClick={() => !locked && onSelect(level)}
            disabled={locked}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              locked
                ? "bg-muted text-muted-foreground opacity-30 cursor-not-allowed"
                : level === currentLevel
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-border"
            }`}
          >
            {locked ? "🔒" : ""} HSK {level}
          </button>
        );
      })}
    </div>
  );
}
