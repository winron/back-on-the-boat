"use client";

import { useState, useEffect } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { loadGrammar } from "@/lib/data-loader";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import type { GrammarPattern } from "@/types";

export default function GrammarPage() {
  const { level, setLevel } = useHskLevel("grammar");
  const { unlockedLevel } = useUnlockedLevel();
  const [patterns, setPatterns] = useState<GrammarPattern[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadGrammar(level)
      .then(setPatterns)
      .catch(() => setPatterns([]));
    setSelectedId(null);
  }, [level]);

  const selected = patterns.find((p) => p.id === selectedId);

  return (
    <div className="tab-color-3 space-y-6">
      <TrilingualLabel chinese="语法" pinyin="yǔfǎ" english="Grammar" size="lg" />
      <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />

      {selected ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedId(null)}
            className="text-sm text-primary"
          >
            &larr; Back to list
          </button>
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-2">{selected.title}</h2>
            <p className="text-sm text-primary font-mono mb-3">
              {selected.structure}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {selected.explanation}
            </p>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Examples</h3>
              {selected.examples.map((ex, i) => (
                <div
                  key={i}
                  className="bg-muted rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-base">{ex.chinese}</p>
                    <AudioButton text={ex.chinese} className="w-8 h-8" />
                  </div>
                  <PinyinDisplay pinyin={ex.pinyin} className="text-sm" />
                  <p className="text-sm text-muted-foreground">{ex.english}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {patterns.length} pattern{patterns.length !== 1 ? "s" : ""}
          </p>
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => setSelectedId(pattern.id)}
              className="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary transition-colors"
            >
              <p className="font-medium">{pattern.title}</p>
              <p className="text-sm text-primary font-mono">
                {pattern.structure}
              </p>
            </button>
          ))}
          {patterns.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No grammar data available yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
