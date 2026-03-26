"use client";

import { useState, useEffect } from "react";
import { Rating } from "ts-fsrs";
import type { Grade } from "ts-fsrs";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import type { HskWord } from "@/types";

interface ReviewCardProps {
  word: HskWord;
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (grade: Grade) => void;
}

const ratingButtons: { grade: Grade; chinese: string; pinyin: string; english: string; color: string }[] = [
  { grade: Rating.Again, chinese: "再来", pinyin: "zàilái", english: "Again", color: "bg-red-500 hover:bg-red-600" },
  { grade: Rating.Hard, chinese: "难", pinyin: "nán", english: "Hard", color: "bg-orange-500 hover:bg-orange-600" },
  { grade: Rating.Good, chinese: "好", pinyin: "hǎo", english: "Good", color: "bg-green-500 hover:bg-green-600" },
  { grade: Rating.Easy, chinese: "容易", pinyin: "róngyì", english: "Easy", color: "bg-blue-500 hover:bg-blue-600" },
];

export default function ReviewCard({
  word,
  isFlipped,
  onFlip,
  onRate,
}: ReviewCardProps) {
  // Delay buttons until flip animation completes (500ms)
  const [showButtons, setShowButtons] = useState(false);
  useEffect(() => {
    if (!isFlipped) { setShowButtons(false); return; }
    const t = setTimeout(() => setShowButtons(true), 520);
    return () => clearTimeout(t);
  }, [isFlipped]);

  return (
    <div className="space-y-4">
      <div
        className="flip-card cursor-pointer select-none"
        onClick={onFlip}
      >
        <div className={`flip-card-inner${isFlipped ? " flipped" : ""}`}>
          {/* Front face */}
          <div className="flip-card-front bg-card rounded-lg p-8 border border-white text-center min-h-[280px] flex flex-col items-center justify-center">
            <p className="text-7xl font-normal flex-1 flex items-center">{word.simplified}</p>
            <div className="mt-auto pt-4">
              <TrilingualLabel
                chinese="点一下看答案"
                pinyin="diǎn yīxià kàn dá'àn"
                english="Tap to see answer"
                size="xs"
                className="opacity-50"
              />
            </div>
          </div>
          {/* Back face */}
          <div className="flip-card-back bg-card rounded-lg p-8 border border-white text-center min-h-[280px] flex flex-col items-center justify-center">
            <p className="text-7xl font-normal mb-4">{word.simplified}</p>
            <div className="space-y-3">
              <PinyinDisplay pinyin={word.pinyin} className="text-xl" />
              <p className="text-lg text-muted-foreground">{word.meaning}</p>
              {word.exampleSentence && (
                <div className="mt-4 pt-4 border-t border-border text-left">
                  <p className="text-base">{word.exampleSentence}</p>
                  {word.examplePinyin && (
                    <PinyinDisplay
                      pinyin={word.examplePinyin}
                      className="text-sm"
                    />
                  )}
                  {word.exampleMeaning && (
                    <p className="text-sm text-muted-foreground">
                      {word.exampleMeaning}
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-center mt-2" onClick={(e) => e.stopPropagation()}>
                <AudioButton text={word.simplified} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showButtons && (
        <div className="grid grid-cols-4 gap-2 mt-6">
          {ratingButtons.map((btn) => (
            <button
              key={btn.english}
              onClick={() => onRate(btn.grade)}
              className={`${btn.color} text-white py-3 rounded-lg text-sm font-medium transition-colors`}
            >
              <TrilingualLabel chinese={btn.chinese} pinyin={btn.pinyin} english={btn.english} size="xs" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
