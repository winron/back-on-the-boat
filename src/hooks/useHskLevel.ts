"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { HskLevel, PageKey } from "@/types";

const DEFAULT_LEVELS: Record<PageKey, HskLevel> = {
  characters: 1,
  grammar: 1,
  sentences: 1,
  reading: 1,
};

export function useHskLevel(pageKey?: PageKey) {
  const [level, setLevelState] = useState<HskLevel>(1);

  useEffect(() => {
    if (pageKey) {
      db.pageLevels.get("pageLevels").then((pl) => {
        if (pl && pl[pageKey]) {
          setLevelState(pl[pageKey]);
        }
      });
    } else {
      db.settings.get("settings").then((s) => {
        if (s?.currentHskLevel) setLevelState(s.currentHskLevel);
      });
    }
  }, [pageKey]);

  const setLevel = useCallback(
    (l: HskLevel) => {
      setLevelState(l);
      if (pageKey) {
        db.pageLevels.get("pageLevels").then((pl) => {
          if (pl) {
            db.pageLevels.update("pageLevels", { [pageKey]: l });
          } else {
            db.pageLevels.put({
              id: "pageLevels",
              ...DEFAULT_LEVELS,
              [pageKey]: l,
            });
          }
        });
      } else {
        db.settings.get("settings").then((s) => {
          if (s) {
            db.settings.update("settings", { currentHskLevel: l });
          } else {
            db.settings.put({
              id: "settings",
              currentHskLevel: l,
              theme: "dark",
              dailyGoal: 20,
              showPinyin: true,
            });
          }
        });
      }
    },
    [pageKey]
  );

  return { level, setLevel };
}
