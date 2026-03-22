"use client";

import { useState, useCallback, useRef } from "react";
import { db } from "@/lib/db";
import {
  reviewCard as reviewSrsCard,
  getDueCards,
  getNewCards,
  createNewSrsCard,
  Rating,
} from "@/lib/srs";
import { recordReview } from "./useStats";
import type { SrsCardState } from "@/types";
import type { Grade } from "ts-fsrs";

interface ReviewSession {
  cards: SrsCardState[];
  currentIndex: number;
  isFlipped: boolean;
  isComplete: boolean;
  totalReviewed: number;
  correctCount: number;
}

export function useReview(module: SrsCardState["module"]) {
  const [session, setSession] = useState<ReviewSession>({
    cards: [],
    currentIndex: 0,
    isFlipped: false,
    isComplete: false,
    totalReviewed: 0,
    correctCount: 0,
  });
  const [loaded, setLoaded] = useState(false);

  // Store the latest idPrefix so reload() can reuse it
  const prefixRef = useRef<string | undefined>(undefined);

  const loadCards = useCallback(
    async (idPrefix?: string) => {
      const prefix = idPrefix ?? prefixRef.current;
      prefixRef.current = prefix;

      const due = await getDueCards(module, 20, prefix);
      const newCards =
        due.length < 5
          ? await getNewCards(module, 10 - Math.min(due.length, 5), prefix)
          : [];
      const allCards = [...due, ...newCards];

      setSession({
        cards: allCards,
        currentIndex: 0,
        isFlipped: false,
        isComplete: allCards.length === 0,
        totalReviewed: 0,
        correctCount: 0,
      });
      setLoaded(true);
    },
    [module]
  );

  const flip = useCallback(() => {
    setSession((s) => ({ ...s, isFlipped: true }));
  }, []);

  const rate = useCallback(
    async (grade: Grade) => {
      const card = session.cards[session.currentIndex];
      if (!card) return;

      const updated = reviewSrsCard(card, grade);
      await db.srsCards.put(updated);

      const correct = grade >= Rating.Good;
      await recordReview(correct);

      setSession((s) => {
        const nextIndex = s.currentIndex + 1;
        return {
          ...s,
          currentIndex: nextIndex,
          isFlipped: false,
          isComplete: nextIndex >= s.cards.length,
          totalReviewed: s.totalReviewed + 1,
          correctCount: s.correctCount + (correct ? 1 : 0),
        };
      });
    },
    [session.cards, session.currentIndex]
  );

  const currentCard = session.cards[session.currentIndex] ?? null;

  return {
    currentCard,
    isFlipped: session.isFlipped,
    isComplete: session.isComplete,
    loaded,
    totalReviewed: session.totalReviewed,
    correctCount: session.correctCount,
    totalCards: session.cards.length,
    flip,
    rate,
    loadCards,
  };
}

export { createNewSrsCard, Rating };
