"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { HskLevel } from "@/types";

interface UnlockedLevelResult {
  charProgressLevel: HskLevel;
  sentProgressLevel: HskLevel;
  /** Alias for charProgressLevel — kept for backward compat */
  currentProgressLevel: HskLevel;
  /** Equals charProgressLevel — only characters unlock access to next level */
  unlockedLevel: HskLevel;
  /** Mastered character cards at charProgressLevel */
  masteredCount: number;
  totalCount: number;
  /** Mastered sentence cards at sentProgressLevel */
  sentMasteredCount: number;
  sentTotalCount: number;
  loading: boolean;
}

export function useUnlockedLevel(): UnlockedLevelResult {
  const result = useLiveQuery(async () => {
    // --- Characters progression (determines unlock) ---
    let charProgressLevel: HskLevel = 6;
    let charMastered = 0;
    let charTotal = 0;
    for (let level = 1; level <= 6; level++) {
      const cards = await db.srsCards
        .where("module")
        .equals("characters")
        .filter((c) => c.id.startsWith(`hsk${level}-`))
        .toArray();
      const total = cards.length;
      const mastered = cards.filter((c) => (c.bestGrade ?? 0) >= 3).length;
      const complete = total > 0 && mastered >= total;
      if (!complete) {
        charProgressLevel = level as HskLevel;
        charMastered = mastered;
        charTotal = total;
        break;
      }
    }

    // --- Sentences progression (independent — does not block unlock) ---
    let sentProgressLevel: HskLevel = 6;
    let sentMastered = 0;
    let sentTotal = 0;
    for (let level = 1; level <= 6; level++) {
      const cards = await db.srsCards
        .where("module")
        .equals("sentences")
        .filter((c) => c.id.startsWith(`s${level}-`))
        .toArray();
      const total = cards.length;
      const mastered = cards.filter((c) => (c.bestGrade ?? 0) >= 3).length;
      const complete = total > 0 && mastered >= total;
      if (!complete) {
        sentProgressLevel = level as HskLevel;
        sentMastered = mastered;
        sentTotal = total;
        break;
      }
    }

    return {
      charProgressLevel,
      sentProgressLevel,
      masteredCount: charMastered,
      totalCount: charTotal,
      sentMasteredCount: sentMastered,
      sentTotalCount: sentTotal,
    };
  }, []);

  if (!result) {
    return {
      charProgressLevel: 1,
      sentProgressLevel: 1,
      currentProgressLevel: 1,
      unlockedLevel: 1,
      masteredCount: 0,
      totalCount: 0,
      sentMasteredCount: 0,
      sentTotalCount: 0,
      loading: true,
    };
  }

  return {
    ...result,
    currentProgressLevel: result.charProgressLevel,
    unlockedLevel: result.charProgressLevel,
    loading: false,
  };
}
