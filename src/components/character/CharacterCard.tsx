"use client";

import { useState } from "react";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import type { HskWord } from "@/types";

interface CharacterCardProps {
  word: HskWord;
  showPinyin?: boolean;
}

export default function CharacterCard({
  word,
  showPinyin = false,
}: CharacterCardProps) {
  const [revealed, setRevealed] = useState(showPinyin);

  return (
    <div
      className="bg-card rounded-2xl p-6 border border-border text-center cursor-pointer select-none"
      onClick={() => setRevealed(true)}
    >
      <p className="text-6xl font-normal mb-4">{word.simplified}</p>

      {revealed ? (
        <div className="space-y-2">
          <PinyinDisplay pinyin={word.pinyin} className="text-lg" />
          <p className="text-muted-foreground">{word.meaning}</p>
          {word.partOfSpeech && (
            <span className="inline-block text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
              {word.partOfSpeech}
            </span>
          )}
          <div className="flex justify-center mt-2">
            <AudioButton text={word.simplified} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Tap to reveal</p>
      )}
    </div>
  );
}
