"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { db } from "@/lib/db";

interface DisplaySettingsValue {
  showPinyin: boolean;
  showEnglish: boolean;
  togglePinyin: () => void;
  toggleEnglish: () => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsValue>({
  showPinyin: true,
  showEnglish: true,
  togglePinyin: () => {},
  toggleEnglish: () => {},
});

export function useDisplaySettings() {
  return useContext(DisplaySettingsContext);
}

export function DisplaySettingsProvider({ children }: { children: ReactNode }) {
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);

  useEffect(() => {
    db.displaySettings.get("displaySettings").then((s) => {
      if (s) {
        setShowPinyin(s.showPinyin);
        setShowEnglish(s.showEnglish);
      }
    });
  }, []);

  const persist = useCallback((pinyin: boolean, english: boolean) => {
    db.displaySettings.put({
      id: "displaySettings",
      showPinyin: pinyin,
      showEnglish: english,
    });
  }, []);

  const togglePinyin = useCallback(() => {
    setShowPinyin((prev) => {
      const next = !prev;
      persist(next, showEnglish);
      return next;
    });
  }, [showEnglish, persist]);

  const toggleEnglish = useCallback(() => {
    setShowEnglish((prev) => {
      const next = !prev;
      persist(showPinyin, next);
      return next;
    });
  }, [showPinyin, persist]);

  return (
    <DisplaySettingsContext value={{ showPinyin, showEnglish, togglePinyin, toggleEnglish }}>
      {children}
    </DisplaySettingsContext>
  );
}
