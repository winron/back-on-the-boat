"use client";

import { useState, useEffect, useCallback } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { useReview, createNewSrsCard } from "@/hooks/useReview";
import { usePageTimer } from "@/hooks/usePageTimer";
import { loadVocabulary } from "@/lib/data-loader";
import { db } from "@/lib/db";
import { useTTS } from "@/hooks/useTTS";
import ReviewCard from "@/components/character/ReviewCard";
import AuditModal from "@/components/character/AuditModal";
import LearnSection from "@/components/character/LearnSection";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import type { HskWord, HskLevel, WordCorrection } from "@/types";

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

function applyCorrection(word: HskWord, correction: WordCorrection | undefined): HskWord {
  if (!correction) return word;
  return {
    ...word,
    pinyin: correction.pinyin ?? word.pinyin,
    meaning: correction.meaning ?? word.meaning,
  };
}

export default function CharactersPage() {
  const { level, setLevel } = useHskLevel("characters");
  const { unlockedLevel } = useUnlockedLevel();
  const [mode, setMode] = useState<Mode>("review");
  const [words, setWords] = useState<HskWord[]>([]);
  const [corrections, setCorrections] = useState<Map<string, WordCorrection>>(new Map());
  const [auditWord, setAuditWord] = useState<HskWord | null>(null);
  const review = useReview("characters");

  useTTS();
  usePageTimer("characters");

  // Load vocab, seed SRS cards, then load review cards for current level
  useEffect(() => {
    const levelPrefix = `hsk${level}-`;

    loadVocabulary(level)
      .then(async (vocab) => {
        // Pre-load previous levels' vocab so recall cards resolve to a word
        let allWords: HskWord[] = [...vocab];
        for (let i = 1; i < level; i++) {
          const prev = await loadVocabulary(i as HskLevel);
          allWords = [...allWords, ...prev];
        }
        setWords(allWords);

        // Load corrections from DB
        const correctionRecords = await db.wordCorrections.toArray();
        setCorrections(new Map(correctionRecords.map((c) => [c.id, c])));

        // Seed SRS cards for current-level words that don't exist yet
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

        // Load review cards with recall mixing from previous levels
        const recallPrefixes = Array.from(
          { length: level - 1 },
          (_, i) => `hsk${i + 1}-`,
        );
        await review.loadCards(levelPrefix, recallPrefixes.length ? recallPrefixes : undefined);
      })
      .catch(() => {
        setWords([]);
      });
  }, [level]);

  const rawCurrentWord = review.currentCard
    ? words.find((w) => w.id === review.currentCard!.id)
    : null;

  const currentWord = rawCurrentWord
    ? applyCorrection(rawCurrentWord, corrections.get(rawCurrentWord.id))
    : null;

  const handleAuditSaved = useCallback(
    (wordId: string, corr: { pinyin?: string; meaning?: string }) => {
      setCorrections((prev) => {
        const next = new Map(prev);
        const existing = next.get(wordId);
        next.set(wordId, {
          id: wordId,
          pinyin: corr.pinyin ?? existing?.pinyin,
          meaning: corr.meaning ?? existing?.meaning,
          correctedAt: new Date().toISOString(),
        });
        return next;
      });
    },
    [],
  );

  // Group words by unit for learn mode — apply corrections so learn view matches review view
  const unitGroups = words.reduce<
    { name: string; unitIndex: number; words: HskWord[] }[]
  >((acc, word) => {
    const correctedWord = applyCorrection(word, corrections.get(word.id));
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.name === correctedWord.unitName) {
      lastGroup.words.push(correctedWord);
    } else {
      acc.push({ name: correctedWord.unitName, unitIndex: correctedWord.unitIndex, words: [correctedWord] });
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
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                <button
                  onClick={() => {
                    const recallPrefixes = Array.from({ length: level - 1 }, (_, i) => `hsk${i + 1}-`);
                    review.loadCards(`hsk${level}-`, recallPrefixes.length ? recallPrefixes : undefined);
                  }}
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
                onAudit={() => setAuditWord(currentWord)}
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
        <LearnSection unitGroups={unitGroups} level={level} expandPos={expandPos} onAudit={(word) => setAuditWord(word)} />
      )}

      {auditWord && (
        <AuditModal
          word={auditWord}
          onClose={() => setAuditWord(null)}
          onSaved={(corr) => handleAuditSaved(auditWord.id, corr)}
        />
      )}
    </div>
  );
}
