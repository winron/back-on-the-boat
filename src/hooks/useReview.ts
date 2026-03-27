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

// Fetch due Review/Relearning cards from previous levels, prioritising
// struggling cards (bestGrade === 3) then most overdue.
export async function getRecallCards(
  module: SrsCardState["module"],
  prefixes: string[],
  limit: number,
): Promise<SrsCardState[]> {
  const now = new Date();
  const candidates: SrsCardState[] = [];

  for (const prefix of prefixes) {
    const cards = await db.srsCards
      .where("module")
      .equals(module)
      .filter(
        (c) =>
          c.id.startsWith(prefix) &&
          c.state >= 2 && // Review or Relearning only
          new Date(c.due) <= now,
      )
      .toArray();
    candidates.push(...cards);
  }

  // Struggling (bestGrade = 3) first, then most overdue
  candidates.sort((a, b) => {
    const ag = a.bestGrade ?? 0;
    const bg = b.bestGrade ?? 0;
    if (ag !== bg) return ag - bg;
    return new Date(a.due).getTime() - new Date(b.due).getTime();
  });

  return candidates.slice(0, limit);
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

  const prefixRef = useRef<string | undefined>(undefined);

  const loadCards = useCallback(
    async (idPrefix?: string, recallPrefixes?: string[]) => {
      const prefix = idPrefix ?? prefixRef.current;
      prefixRef.current = prefix;

      const due = await getDueCards(module, 20, prefix);
      const newCards =
        due.length < 5
          ? await getNewCards(module, 10 - Math.min(due.length, 5), prefix)
          : [];
      let cards: SrsCardState[] = [...due, ...newCards];

      // Sprinkle in recall cards from previous levels (1 per 4 main cards)
      if (recallPrefixes?.length) {
        const recall = await getRecallCards(module, recallPrefixes, 3);
        if (recall.length > 0) {
          const mixed: SrsCardState[] = [];
          let ri = 0;
          for (let i = 0; i < cards.length; i++) {
            if (i > 0 && i % 4 === 0 && ri < recall.length) mixed.push(recall[ri++]);
            mixed.push(cards[i]);
          }
          while (ri < recall.length) mixed.push(recall[ri++]);
          cards = mixed;
        }
      }

      setSession({
        cards,
        currentIndex: 0,
        isFlipped: false,
        isComplete: cards.length === 0,
        totalReviewed: 0,
        correctCount: 0,
      });
      setLoaded(true);
    },
    [module]
  );

  const loadAllForPractice = useCallback(
    async (idPrefix?: string) => {
      const prefix = idPrefix ?? prefixRef.current;
      prefixRef.current = prefix;

      const all = await db.srsCards
        .where("module")
        .equals(module)
        .filter((c) => !prefix || c.id.startsWith(prefix))
        .toArray();

      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }

      setSession({
        cards: all,
        currentIndex: 0,
        isFlipped: false,
        isComplete: all.length === 0,
        totalReviewed: 0,
        correctCount: 0,
      });
      setLoaded(true);
    },
    [module]
  );

  const flip = useCallback(() => {
    setSession((s) => ({ ...s, isFlipped: !s.isFlipped }));
  }, []);

  const rate = useCallback(
    async (grade: Grade) => {
      const card = session.cards[session.currentIndex];
      if (!card) return;

      const updated = reviewSrsCard(card, grade);

      // bestGrade: ratchet upward until mastered; once mastered (≥3), floor at 3
      const currentBest = card.bestGrade ?? 0;
      if (currentBest >= 3) {
        updated.bestGrade = Math.max(3, grade as number);
      } else {
        updated.bestGrade = Math.max(currentBest, grade as number);
      }

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
    loadAllForPractice,
  };
}

export { createNewSrsCard, Rating };
