"use client";

import { useState, useEffect, useCallback } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { loadSentences } from "@/lib/data-loader";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import type { SentenceExercise } from "@/types";

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
  const [exercises, setExercises] = useState<SentenceExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [shuffledBank, setShuffledBank] = useState<string[]>([]);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    loadSentences(level)
      .then((data) => {
        setExercises(shuffleArray(data));
        setCurrentIndex(0);
      })
      .catch(() => setExercises([]));
  }, [level]);

  const exercise = exercises[currentIndex] ?? null;

  useEffect(() => {
    if (exercise) {
      setShuffledBank(shuffleArray(exercise.wordBank));
      setSelected([]);
      setResult(null);
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

  const handleCheck = () => {
    if (!exercise) return;
    const userSentence = selected.join("");
    const isCorrect = userSentence === exercise.targetSentence;
    setResult(isCorrect ? "correct" : "incorrect");
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1));
  };

  if (!exercise) {
    return (
      <div className="tab-color-4 space-y-6">
        <div className="flex items-center justify-between">
          <TrilingualLabel chinese="造句" pinyin="zàojù" english="Sentences" size="lg" />
          <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
        </div>
        <p className="text-center text-muted-foreground py-8">
          <TrilingualLabel chinese="还没有练习题" pinyin="hái méiyǒu liànxí tí" english="No exercises yet" size="sm" />
        </p>
      </div>
    );
  }

  return (
    <div className="tab-color-4 space-y-6">
      <div className="flex items-center justify-between">
        <TrilingualLabel chinese="造句" pinyin="zàojù" english="Sentences" size="lg" />
        <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
      </div>

      {/* Target meaning */}
      <div>
        <p className="text-center opacity-50 mb-2">
          <TrilingualLabel chinese="翻译" pinyin="fānyì" english="Translate" size="xs" />
        </p>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-base font-medium">{exercise.targetMeaning}</p>
        </div>
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
              <TrilingualLabel chinese="正确！" pinyin="zhèngquè！" english="Correct!" size="sm" />
            ) : (
              <TrilingualLabel chinese="不太对，再试一下" pinyin="bú tài duì, zài shì yīxià" english="Not quite, try again" size="sm" />
            )}
          </p>
          {result === "incorrect" && (
            <div className="mt-2 space-y-1">
              <p className="text-sm">{exercise.targetSentence}</p>
              <PinyinDisplay
                pinyin={exercise.targetPinyin}
                className="text-sm"
              />
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
        {result === "correct" && currentIndex < exercises.length - 1 && (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            <TrilingualLabel chinese="下一题" pinyin="xià yī tí" english="Next" size="xs" />
          </button>
        )}
      </div>
    </div>
  );
}
