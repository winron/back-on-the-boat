"use client";

import { useState, useEffect } from "react";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { loadDialogues } from "@/lib/data-loader";
import { useTTS } from "@/hooks/useTTS";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import { toChineseNumber } from "@/lib/chinese-numbers";
import type { Dialogue } from "@/types";

export default function DialoguePage() {
  const { level, setLevel } = useHskLevel();
  const { unlockedLevel } = useUnlockedLevel();
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
    <div className="tab-color-4 space-y-6">
      <div className="flex items-center justify-between">
        <TrilingualLabel chinese="对话" pinyin="duìhuà" english="Dialogue" size="lg" />
        <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
      </div>

      {selected ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedId(null)}
            className="text-sm text-primary flex items-center gap-1"
          >
            <TrilingualLabel
              chinese="返回"
              pinyin="fǎnhuí"
              english="Back"
              size="xs"
            />
          </button>

          <div className="bg-card rounded-lg p-4 border border-border">
            <h2 className="font-semibold">{selected.title}</h2>
            {selected.context && (
              <p className="text-sm text-muted-foreground">{selected.context}</p>
            )}
          </div>

          <div className="space-y-3">
            {selected.lines.slice(0, revealedLines).map((line, i) => (
              <div
                key={i}
                className={`rounded-lg p-4 ${
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
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
              >
                <TrilingualLabel chinese="下一句" pinyin="xià yī jù" english="Next line" size="xs" />
              </button>
            )}
            <button
              onClick={() => setShowTranslations((s) => !s)}
              className="flex-1 py-3 bg-muted rounded-lg font-medium text-sm"
            >
              <TrilingualLabel
                chinese={showTranslations ? "隐藏翻译" : "显示翻译"}
                pinyin={showTranslations ? "yǐncáng fānyì" : "xiǎnshì fānyì"}
                english={showTranslations ? "Hide translations" : "Show translations"}
                size="xs"
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {dialogues.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelectDialogue(d.id)}
              className="w-full text-left bg-card rounded-lg p-4 border border-border hover:border-primary transition-colors"
            >
              <p className="font-medium">{d.title}</p>
              {d.context && (
                <p className="text-sm text-muted-foreground">{d.context}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {toChineseNumber(d.lines.length)}句
              </p>
            </button>
          ))}
          {dialogues.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              <TrilingualLabel chinese="还没有对话内容" pinyin="hái méiyǒu duìhuà nèiróng" english="No dialogue content yet" size="sm" />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
