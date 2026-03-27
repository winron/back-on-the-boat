"use client";

import { useState, useEffect } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { loadReadings } from "@/lib/data-loader";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import type { ReadingPassage } from "@/types";

type TabMode = "short" | "story";

export default function ReadingPage() {
  const { level, setLevel } = useHskLevel("reading");
  const { unlockedLevel } = useUnlockedLevel();
  const { showPinyin, showEnglish } = useDisplaySettings();
  const [readings, setReadings] = useState<ReadingPassage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabMode>("short");

  useEffect(() => {
    loadReadings(level)
      .then(setReadings)
      .catch(() => setReadings([]));
    setSelectedId(null);
  }, [level]);

  // Scroll to top whenever the view switches (browse ↔ detail)
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedId]);

  const filtered = readings.filter((r) => r.type === tab);
  const selected = readings.find((r) => r.id === selectedId);

  return (
    <div className="tab-color-5 space-y-6">
      <div className="flex items-center justify-between">
        <TrilingualLabel chinese="阅读" pinyin="yuèdú" english="Reading" size="lg" />
        <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
      </div>

      {selected ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedId(null)}
            className="bg-card border border-border rounded-lg px-5 py-2.5 text-white flex items-center"
          >
            <svg viewBox="0 0 36 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-3">
              <line x1="36" y1="6" x2="0" y2="6" />
              <polyline points="8 0 0 6 8 12" />
            </svg>
          </button>

          {/* Title card — pinyin / chinese / english stacked */}
          <div className="bg-card rounded-lg p-4 border border-border">
            {selected.titlePinyin && showPinyin && (
              <p className="text-sm text-muted-foreground">{selected.titlePinyin}</p>
            )}
            <h2 className="font-semibold text-lg">{selected.titleZh}</h2>
            {showEnglish && (
              <p className="text-sm text-muted-foreground">{selected.title}</p>
            )}
          </div>

          {/* Paragraphs — all in one container with dividers */}
          <div className="bg-card rounded-lg border border-border divide-y divide-border">
            {selected.paragraphs.map((para, i) => (
              <div key={i} className="p-4 space-y-1.5">
                <p className="text-base leading-relaxed">{para.chinese}</p>
                {showPinyin && (
                  <PinyinDisplay pinyin={para.pinyin} className="text-sm" />
                )}
                {showEnglish && (
                  <p className="text-sm text-muted-foreground">{para.english}</p>
                )}
              </div>
            ))}
          </div>

          {selected.vocabHighlights.length > 0 && (
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                <TrilingualLabel chinese="重点词汇" pinyin="zhòngdiǎn cíhuì" english="Key Vocabulary" size="xs" />
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.vocabHighlights.map((word) => (
                  <span key={word} className="px-2 py-1 bg-muted rounded-lg text-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("short")}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                tab === "short"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <TrilingualLabel chinese="短文" pinyin="duǎn wén" english="Short" size="xs" />
            </button>
            <button
              onClick={() => setTab("story")}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                tab === "story"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <TrilingualLabel chinese="故事" pinyin="gùshi" english="Stories" size="xs" />
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="w-full text-left bg-card rounded-lg p-4 border border-border hover:border-primary transition-colors"
              >
                <p className="font-medium">{r.titleZh}</p>
                {r.titlePinyin && showPinyin && (
                  <p className="text-sm text-muted-foreground">{r.titlePinyin}</p>
                )}
                {showEnglish && (
                  <p className="text-sm text-muted-foreground">{r.title}</p>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                <TrilingualLabel chinese="还没有阅读内容" pinyin="hái méiyǒu yuèdú nèiróng" english="No reading content yet" size="sm" />
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
