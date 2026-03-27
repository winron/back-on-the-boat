"use client";

import { useState, useEffect, useCallback } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { loadSentences } from "@/lib/data-loader";
import { db } from "@/lib/db";
import { getDueCards, getNewCards, createNewSrsCard, reviewCard, Rating } from "@/lib/srs";
import { recordReview } from "@/hooks/useStats";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import type { SentenceExercise, SrsCardState, HskLevel } from "@/types";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SentencesPage() {
  const { level, setLevel } = useHskLevel("sentences");
  const { unlockedLevel } = useUnlockedLevel();

  const [exerciseMap, setExerciseMap] = useState<Map<string, SentenceExercise>>(new Map());
  const [sessionCards, setSessionCards] = useState<SrsCardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [shuffledBank, setShuffledBank] = useState<string[]>([]);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadSession = useCallback(async (exercises: SentenceExercise[], lv: HskLevel) => {
    const prefix = `s${lv}-`;

    // Seed any cards that don't exist yet
    const existing = await db.srsCards
      .where("module").equals("sentences")
      .filter((c) => c.id.startsWith(prefix))
      .toArray();
    const existingIds = new Set(existing.map((c) => c.id));
    const toSeed = exercises
      .filter((e) => !existingIds.has(e.id))
      .map((e) => createNewSrsCard(e.id, "sentences"));
    if (toSeed.length > 0) await db.srsCards.bulkAdd(toSeed);

    // Build session queue: due first, then new
    const due = await getDueCards("sentences", 20, prefix);
    const newCards =
      due.length < 5
        ? await getNewCards("sentences", 10 - Math.min(due.length, 5), prefix)
        : [];
    const session = [...due, ...newCards];

    // Mastery stats
    const allCards = await db.srsCards
      .where("module").equals("sentences")
      .filter((c) => c.id.startsWith(prefix))
      .toArray();
    const mastered = allCards.filter((c) => (c.bestGrade ?? 0) >= 3).length;

    setSessionCards(session);
    setCurrentIndex(0);
    setMasteredCount(mastered);
    setTotalCount(exercises.length);
    setResult(null);
    setHasRated(false);
    setLoaded(true);
  }, []);

  useEffect(() => {
    setLoaded(false);
    loadSentences(level)
      .then((data) => {
        setExerciseMap(new Map(data.map((e) => [e.id, e])));
        loadSession(data, level);
      })
      .catch(() => {
        setExerciseMap(new Map());
        setLoaded(true);
      });
  }, [level, loadSession]);

  const currentCard = sessionCards[currentIndex] ?? null;
  const exercise = currentCard ? (exerciseMap.get(currentCard.id) ?? null) : null;
  const isComplete = loaded && currentIndex >= sessionCards.length;

  // Reset word bank when exercise changes
  useEffect(() => {
    if (exercise) {
      setShuffledBank(shuffleArray(exercise.wordBank));
      setSelected([]);
      setResult(null);
      setHasRated(false);
    }
  }, [exercise]);

  const handleWordTap = (word: string, index: number) => {
    setSelected((s) => [...s, word]);
    setShuffledBank((b) => b.filter((_, i) => i !== index));
  };

  const handleSelectedTap = (word: string, index: number) => {
    setShuffledBank((b) => [...b, word]);
    setSelected((s) => s.filter((_, i) => i !== index));
  };

  const handleCheck = useCallback(async () => {
    if (!exercise || !currentCard) return;
    const isCorrect = selected.join("") === exercise.targetSentence;

    if (!hasRated) {
      const grade = isCorrect ? Rating.Good : Rating.Again;
      const updated = reviewCard(currentCard, grade);
      if (isCorrect) {
        const prevBest = currentCard.bestGrade ?? 0;
        updated.bestGrade = Math.max(prevBest, Rating.Good);
        if (prevBest < 3) setMasteredCount((n) => n + 1);
      }
      await db.srsCards.put(updated);
      await recordReview(isCorrect);
      setHasRated(true);
      setSessionCards((cards) => cards.map((c) => (c.id === updated.id ? updated : c)));
    }

    setResult(isCorrect ? "correct" : "incorrect");
  }, [exercise, currentCard, selected, hasRated]);

  const handleNext = () => setCurrentIndex((i) => i + 1);

  const header = (
    <div className="flex items-center justify-between">
      <TrilingualLabel chinese="造句" pinyin="zàojù" english="Sentences" size="lg" />
      <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
    </div>
  );

  if (!loaded) {
    return (
      <div className="tab-color-4 space-y-6">
        {header}
        <p className="text-center text-muted-foreground py-8">
          <TrilingualLabel chinese="加载中…" pinyin="jiāzài zhōng" english="Loading…" size="sm" />
        </p>
      </div>
    );
  }

  if (isComplete) {
    const pct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
    return (
      <div className="tab-color-4 space-y-6">
        {header}
        <div className="text-center py-12 space-y-2">
          <p className="text-lg font-medium">
            <TrilingualLabel chinese="做完了！" pinyin="zuò wán le!" english="Session complete!" size="sm" />
          </p>
          <p className="text-sm text-muted-foreground">
            {masteredCount} / {totalCount} mastered ({pct}%)
          </p>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="tab-color-4 space-y-6">
        {header}
        <p className="text-center text-muted-foreground py-8">
          <TrilingualLabel chinese="还没有练习题" pinyin="hái méiyǒu liànxí tí" english="No exercises yet" size="sm" />
        </p>
      </div>
    );
  }

  return (
    <div className="tab-color-4 space-y-6">
      {header}

      {/* 翻译 label left, counter right */}
      <div className="flex items-center justify-between">
        <p className="opacity-50">
          <TrilingualLabel chinese="翻译" pinyin="fānyì" english="Translate" size="xs" />
        </p>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {sessionCards.length}
        </span>
      </div>

      {/* Target meaning */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <p className="text-base font-medium">{exercise.targetMeaning}</p>
      </div>

      {/* Selected words (answer area) */}
      <div className="min-h-[60px] bg-muted rounded-lg p-3 flex flex-wrap gap-2">
        {selected.map((word, i) => (
          <button
            key={`${word}-${i}`}
            onClick={() => handleSelectedTap(word, i)}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {shuffledBank.map((word, i) => (
          <button
            key={`${word}-${i}`}
            onClick={() => handleWordTap(word, i)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-medium hover:border-primary transition-colors"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg p-4 ${
            result === "correct"
              ? "bg-green-950 border border-green-800"
              : "bg-red-950 border border-red-800"
          }`}
        >
          <p className="font-medium">
            {result === "correct" ? (
              <TrilingualLabel chinese="答对了！" pinyin="dá duì le!" english="Got it right!" size="sm" />
            ) : (
              <TrilingualLabel chinese="不太对，再试一下" pinyin="bú tài duì, zài shì yí xià" english="Not quite, try again" size="sm" />
            )}
          </p>
          {result === "incorrect" && (
            <div className="mt-2 space-y-1">
              <p className="text-sm">{exercise.targetSentence}</p>
              <PinyinDisplay pinyin={exercise.targetPinyin} className="text-sm" />
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <AudioButton text={exercise.targetSentence} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!result && (
          <button
            onClick={handleCheck}
            disabled={selected.length === 0}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-30"
          >
            <TrilingualLabel chinese="确认" pinyin="quèrèn" english="Confirm" size="xs" />
          </button>
        )}
        {result === "incorrect" && (
          <button
            onClick={() => setResult(null)}
            className="flex-1 py-3 bg-muted text-foreground rounded-lg font-medium"
          >
            <TrilingualLabel chinese="再试" pinyin="zài shì" english="Try Again" size="xs" />
          </button>
        )}
        {result === "correct" && (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            <TrilingualLabel chinese="下一题" pinyin="xià yì tí" english="Next" size="xs" />
          </button>
        )}
      </div>
    </div>
  );
}
