"use client";

import type { HskLevel } from "@/types";

interface LevelSelectorProps {
  currentLevel: HskLevel;
  onSelect: (level: HskLevel) => void;
}

const levels: HskLevel[] = [1, 2, 3, 4, 5, 6];

export default function LevelSelector({
  currentLevel,
  onSelect,
}: LevelSelectorProps) {
  return (
    <div className="flex gap-2">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onSelect(level)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            level === currentLevel
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-border"
          }`}
        >
          HSK {level}
        </button>
      ))}
    </div>
  );
}
