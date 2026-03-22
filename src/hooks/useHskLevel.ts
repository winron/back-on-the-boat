"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { HskLevel } from "@/types";

export function useHskLevel() {
  const [level, setLevelState] = useState<HskLevel>(1);

  useEffect(() => {
    db.settings.get("settings").then((s) => {
      if (s?.currentHskLevel) setLevelState(s.currentHskLevel);
    });
  }, []);

  const setLevel = useCallback((l: HskLevel) => {
    setLevelState(l);
    db.settings
      .get("settings")
      .then((s) => {
        if (s) {
          db.settings.update("settings", { currentHskLevel: l });
        } else {
          db.settings.put({
            id: "settings",
            currentHskLevel: l,
            theme: "system",
            dailyGoal: 20,
            showPinyin: true,
          });
        }
      });
  }, []);

  return { level, setLevel };
}
