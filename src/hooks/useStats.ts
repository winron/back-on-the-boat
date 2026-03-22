"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { DailyStats } from "@/types";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useTodayStats(): DailyStats | undefined {
  return useLiveQuery(() => db.dailyStats.get(todayKey()));
}

export function useStreak(): number {
  const stats = useLiveQuery(() =>
    db.dailyStats.orderBy("date").reverse().toArray()
  );

  if (!stats || stats.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < stats.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedKey = expected.toISOString().slice(0, 10);

    if (stats[i].date === expectedKey && stats[i].cardsReviewed > 0) {
      streak++;
    } else if (i === 0 && stats[i].date !== expectedKey) {
      // today hasn't been studied yet, check from yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().slice(0, 10);
      if (stats[i].date === yKey && stats[i].cardsReviewed > 0) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}

export async function recordReview(correct: boolean): Promise<void> {
  const key = todayKey();
  const existing = await db.dailyStats.get(key);

  if (existing) {
    await db.dailyStats.update(key, {
      cardsReviewed: existing.cardsReviewed + 1,
      correctCount: existing.correctCount + (correct ? 1 : 0),
      totalCount: existing.totalCount + 1,
    });
  } else {
    await db.dailyStats.put({
      date: key,
      cardsReviewed: 1,
      cardsNew: 0,
      correctCount: correct ? 1 : 0,
      totalCount: 1,
      studyTimeSeconds: 0,
    });
  }
}
