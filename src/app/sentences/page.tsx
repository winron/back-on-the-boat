"use client";

import { useState, useEffect, useCallback } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { loadSentences } from "@/lib/data-loader";
import LevelSelector from "@/components/shared/LevelSelector";
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
  const { level, setLevel } = useHskLevel();
  const [exercises, setExercises] = useState<SentenceExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [shuffledBank, setShuffledBank] = useState<string[]>([]);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    loadSentences(level)
      .then((data) => {
        // Shuffle exercise order daily so content feels fresh
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
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Sentences</h1>
        <LevelSelector currentLevel={level} onSelect={setLevel} />
        <p className="text-center text-muted-foreground py-8">
          No sentence exercises available yet. Run the data preparation script.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Sentences</h1>
      <LevelSelector currentLevel={level} onSelect={setLevel} />

      <p className="text-sm text-muted-foreground">
        {currentIndex + 1} / {exercises.length}
      </p>

      {/* Target meaning */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-muted-foreground text-sm mb-1">Translate:</p>
        <p className="text-base font-medium">{exercise.targetMeaning}</p>
      </div>

      {/* Selected words (answer area) */}
      <div className="min-h-[60px] bg-muted rounded-xl p-3 flex flex-wrap gap-2">
        {selected.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Tap words below to build the sentence
          </p>
        )}
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
          className={`rounded-xl p-4 ${
            result === "correct"
              ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
          }`}
        >
          <p className="font-medium">
            {result === "correct" ? "Correct!" : "Not quite"}
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
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-30"
          >
            Check
          </button>
        )}
        {result && currentIndex < exercises.length - 1 && (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
