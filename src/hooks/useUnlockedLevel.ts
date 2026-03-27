"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { HskLevel } from "@/types";

interface UnlockedLevelResult {
  currentProgressLevel: HskLevel;
  unlockedLevel: HskLevel;
  /** Mastered character cards at current progress level */
  masteredCount: number;
  totalCount: number;
  /** Mastered sentence cards at current progress level */
  sentMasteredCount: number;
  sentTotalCount: number;
  loading: boolean;
}

export function useUnlockedLevel(): UnlockedLevelResult {
  const result = useLiveQuery(async () => {
    for (let level = 1; level <= 6; level++) {
      // Characters
      const charCards = await db.srsCards
        .where("module")
        .equals("characters")
        .filter((c) => c.id.startsWith(`hsk${level}-`))
        .toArray();
      const charTotal = charCards.length;
      const charMastered = charCards.filter((c) => (c.bestGrade ?? 0) >= 3).length;

      // Sentences
      const sentCards = await db.srsCards
        .where("module")
        .equals("sentences")
        .filter((c) => c.id.startsWith(`s${level}-`))
        .toArray();
      const sentTotal = sentCards.length;
      const sentMastered = sentCards.filter((c) => (c.bestGrade ?? 0) >= 3).length;

      const charComplete = charTotal > 0 && charMastered >= charTotal;
      const sentComplete = sentTotal > 0 && sentMastered >= sentTotal;

      if (!charComplete || !sentComplete) {
        return {
          currentProgressLevel: level as HskLevel,
          unlockedLevel: level as HskLevel,
          masteredCount: charMastered,
          totalCount: charTotal,
          sentMasteredCount: sentMastered,
          sentTotalCount: sentTotal,
        };
      }
    }

    // All levels complete
    return {
      currentProgressLevel: 6 as HskLevel,
      unlockedLevel: 6 as HskLevel,
      masteredCount: 0,
      totalCount: 0,
      sentMasteredCount: 0,
      sentTotalCount: 0,
    };
  }, []);

  if (!result) {
    return {
      currentProgressLevel: 1,
      unlockedLevel: 1,
      masteredCount: 0,
      totalCount: 0,
      sentMasteredCount: 0,
      sentTotalCount: 0,
      loading: true,
    };
  }

  return { ...result, loading: false };
}
