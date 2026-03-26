"use client";

import { useState, useRef, useEffect } from "react";
import StrokeOrder from "@/components/character/StrokeOrder";
import type { StrokeOrderHandle } from "@/components/character/StrokeOrder";
import AudioButton from "@/components/shared/AudioButton";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import type { HskWord } from "@/types";

/** Color for each POS category — grouped by word class */
const posColorMap: Record<string, string> = {
  // Verbs — red
  verb: "bg-red-500/20 text-red-400",
  "verb + noun": "bg-red-500/20 text-red-400",
  // Nouns — blue
  noun: "bg-blue-500/20 text-blue-400",
  "proper noun (person)": "bg-blue-500/20 text-blue-400",
  "proper noun (place)": "bg-blue-500/20 text-blue-400",
  "proper noun (other)": "bg-blue-500/20 text-blue-400",
  // Adjectives — green
  adjective: "bg-green-500/20 text-green-400",
  "adjective + noun": "bg-green-500/20 text-green-400",
  "adverb + adjective": "bg-green-500/20 text-green-400",
  // Adverbs — orange
  adverb: "bg-orange-500/20 text-orange-400",
  // Pronouns — purple
  pronoun: "bg-purple-500/20 text-purple-400",
  // Measure words — pink
  "measure word": "bg-pink-500/20 text-pink-400",
  "time measure word": "bg-pink-500/20 text-pink-400",
  "verbal measure word": "bg-pink-500/20 text-pink-400",
  // Prepositions — teal
  preposition: "bg-teal-500/20 text-teal-400",
  // Conjunctions — yellow
  conjunction: "bg-yellow-500/20 text-yellow-400",
  "coordinating conjunction": "bg-yellow-500/20 text-yellow-400",
  // Particles — slate
  particle: "bg-slate-500/20 text-slate-400",
  "modal particle": "bg-slate-500/20 text-slate-400",
  // Numerals — cyan
  numeral: "bg-cyan-500/20 text-cyan-400",
  // Time words — amber
  "time word": "bg-amber-500/20 text-amber-400",
  // Directional — sky
  "directional word": "bg-sky-500/20 text-sky-400",
  // Others — neutral
  exclamation: "bg-rose-500/20 text-rose-400",
  "distinguishing word": "bg-zinc-500/20 text-zinc-400",
  morpheme: "bg-zinc-500/20 text-zinc-400",
  suffix: "bg-zinc-500/20 text-zinc-400",
  phrase: "bg-indigo-500/20 text-indigo-400",
};

const defaultPosColor = "bg-zinc-500/20 text-zinc-400";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const [showBody, setShowBody] = useState(revealed);
  const [isCollapsing, setIsCollapsing] = useState(false);

  const currentChar = chars[charIndex] ?? chars[0];
  const isMultiChar = chars.length > 1;

  useEffect(() => {
    if (revealed) {
      setShowBody(true);
      setIsCollapsing(false);
    } else if (showBody) {
      setIsCollapsing(true);
      setTimeout(() => {
        setShowBody(false);
        setIsCollapsing(false);
      }, 100);
    }
  }, [revealed]);

  // Scroll card into view after expand animation finishes (120ms)
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 140);
    return () => clearTimeout(t);
  }, [revealed]);

  const handleAnimate = () => {
    setMode("animate");
    strokeRef.current?.animate();
  };

  const handleQuiz = () => {
    setMode("quiz");
    strokeRef.current?.quiz();
  };

  // Left column width: 80px for audio/buttons
  // Gap between left and right: 16px (gap-4)
  // Body has mx-4 (16px) + p-4 (16px) = 32px extra indent on each side
  // Header pinyin offset = character w-[80px] + gap-4 = starts at 96px from left edge
  // Body right column starts at mx-4(16) + p-4(16) + left-col(80) + gap-4(16) = 128px from card edge
  // So header pinyin needs: pl-[128px] to align with body right column

  return (
    <div ref={cardRef} className={`bg-card rounded-lg select-none scroll-mt-20 ${revealed ? "border border-white" : "border border-border"}`}>
      {/* Clickable header row */}
      <div
        className="flex items-center p-4 cursor-pointer"
        onClick={onToggle}
      >
        <span className="text-3xl w-[80px] text-center shrink-0">
          {word.simplified}
        </span>
        <div className="flex-1 min-w-0" style={{ paddingLeft: "32px" }}>
          {revealed ? (
            <p className="text-sm font-medium">{word.pinyin}</p>
          ) : null}
        </div>
        {/* Chevron flush right */}
        <svg
          className="text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: revealed ? "rotate(180deg)" : "rotate(0deg)", width: "1.75rem", height: "1.75rem" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Expanded: split layout */}
      {showBody && (
        <div className={`mx-4 mb-4 p-4 ${isCollapsing ? "dropdown-close" : "dropdown-open"}`}>
          <div className="flex gap-4">
            {/* LEFT: audio, animate, practice */}
            <div className="flex flex-col items-center justify-evenly min-w-[80px] gap-3">
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
            <div className="flex-1 flex flex-col gap-3 items-center">
              <div className="w-full">
                {word.partOfSpeech && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {expandPos(word.partOfSpeech).split(", ").map((pos) => (
                      <span
                        key={pos}
                        className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${posColorMap[pos] ?? defaultPosColor}`}
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-foreground">{word.meaning}</p>
              </div>

              {/* Stroke order box — centered */}
              <StrokeOrder
                ref={strokeRef}
                character={currentChar}
                size={160}
                strokeColor="#f15bb5"
              />

              {/* Prev/next character arrows */}
              {isMultiChar && (
                <div className="flex items-center gap-3">
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
