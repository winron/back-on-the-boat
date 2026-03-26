"use client";

import { useState, useEffect, useCallback } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { useReview, createNewSrsCard } from "@/hooks/useReview";
import { loadVocabulary } from "@/lib/data-loader";
import { getUnitNameZh } from "@/lib/unit-names";
import { db } from "@/lib/db";
import { useTTS } from "@/hooks/useTTS";
import ReviewCard from "@/components/character/ReviewCard";
import StrokeOrder from "@/components/character/StrokeOrder";
import CharacterCard from "@/components/character/CharacterCard";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import type { HskWord } from "@/types";

type Mode = "review" | "learn" | "browse";

const modeLabels: Record<Mode, { chinese: string; pinyin: string; english: string }> = {
  review: { chinese: "复习", pinyin: "fùxí", english: "Review" },
  learn: { chinese: "学习", pinyin: "xuéxí", english: "Learn" },
  browse: { chinese: "浏览", pinyin: "liúlǎn", english: "Browse" },
};

export default function CharactersPage() {
  const { level, setLevel } = useHskLevel("characters");
  const { unlockedLevel } = useUnlockedLevel();
  const [mode, setMode] = useState<Mode>("review");
  const [words, setWords] = useState<HskWord[]>([]);
  const [browseIndex, setBrowseIndex] = useState(0);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const review = useReview("characters");

  useTTS();

  // Load vocab, seed SRS cards, then load review cards for current level
  useEffect(() => {
    setBrowseIndex(0);

    const levelPrefix = `hsk${level}-`;

    loadVocabulary(level)
      .then(async (vocab) => {
        setWords(vocab);

        // Default: expand only the first unit
        if (vocab.length > 0) {
          setExpandedUnits(new Set([vocab[0].unitName]));
        }

        // Seed SRS cards for words that don't exist yet
        const existingIds = new Set(
          (
            await db.srsCards.where("module").equals("characters").toArray()
          ).map((c) => c.id)
        );

        const newCards = vocab
          .filter((w) => w.id.startsWith(levelPrefix) && !existingIds.has(w.id))
          .map((w) => createNewSrsCard(w.id, "characters"));

        if (newCards.length > 0) {
          await db.srsCards.bulkPut(newCards);
        }

        // Load review cards filtered to this level
        await review.loadCards(levelPrefix);
      })
      .catch(() => {
        setWords([]);
      });
  }, [level]);

  const currentWord = review.currentCard
    ? words.find((w) => w.id === review.currentCard!.id)
    : null;

  const browseWord = words[browseIndex] ?? null;

  // Group words by unit for browse/learn mode, carrying unitIndex for Chinese name lookup
  const unitGroups = words.reduce<
    { name: string; unitIndex: number; words: HskWord[] }[]
  >((acc, word) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.name === word.unitName) {
      lastGroup.words.push(word);
    } else {
      acc.push({ name: word.unitName, unitIndex: word.unitIndex, words: [word] });
    }
    return acc;
  }, []);

  function toggleUnit(name: string) {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  const toggleReveal = useCallback((id: string) => {
    setRevealedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Chinese name for the current learn-mode word's unit
  const learnUnitNameZh = browseWord
    ? (getUnitNameZh(level, browseWord.unitIndex) ?? browseWord.unitName)
    : "";

  return (
    <div className="tab-color-2 space-y-6">
      <div className="flex items-center justify-between">
        <TrilingualLabel chinese="汉字" pinyin="hànzì" english="Characters" size="lg" />
        <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(["review", "learn", "browse"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <TrilingualLabel {...modeLabels[m]} size="sm" />
          </button>
        ))}
      </div>

      {mode === "review" && (
        <>
          {!review.loaded ? (
            <p className="text-center text-muted-foreground py-8">
              <TrilingualLabel chinese="加载中…" pinyin="jiāzài zhōng" english="Loading…" size="sm" />
            </p>
          ) : review.isComplete ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium">
                <TrilingualLabel chinese="全部完成！" pinyin="quánbù wánchéng！" english="All caught up!" size="sm" />
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {review.totalReviewed > 0
                  ? `${review.totalReviewed} cards reviewed (${review.correctCount} correct)`
                  : "暂无到期卡片，稍后再来。"}
              </p>
              <button
                onClick={() => review.loadCards(`hsk${level}-`)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
              >
                <TrilingualLabel chinese="再次检查" pinyin="zàicì jiǎnchá" english="Check again" size="xs" />
              </button>
            </div>
          ) : currentWord ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {review.totalReviewed + 1} / {review.totalCards}
              </p>
              <ReviewCard
                word={currentWord}
                isFlipped={review.isFlipped}
                onFlip={review.flip}
                onRate={review.rate}
              />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              <TrilingualLabel chinese="加载卡片…" pinyin="jiāzài kǎpiàn" english="Loading cards…" size="sm" />
            </p>
          )}
        </>
      )}

      {mode === "learn" && browseWord && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground text-center">{learnUnitNameZh}</p>
          <CharacterCard word={browseWord} showPinyin />
          <StrokeOrder character={browseWord.simplified} />
          <div className="flex justify-between">
            <button
              onClick={() => setBrowseIndex((i) => Math.max(0, i - 1))}
              disabled={browseIndex === 0}
              className="px-4 py-2 bg-muted rounded-lg text-sm disabled:opacity-30"
            >
              <TrilingualLabel chinese="上一个" pinyin="shàng yī gè" english="Previous" size="xs" />
            </button>
            <span className="text-sm text-muted-foreground self-center">
              {browseIndex + 1} / {words.length}
            </span>
            <button
              onClick={() =>
                setBrowseIndex((i) => Math.min(words.length - 1, i + 1))
              }
              disabled={browseIndex === words.length - 1}
              className="px-4 py-2 bg-muted rounded-lg text-sm disabled:opacity-30"
            >
              <TrilingualLabel chinese="下一个" pinyin="xià yī gè" english="Next" size="xs" />
            </button>
          </div>
        </div>
      )}

      {mode === "learn" && !browseWord && words.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          暂无词汇数据。
        </p>
      )}

      {mode === "browse" && (
        <div className="space-y-1">
          {unitGroups.map((group) => {
            const nameZh = getUnitNameZh(level, group.unitIndex) ?? group.name;
            const isExpanded = expandedUnits.has(group.name);
            return (
              <div key={group.name}>
                {/* Accordion header */}
                <button
                  onClick={() => toggleUnit(group.name)}
                  className="w-full flex items-center justify-between px-3 py-2.5 mt-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base font-semibold">{nameZh}</span>
                    <span className="text-xs text-muted-foreground">{group.name}</span>
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">{group.words.length}</span>
                    <span className="text-sm transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▾
                    </span>
                  </span>
                </button>

                {/* Word list — shown when expanded */}
                {isExpanded && (
                  <div className="mt-1 space-y-1">
                    {group.words.map((word) => {
                      const revealed = revealedCards.has(word.id);
                      return (
                        <div
                          key={word.id}
                          className="bg-card rounded-lg p-4 border border-border flex items-center gap-4 cursor-pointer select-none"
                          onClick={() => toggleReveal(word.id)}
                        >
                          <span className="text-3xl w-12 text-center shrink-0">
                            {word.simplified}
                          </span>
                          <div className="flex-1 min-w-0">
                            {revealed ? (
                              <>
                                <p className="text-sm font-medium">{word.pinyin}</p>
                                {word.partOfSpeech && (
                                  <p className="text-xs text-muted-foreground">{word.partOfSpeech}</p>
                                )}
                                <p className="text-sm text-foreground">{word.meaning}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">Tap to reveal</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {words.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              暂无词汇数据。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
