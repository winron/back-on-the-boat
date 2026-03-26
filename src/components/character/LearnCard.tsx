"use client";

import { useState, useRef } from "react";
import StrokeOrder from "@/components/character/StrokeOrder";
import type { StrokeOrderHandle } from "@/components/character/StrokeOrder";
import AudioButton from "@/components/shared/AudioButton";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import type { HskWord } from "@/types";

interface LearnCardProps {
  word: HskWord;
  revealed: boolean;
  onToggle: () => void;
  expandPos: (pos: string) => string;
}

export default function LearnCard({ word, revealed, onToggle, expandPos }: LearnCardProps) {
  const chars = [...word.simplified];
  const [charIndex, setCharIndex] = useState(0);
  const [mode, setMode] = useState<"animate" | "quiz">("animate");
  const strokeRef = useRef<StrokeOrderHandle>(null);

  const currentChar = chars[charIndex] ?? chars[0];
  const isMultiChar = chars.length > 1;

  const handleAnimate = () => {
    setMode("animate");
    strokeRef.current?.animate();
  };

  const handleQuiz = () => {
    setMode("quiz");
    strokeRef.current?.quiz();
  };

  return (
    <div className="bg-card rounded-lg border border-border select-none">
      {/* Clickable header row — collapsed state */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={onToggle}
      >
        <span className="text-3xl w-12 text-center shrink-0">
          {word.simplified}
        </span>
        <div className="flex-1 min-w-0">
          {revealed ? (
            <p className="text-sm font-medium">{word.pinyin}</p>
          ) : null}
        </div>
        {/* Up/down arrow flush right */}
        <span
          className="text-muted-foreground text-4xl shrink-0 transition-transform duration-200"
          style={{ transform: revealed ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </div>

      {/* Expanded: split layout */}
      {revealed && (
        <div className="px-4 pb-4">
          <div className="flex gap-4">
            {/* LEFT: audio, animate, practice */}
            <div className="flex flex-col items-center justify-evenly min-w-[80px]">
              <AudioButton text={word.simplified} />
              <button
                onClick={handleAnimate}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full ${
                  mode === "animate"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <TrilingualLabel chinese="动画" pinyin="dònghuà" english="Animate" size="xs" />
              </button>
              <button
                onClick={handleQuiz}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full ${
                  mode === "quiz"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <TrilingualLabel chinese="练习" pinyin="liànxí" english="Practice" size="xs" />
              </button>
            </div>

            {/* RIGHT: POS, meaning, stroke order, char nav */}
            <div className="flex-1 flex flex-col gap-2">
              <div>
                {word.partOfSpeech && (
                  <p className="text-xs text-muted-foreground">{expandPos(word.partOfSpeech)}</p>
                )}
                <p className="text-sm text-foreground mt-1">{word.meaning}</p>
              </div>

              {/* Stroke order box */}
              <div className="flex justify-end">
                <StrokeOrder
                  ref={strokeRef}
                  character={currentChar}
                  size={160}
                  strokeColor="#f15bb5"
                />
              </div>

              {/* Prev/next character arrows */}
              {isMultiChar && (
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setCharIndex((i) => Math.max(0, i - 1))}
                    disabled={charIndex === 0}
                    className="px-3 py-1 bg-muted rounded-lg text-lg disabled:opacity-30"
                  >
                    ◀
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {chars[charIndex]} ({charIndex + 1}/{chars.length})
                  </span>
                  <button
                    onClick={() => setCharIndex((i) => Math.min(chars.length - 1, i + 1))}
                    disabled={charIndex === chars.length - 1}
                    className="px-3 py-1 bg-muted rounded-lg text-lg disabled:opacity-30"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
