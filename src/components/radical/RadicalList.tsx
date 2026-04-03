"use client";

import { useEffect, useState } from "react";
import { loadRadicals } from "@/lib/data-loader";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import RadicalPopup from "@/components/radical/RadicalPopup";
import type { Radical } from "@/types";

interface RadicalListProps {
  onClose: () => void;
}

export default function RadicalList({ onClose }: RadicalListProps) {
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [popupRadical, setPopupRadical] = useState<string | null>(null);
  const { showPinyin, showEnglish } = useDisplaySettings();

  useEffect(() => {
    loadRadicals().then(setRadicals);
  }, []);

  // Group by stroke count
  const grouped = radicals.reduce<Record<number, Radical[]>>((acc, r) => {
    (acc[r.strokeCount] ??= []).push(r);
    return acc;
  }, {});
  const strokeCounts = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-medium">
          部首 <span className="text-sm text-muted-foreground">Radicals</span>
        </h2>
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm"
        >
          ✕
        </button>
      </div>

      {/* Radical grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {strokeCounts.map((count) => (
          <div key={count}>
            <p className="text-xs text-muted-foreground mb-2">
              {count} stroke{count !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {grouped[count].map((r) => (
                <button
                  key={r.number}
                  onClick={() => setPopupRadical(r.character)}
                  className="flex flex-col items-center py-2 rounded-lg transition-colors bg-card border border-border active:bg-indigo-500/20"
                >
                  <span className="text-2xl">{r.character}</span>
                  {showPinyin && (
                    <span className="text-[10px] text-muted-foreground mt-0.5">{r.pinyin}</span>
                  )}
                  {showEnglish && (
                    <span className="text-[9px] text-muted-foreground truncate max-w-full px-1">{r.meaning}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {popupRadical && (
        <RadicalPopup radicalChar={popupRadical} onClose={() => setPopupRadical(null)} />
      )}
    </div>
  );
}
