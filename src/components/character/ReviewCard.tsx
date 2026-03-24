"use client";

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
  return (
    <div className="space-y-4">
      <div
        className="bg-card rounded-lg p-8 border border-border text-center min-h-[280px] flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={() => !isFlipped && onFlip()}
      >
        <p className="text-7xl font-normal mb-4">{word.simplified}</p>

        {isFlipped ? (
          <div className="space-y-3 animate-in fade-in">
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
            <div className="flex justify-center mt-2">
              <AudioButton text={word.simplified} />
            </div>
          </div>
        ) : (
          <TrilingualLabel
            chinese="点击显示答案"
            pinyin="diǎnjī xiǎnshì dá'àn"
            english="Tap to reveal answer"
            size="sm"
          />
        )}
      </div>

      {isFlipped && (
        <div className="grid grid-cols-4 gap-2">
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
