"use client";

import type { Radical } from "@/types";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";

interface RadicalCardProps {
  radical: Radical;
}

export default function RadicalCard({ radical }: RadicalCardProps) {
  const { showPinyin, showEnglish } = useDisplaySettings();

  return (
    <div className="bg-card rounded-lg border border-border p-3 text-center hover:border-primary/50 transition-colors cursor-pointer">
      {/* Radical character */}
      <div className="text-2xl font-medium mb-1">{radical.character}</div>

      {/* Pinyin (conditional) */}
      {showPinyin && (
        <div className="text-xs text-muted-foreground">{radical.pinyin}</div>
      )}

      {/* English meaning (conditional) */}
      {showEnglish && (
        <div className="text-[10px] text-muted-foreground leading-tight">
          {radical.meaning}
        </div>
      )}

      {/* Stroke count */}
      <div className="text-xs text-muted-foreground mt-1">
        {radical.strokeCount}画
      </div>
    </div>
  );
}
