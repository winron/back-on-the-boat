"use client";

import { useState, useEffect } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useReview, createNewSrsCard } from "@/hooks/useReview";
import { loadVocabulary } from "@/lib/data-loader";
import { db } from "@/lib/db";
import { useTTS } from "@/hooks/useTTS";
import ReviewCard from "@/components/character/ReviewCard";
import StrokeOrder from "@/components/character/StrokeOrder";
import CharacterCard from "@/components/character/CharacterCard";
import LevelSelector from "@/components/shared/LevelSelector";
import type { HskWord } from "@/types";

type Mode = "review" | "learn" | "browse";

export default function CharactersPage() {
  const { level, setLevel } = useHskLevel();
  const [mode, setMode] = useState<Mode>("review");
  const [words, setWords] = useState<HskWord[]>([]);
  const [browseIndex, setBrowseIndex] = useState(0);
  const review = useReview("characters");

  useTTS();

  // Load vocab, seed SRS cards, then load review cards for current level
  useEffect(() => {
    setBrowseIndex(0);

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

  const browseWord = words[browseIndex] ?? null;

  // Group words by unit for browse mode
  const unitGroups = words.reduce<{ name: string; words: HskWord[] }[]>((acc, word) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.name === word.unitName) {
      lastGroup.words.push(word);
    } else {
      acc.push({ name: word.unitName, words: [word] });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Characters</h1>
      </div>

      <LevelSelector currentLevel={level} onSelect={setLevel} />

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(["review", "learn", "browse"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "review" && (
        <>
          {!review.loaded ? (
            <p className="text-center text-muted-foreground py-8">
              Loading...
            </p>
          ) : review.isComplete ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">🎉</p>
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground text-sm mt-1">
                {review.totalReviewed > 0
                  ? `Reviewed ${review.totalReviewed} cards (${review.correctCount} correct)`
                  : "No cards due for review. Come back later or tap Check again."}
              </p>
              <button
                onClick={() => review.loadCards(`hsk${level}-`)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
              >
                Check again
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
              Loading cards...
            </p>
          )}
        </>
      )}

      {mode === "learn" && browseWord && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground text-center">
            {browseWord.unitName}
          </p>
          <CharacterCard word={browseWord} showPinyin />
          <StrokeOrder character={browseWord.simplified} />
          <div className="flex justify-between">
            <button
              onClick={() => setBrowseIndex((i) => Math.max(0, i - 1))}
              disabled={browseIndex === 0}
              className="px-4 py-2 bg-muted rounded-lg text-sm disabled:opacity-30"
            >
              Previous
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
              Next
            </button>
          </div>
        </div>
      )}

      {mode === "learn" && !browseWord && words.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No vocabulary data available for this level.
        </p>
      )}

      {mode === "browse" && (
        <div className="space-y-3">
          {unitGroups.map((group) => (
            <div key={group.name}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-2 px-1">
                {group.name}
              </h3>
              {group.words.map((word) => (
                <div
                  key={word.id}
                  className="bg-card rounded-xl p-4 border border-border flex items-center gap-4 mb-2"
                >
                  <span className="text-3xl w-12 text-center">
                    {word.simplified}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{word.pinyin}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {word.meaning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {words.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No vocabulary data available for this level.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
