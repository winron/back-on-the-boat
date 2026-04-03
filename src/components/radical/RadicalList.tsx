"use client";

import { useEffect, useState } from "react";
import { loadRadicals } from "@/lib/data-loader";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import type { Radical } from "@/types";

interface RadicalListProps {
  onClose: () => void;
}

export default function RadicalList({ onClose }: RadicalListProps) {
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [selected, setSelected] = useState<Radical | null>(null);
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
                  onClick={() => setSelected(selected?.number === r.number ? null : r)}
                  className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                    selected?.number === r.number
                      ? "bg-indigo-500/30 border border-indigo-500"
                      : "bg-card border border-border"
                  }`}
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

      {/* Detail bar at bottom when a radical is selected */}
      {selected && (
        <div className="border-t border-border px-4 py-3 bg-card flex items-center gap-4">
          <span className="text-4xl">{selected.character}</span>
          <div className="flex-1 min-w-0">
            <p className="text-base text-indigo-400">{selected.pinyin}</p>
            <p className="text-sm text-muted-foreground">{selected.meaning}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right shrink-0">
            <p>#{selected.number}</p>
            <p>{selected.strokeCount} stroke{selected.strokeCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}
