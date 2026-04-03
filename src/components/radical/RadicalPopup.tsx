"use client";

import { useEffect, useState } from "react";
import { loadRadicals } from "@/lib/data-loader";
import type { Radical } from "@/types";

interface RadicalPopupProps {
  radicalChar: string;
  onClose: () => void;
}

export default function RadicalPopup({ radicalChar, onClose }: RadicalPopupProps) {
  const [radical, setRadical] = useState<Radical | null>(null);

  useEffect(() => {
    loadRadicals().then((radicals) => {
      const match = radicals.find((r) => r.character === radicalChar);
      setRadical(match ?? null);
    });
  }, [radicalChar]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-card border border-border rounded-xl p-6 mx-4 max-w-xs w-full text-center space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-5xl">{radicalChar}</p>
        {radical ? (
          <>
            <p className="text-lg text-indigo-400">{radical.pinyin}</p>
            <p className="text-base text-muted-foreground">{radical.meaning}</p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>Radical #{radical.number}</span>
              <span>{radical.strokeCount} stroke{radical.strokeCount !== 1 ? "s" : ""}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{radicalChar}</p>
        )}
        <button
          onClick={onClose}
          className="mt-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
