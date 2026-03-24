"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { HskLevel } from "@/types";

interface UnlockedLevelResult {
  /** The level the user is currently progressing through */
  currentProgressLevel: HskLevel;
  /** Highest level the user can access (currentProgressLevel) */
  unlockedLevel: HskLevel;
  /** Number of mastered (Easy-rated) cards at the current progress level */
  masteredCount: number;
  /** Total seeded cards at the current progress level */
  totalCount: number;
  /** Whether data is still loading */
  loading: boolean;
}

export function useUnlockedLevel(): UnlockedLevelResult {
  const result = useLiveQuery(async () => {
    // For each level, check if all characters are mastered (bestGrade >= 3)
    let currentProgressLevel: HskLevel = 1;

    for (let level = 1; level <= 6; level++) {
      const prefix = `hsk${level}-`;
      const cards = await db.srsCards
        .where("module")
        .equals("characters")
        .filter((c) => c.id.startsWith(prefix))
        .toArray();

      const total = cards.length;
      const mastered = cards.filter((c) => (c.bestGrade ?? 0) >= 3).length;

      if (total === 0 || mastered < total) {
        // This level is not yet complete
        currentProgressLevel = level as HskLevel;
        return {
          currentProgressLevel,
          unlockedLevel: level as HskLevel,
          masteredCount: mastered,
          totalCount: total,
        };
      }
    }

    // All levels complete
    return {
      currentProgressLevel: 6 as HskLevel,
      unlockedLevel: 6 as HskLevel,
      masteredCount: 0,
      totalCount: 0,
    };
  }, []);

  if (!result) {
    return {
      currentProgressLevel: 1,
      unlockedLevel: 1,
      masteredCount: 0,
      totalCount: 0,
      loading: true,
    };
  }

  return { ...result, loading: false };
}
