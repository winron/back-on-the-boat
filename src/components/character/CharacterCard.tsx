"use client";

import { useState } from "react";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import type { HskWord } from "@/types";

interface CharacterCardProps {
  word: HskWord;
  showPinyin?: boolean;
}

const posMap: Record<string, string> = {
  a: "adjective",
  ad: "adverb + adjective",
  an: "adjective + noun",
  b: "distinguishing word",
  c: "conjunction",
  cc: "coordinating conjunction",
  d: "adverb",
  e: "exclamation",
  f: "directional word",
  g: "morpheme",
  k: "suffix",
  m: "numeral",
  n: "noun",
  nr: "proper noun (person)",
  ns: "proper noun (place)",
  nz: "proper noun (other)",
  p: "preposition",
  q: "measure word",
  qt: "time measure word",
  qv: "verbal measure word",
  r: "pronoun",
  t: "time word",
  u: "particle",
  v: "verb",
  vn: "verb + noun",
  y: "modal particle",
};

function expandPos(pos: string): string {
  return pos
    .split(/,\s*/)
    .map((abbr) => posMap[abbr.trim()] || abbr.trim())
    .join(", ");
}

export default function CharacterCard({
  word,
  showPinyin = false,
}: CharacterCardProps) {
  const [revealed, setRevealed] = useState(showPinyin);

  return (
    <div
      className="bg-card rounded-lg p-6 border border-border text-center cursor-pointer select-none"
      onClick={() => setRevealed(true)}
    >
      <p className="text-6xl font-normal mb-4">{word.simplified}</p>

      {revealed ? (
        <div className="space-y-2">
          <PinyinDisplay pinyin={word.pinyin} className="text-lg" />
          <p className="text-foreground">{word.meaning}</p>
          {word.partOfSpeech && (
            <span className="inline-block text-xs px-2 py-0.5 bg-muted rounded-full text-foreground opacity-70">
              {expandPos(word.partOfSpeech)}
            </span>
          )}
          <div className="flex justify-center mt-2">
            <AudioButton text={word.simplified} />
          </div>
        </div>
      ) : (
        <TrilingualLabel
          chinese="点击显示"
          pinyin="diǎnjī xiǎnshì"
          english="Tap to reveal"
          size="sm"
        />
      )}
    </div>
  );
}
