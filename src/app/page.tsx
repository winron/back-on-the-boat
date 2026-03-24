"use client";

import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import Link from "next/link";
import TrilingualLabel from "@/components/shared/TrilingualLabel";

export default function HomePage() {
  const { showPinyin, showEnglish, togglePinyin, toggleEnglish } =
    useDisplaySettings();
  const { currentProgressLevel, masteredCount, totalCount, loading } =
    useUnlockedLevel();

  const percent =
    totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
  const isLevelComplete = totalCount > 0 && masteredCount >= totalCount;

  return (
    <div className="tab-color-1 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] space-y-8">
      {/* Current Level */}
      <div className="text-center space-y-1">
        <p className="text-muted-foreground text-sm">
          {showPinyin && <span className="block text-xs">děngjí</span>}
          当前等级
          {showEnglish && <span className="block text-xs">Current Level</span>}
        </p>
        <p
          className="text-5xl font-bold"
          style={{ color: "var(--color-tab-1)" }}
        >
          HSK {currentProgressLevel}
        </p>
      </div>

      {/* XP Progress Bar */}
      <div className="w-full max-w-xs space-y-2">
        <div className="relative h-6 bg-muted rounded-full overflow-hidden border border-border">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, var(--color-tab-1), var(--color-tab-2))`,
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
            {loading
              ? "..."
              : isLevelComplete
              ? showEnglish ? "Level Up!" : "升级！"
              : `${masteredCount} / ${totalCount}`}
          </span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {showPinyin && <span className="block text-[10px]">zhǎngwò</span>}
          掌握
          {showEnglish && <span className="block text-[10px]">Mastered</span>}
        </p>
      </div>

      {/* Display Toggles */}
      <div className="flex gap-4">
        <button
          onClick={togglePinyin}
          className={`px-5 py-3 rounded-xl text-sm font-medium transition-all border ${
            showPinyin
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          <span className="block text-xs">pīnyīn</span>
          拼音
          <span className="block text-xs">Pinyin</span>
        </button>
        <button
          onClick={toggleEnglish}
          className={`px-5 py-3 rounded-xl text-sm font-medium transition-all border ${
            showEnglish
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          <span className="block text-xs">yīngwén</span>
          英文
          <span className="block text-xs">English</span>
        </button>
      </div>

      {/* Settings link */}
      <Link
        href="/settings"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <TrilingualLabel
          chinese="设置"
          pinyin="shèzhì"
          english="Settings"
          size="xs"
        />
      </Link>
    </div>
  );
}
