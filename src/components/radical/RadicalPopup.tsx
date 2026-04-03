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
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    loadRadicals().then((radicals) => {
      const match = radicals.find((r) => r.character === radicalChar);
      setRadical(match ?? null);
    });
  }, [radicalChar]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 150);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-150 ${isClosing ? "opacity-0" : "opacity-100"}`} />
      <div
        className={`relative bg-card border border-border rounded-xl p-6 mx-4 max-w-xs w-full text-center space-y-3 transition-all duration-150 ${
          isClosing ? "opacity-0 scale-90" : "animate-[popup-in_0.15s_ease-out]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-5xl">{radicalChar}</p>
        {radical ? (
          <>
            <p className="text-lg text-indigo-400">{radical.pinyin}</p>
            <p className="text-base text-muted-foreground">{radical.meaning}</p>
            <p className="text-xs text-muted-foreground">
              {radical.strokeCount} stroke{radical.strokeCount !== 1 ? "s" : ""}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{radicalChar}</p>
        )}
        <button
          onClick={handleClose}
          className="mt-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
