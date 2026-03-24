"use client";

import { useState, useEffect } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { loadReadings } from "@/lib/data-loader";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import type { ReadingPassage } from "@/types";

type TabMode = "short" | "story";

export default function ReadingPage() {
  const { level, setLevel } = useHskLevel("reading");
  const { unlockedLevel } = useUnlockedLevel();
  const [readings, setReadings] = useState<ReadingPassage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabMode>("short");
  const [showPinyin, setShowPinyin] = useState(false);
  const [revealedTranslations, setRevealedTranslations] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    loadReadings(level)
      .then(setReadings)
      .catch(() => setReadings([]));
    setSelectedId(null);
    setRevealedTranslations(new Set());
  }, [level]);

  const filtered = readings.filter((r) => r.type === tab);
  const selected = readings.find((r) => r.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setShowPinyin(false);
    setRevealedTranslations(new Set());
  };

  const toggleTranslation = (index: number) => {
    setRevealedTranslations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAllTranslations = () => {
    if (selected) {
      if (revealedTranslations.size === selected.paragraphs.length) {
        setRevealedTranslations(new Set());
      } else {
        setRevealedTranslations(
          new Set(selected.paragraphs.map((_, i) => i))
        );
      }
    }
  };

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
            className="text-sm text-primary"
          >
            &larr; Back to list
          </button>

          <div className="bg-card rounded-lg p-4 border border-border">
            <h2 className="font-semibold">
              {selected.titleZh}
              <span className="text-muted-foreground font-normal ml-2 text-sm">
                {selected.title}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {selected.type === "short" ? "Short passage" : "Mini story"} &middot;{" "}
              {selected.paragraphs.length} paragraph
              {selected.paragraphs.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPinyin((s) => !s)}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${
                showPinyin
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {showPinyin ? "Hide" : "Show"} Pinyin
            </button>
            <button
              onClick={toggleAllTranslations}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${
                selected &&
                revealedTranslations.size === selected.paragraphs.length
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {selected &&
              revealedTranslations.size === selected.paragraphs.length
                ? "Hide"
                : "Show"}{" "}
              All Translations
            </button>
          </div>

          <div className="space-y-4">
            {selected.paragraphs.map((para, i) => (
              <div
                key={i}
                className="bg-card rounded-lg p-4 border border-border space-y-2"
              >
                <p className="text-base leading-relaxed">{para.chinese}</p>
                {showPinyin && (
                  <PinyinDisplay pinyin={para.pinyin} className="text-sm" />
                )}
                <button
                  onClick={() => toggleTranslation(i)}
                  className="text-xs text-primary"
                >
                  {revealedTranslations.has(i)
                    ? "Hide translation"
                    : "Show translation"}
                </button>
                {revealedTranslations.has(i) && (
                  <p className="text-sm text-muted-foreground">
                    {para.english}
                  </p>
                )}
              </div>
            ))}
          </div>

          {selected.vocabHighlights.length > 0 && (
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Key Vocabulary
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.vocabHighlights.map((word) => (
                  <span
                    key={word}
                    className="px-2 py-1 bg-muted rounded-lg text-sm"
                  >
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
              Short
            </button>
            <button
              onClick={() => setTab("story")}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                tab === "story"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Stories
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className="w-full text-left bg-card rounded-lg p-4 border border-border hover:border-primary transition-colors"
              >
                <p className="font-medium">{r.titleZh}</p>
                <p className="text-sm text-muted-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.paragraphs.length} paragraph
                  {r.paragraphs.length > 1 ? "s" : ""}
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No reading passages available for this level yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
