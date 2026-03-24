"use client";

import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
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
      {/* App Title */}
      <TrilingualLabel
        chinese="回到船上"
        pinyin="huí dào chuán shàng"
        english="BACK ON THE BOAT"
        size="lg"
      />

      {/* Current Level */}
      <div className="text-center space-y-1">
        <TrilingualLabel chinese="当前等级" pinyin="dāngqián děngjí" english="Current Level" size="sm" />
        <p
          className="text-5xl font-bold"
          style={{ color: "var(--color-tab-1)" }}
        >
          HSK {currentProgressLevel}
        </p>
      </div>

      {/* XP Progress Bar */}
      <div className="w-full max-w-xs space-y-2">
        <div className="relative h-[3.75rem] bg-muted rounded-lg overflow-hidden border border-border">
          <div
            className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, var(--color-tab-1), var(--color-tab-2))`,
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
            {loading
              ? "..."
              : isLevelComplete
              ? "升级！"
              : `${masteredCount} / ${totalCount}`}
          </span>
        </div>
        <TrilingualLabel chinese="掌握" pinyin="zhǎngwò" english="Mastered" size="xs" />
      </div>

      {/* Display Toggles */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={togglePinyin}
          className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all border ${
            showPinyin
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-foreground border-border"
          }`}
        >
          <span className="block text-xs">pīnyīn</span>
          拼音
          <span className="block text-xs">Pinyin</span>
        </button>
        <button
          onClick={toggleEnglish}
          className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all border ${
            showEnglish
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-foreground border-border"
          }`}
        >
          <span className="block text-xs">yīngwén</span>
          英文
          <span className="block text-xs">English</span>
        </button>
      </div>

    </div>
  );
}
