"use client";

import { useState, useEffect } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { loadDialogues } from "@/lib/data-loader";
import { useTTS } from "@/hooks/useTTS";
import LevelSelector from "@/components/shared/LevelSelector";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import type { Dialogue } from "@/types";

export default function DialoguePage() {
  const { level, setLevel } = useHskLevel();
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealedLines, setRevealedLines] = useState(0);
  const [showTranslations, setShowTranslations] = useState(false);

  useTTS();

  useEffect(() => {
    loadDialogues(level)
      .then(setDialogues)
      .catch(() => setDialogues([]));
    setSelectedId(null);
  }, [level]);

  const selected = dialogues.find((d) => d.id === selectedId);

  const handleSelectDialogue = (id: string) => {
    setSelectedId(id);
    setRevealedLines(1);
    setShowTranslations(false);
  };

  const revealNext = () => {
    if (selected && revealedLines < selected.lines.length) {
      setRevealedLines((r) => r + 1);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dialogue</h1>
      <LevelSelector currentLevel={level} onSelect={setLevel} />

      {selected ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedId(null)}
            className="text-sm text-primary"
          >
            &larr; Back to list
          </button>

          <div className="bg-card rounded-xl p-4 border border-border">
            <h2 className="font-semibold">{selected.title}</h2>
            {selected.context && (
              <p className="text-sm text-muted-foreground">{selected.context}</p>
            )}
          </div>

          <div className="space-y-3">
            {selected.lines.slice(0, revealedLines).map((line, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 ${
                  line.speaker === "A"
                    ? "bg-card border border-border mr-8"
                    : "bg-muted ml-8"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  {line.speaker}
                </p>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-base">{line.chinese}</p>
                    <PinyinDisplay pinyin={line.pinyin} className="text-sm" />
                    {showTranslations && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {line.english}
                      </p>
                    )}
                  </div>
                  <AudioButton text={line.chinese} className="w-8 h-8 shrink-0" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {revealedLines < selected.lines.length && (
              <button
                onClick={revealNext}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm"
              >
                Next line
              </button>
            )}
            <button
              onClick={() => setShowTranslations((s) => !s)}
              className="flex-1 py-3 bg-muted rounded-xl font-medium text-sm"
            >
              {showTranslations ? "Hide" : "Show"} translations
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {dialogues.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelectDialogue(d.id)}
              className="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary transition-colors"
            >
              <p className="font-medium">{d.title}</p>
              {d.context && (
                <p className="text-sm text-muted-foreground">{d.context}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {d.lines.length} lines
              </p>
            </button>
          ))}
          {dialogues.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No dialogue data available yet. Run the data preparation script.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
