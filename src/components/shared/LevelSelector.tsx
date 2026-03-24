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
    <select
      value={currentLevel}
      onChange={(e) => {
        const val = Number(e.target.value) as HskLevel;
        if (val <= unlockedLevel) onSelect(val);
      }}
      className="bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium appearance-none cursor-pointer min-w-[5.5rem] text-center"
      style={{ backgroundImage: "none" }}
    >
      {levels.map((level) => (
        <option
          key={level}
          value={level}
          disabled={level > unlockedLevel}
          className="bg-card text-foreground"
        >
          HSK {level}{level > unlockedLevel ? " （锁定）" : ""}
        </option>
      ))}
    </select>
  );
}
