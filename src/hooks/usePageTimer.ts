"use client";

import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

/** Returns today's date as YYYY-MM-DD in the America/New_York (EST/EDT) timezone */
function todayEst(): string {
  const [m, d, y] = new Date()
    .toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/");
  return `${y}-${m}-${d}`;
}

async function saveElapsed(
  page: "characters" | "sentences",
  startTime: number,
): Promise<void> {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  if (elapsed <= 0) return;

  const today = todayEst();
  const field = page === "characters" ? "charactersSeconds" : "sentencesSeconds";
  const existing = await db.studyTimers.get(today);

  if (existing) {
    await db.studyTimers.update(today, {
      [field]: existing[field] + elapsed,
    });
  } else {
    await db.studyTimers.put({
      date: today,
      charactersSeconds: page === "characters" ? elapsed : 0,
      sentencesSeconds: page === "sentences" ? elapsed : 0,
    });
  }
}

/**
 * Automatically tracks time spent on a page.
 * Starts counting on mount, saves to DB on unmount or when the page is hidden.
 * Resets daily at midnight EST (each call to todayEst() returns the current date).
 */
export function usePageTimer(page: "characters" | "sentences"): void {
  const startTimeRef = useRef<number>(Date.now());
  const hiddenRef = useRef<boolean>(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    hiddenRef.current = document.hidden;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenRef.current = true;
        saveElapsed(page, startTimeRef.current);
      } else {
        hiddenRef.current = false;
        startTimeRef.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Save elapsed time on unmount, but only if not already hidden
      // (visibility handler already saved on hide)
      if (!hiddenRef.current) {
        saveElapsed(page, startTimeRef.current);
      }
    };
  }, [page]);
}

/** Returns today's accumulated study timer values (live, reactive) */
export function useTodayTimers(): {
  charactersSeconds: number;
  sentencesSeconds: number;
} {
  const result = useLiveQuery(() => db.studyTimers.get(todayEst()), []);

  return {
    charactersSeconds: result?.charactersSeconds ?? 0,
    sentencesSeconds: result?.sentencesSeconds ?? 0,
  };
}

/** Formats seconds as MM:SS or H:MM:SS */
export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
