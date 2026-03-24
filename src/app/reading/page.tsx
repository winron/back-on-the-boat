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

  const allTranslationsShown =
    selected != null && revealedTranslations.size === selected.paragraphs.length;

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
            className="text-sm text-primary flex items-center gap-1"
          >
            <TrilingualLabel
              chinese="返回列表"
              pinyin="fǎnhuí lièbiǎo"
              english="Back to list"
              size="xs"
            />
          </button>

          <div className="bg-card rounded-lg p-4 border border-border">
            <h2 className="font-semibold">
              {selected.titleZh}
              <span className="text-muted-foreground font-normal ml-2 text-sm">
                {selected.title}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {selected.type === "short" ? (
                <TrilingualLabel chinese="短文" pinyin="duǎn wén" english="Short passage" size="xs" />
              ) : (
                <TrilingualLabel chinese="故事" pinyin="gùshi" english="Mini story" size="xs" />
              )}
              {" · "}
              {selected.paragraphs.length}{" "}
              <TrilingualLabel chinese="段" pinyin="duàn" english="paragraph(s)" size="xs" />
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
              <TrilingualLabel
                chinese={showPinyin ? "隐藏拼音" : "显示拼音"}
                pinyin={showPinyin ? "yǐncáng pīnyīn" : "xiǎnshì pīnyīn"}
                english={showPinyin ? "Hide Pinyin" : "Show Pinyin"}
                size="xs"
              />
            </button>
            <button
              onClick={toggleAllTranslations}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${
                allTranslationsShown
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <TrilingualLabel
                chinese={allTranslationsShown ? "隐藏翻译" : "显示翻译"}
                pinyin={allTranslationsShown ? "yǐncáng fānyì" : "xiǎnshì fānyì"}
                english={allTranslationsShown ? "Hide All Translations" : "Show All Translations"}
                size="xs"
              />
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
                  <TrilingualLabel
                    chinese={revealedTranslations.has(i) ? "隐藏翻译" : "显示翻译"}
                    pinyin={revealedTranslations.has(i) ? "yǐncáng fānyì" : "xiǎnshì fānyì"}
                    english={revealedTranslations.has(i) ? "Hide translation" : "Show translation"}
                    size="xs"
                  />
                </button>
                {revealedTranslations.has(i) && (
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
                onClick={() => handleSelect(r.id)}
                className="w-full text-left bg-card rounded-lg p-4 border border-border hover:border-primary transition-colors"
              >
                <p className="font-medium">{r.titleZh}</p>
                <p className="text-sm text-muted-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.paragraphs.length} <TrilingualLabel chinese="段" pinyin="duàn" english="paragraph(s)" size="xs" />
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                <TrilingualLabel chinese="暂无阅读材料" pinyin="zàn wú yuèdú cáiliào" english="No reading passages yet" size="sm" />
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
