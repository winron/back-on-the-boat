"use client";

import { useState, useEffect } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { useReview, createNewSrsCard } from "@/hooks/useReview";
import { loadVocabulary } from "@/lib/data-loader";
import { db } from "@/lib/db";
import { useTTS } from "@/hooks/useTTS";
import ReviewCard from "@/components/character/ReviewCard";
import LearnSection from "@/components/character/LearnSection";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import type { HskWord } from "@/types";

type Mode = "review" | "learn";

const modeLabels: Record<Mode, { chinese: string; pinyin: string; english: string }> = {
  review: { chinese: "复习", pinyin: "fùxí", english: "Review" },
  learn: { chinese: "学习", pinyin: "xuéxí", english: "Learn" },
};

const posMap: Record<string, string> = {
  a: "adjective",
  ad: "adverb + adjective",
  an: "adjective + noun",
  b: "distinguishing word",
  c: "conjunction",
  cc: "coordinating conjunction",
  d: "adverb",
  e: "exclamation",
  f: "directional word",
  g: "morpheme",
  k: "suffix",
  m: "numeral",
  n: "noun",
  nr: "proper noun (person)",
  ns: "proper noun (place)",
  nz: "proper noun (other)",
  p: "preposition",
  q: "measure word",
  qt: "time measure word",
  qv: "verbal measure word",
  r: "pronoun",
  t: "time word",
  u: "particle",
  v: "verb",
  vn: "verb + noun",
  y: "modal particle",
};

function expandPos(pos: string): string {
  return pos
    .split(/[,/]\s*|\s+\/\s+/)
    .map((abbr) => posMap[abbr.trim()] || abbr.trim())
    .join(", ");
}

export default function CharactersPage() {
  const { level, setLevel } = useHskLevel("characters");
  const { unlockedLevel } = useUnlockedLevel();
  const [mode, setMode] = useState<Mode>("review");
  const [words, setWords] = useState<HskWord[]>([]);
  const review = useReview("characters");

  useTTS();

  // Load vocab, seed SRS cards, then load review cards for current level
  useEffect(() => {
    const levelPrefix = `hsk${level}-`;

    loadVocabulary(level)
      .then(async (vocab) => {
        setWords(vocab);

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

  // Group words by unit for learn mode
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


  return (
    <div className="tab-color-2 space-y-6">
      <div className="flex items-center justify-between">
        <TrilingualLabel chinese="汉字" pinyin="hànzì" english="Characters" size="lg" />
        <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(["review", "learn"] as Mode[]).map((m) => (
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
                <TrilingualLabel chinese="复习完了" pinyin="fùxí wán le" english="All caught up!" size="sm" />
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {review.totalReviewed > 0
                  ? `${review.totalReviewed} cards reviewed (${review.correctCount} correct)`
                  : "暂时没有要复习的，晚点再来。"}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <button
                  onClick={() => review.loadCards(`hsk${level}-`)}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm"
                >
                  <TrilingualLabel chinese="再查一下" pinyin="zài chá yīxià" english="Check again" size="xs" />
                </button>
                <button
                  onClick={() => review.loadAllForPractice(`hsk${level}-`)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                >
                  <TrilingualLabel chinese="练习" pinyin="liànxí" english="Practice all" size="xs" />
                </button>
              </div>
            </div>
          ) : currentWord ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {review.totalReviewed + 1} / {review.totalCards}
              </p>
              <ReviewCard
                key={currentWord.id}
                word={currentWord}
                isFlipped={review.isFlipped}
                onFlip={review.flip}
                onRate={review.rate}
              />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              <TrilingualLabel chinese="加载中…" pinyin="jiāzài zhōng" english="Loading…" size="sm" />
            </p>
          )}
        </>
      )}

      {mode === "learn" && (
        <LearnSection unitGroups={unitGroups} level={level} expandPos={expandPos} />
      )}
    </div>
  );
}
