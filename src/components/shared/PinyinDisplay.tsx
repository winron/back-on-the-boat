interface PinyinDisplayProps {
  pinyin: string;
  className?: string;
}

const toneColors: Record<string, string> = {
  "1": "text-red-500",
  "2": "text-orange-500",
  "3": "text-green-500",
  "4": "text-blue-500",
};

function getTone(syllable: string): string {
  const toneMarks: Record<string, string> = {
    "\u0101": "1", "\u00e1": "1", "\u01ce": "1", "\u00e0": "1",
    "\u014d": "1", "\u00f3": "2", "\u01d2": "3", "\u00f2": "4",
    "\u0113": "1", "\u00e9": "2", "\u011b": "3", "\u00e8": "4",
    "\u012b": "1", "\u00ed": "2", "\u01d0": "3", "\u00ec": "4",
    "\u016b": "1", "\u00fa": "2", "\u01d4": "3", "\u00f9": "4",
    "\u01d6": "1", "\u01d8": "2", "\u01da": "3", "\u01dc": "4",
  };

  for (const char of syllable) {
    if (toneMarks[char]) return toneMarks[char];
  }
  return "5";
}

export default function PinyinDisplay({
  pinyin,
  className = "",
}: PinyinDisplayProps) {
  const syllables = pinyin.split(/\s+/);

  return (
    <span className={`${className}`}>
      {syllables.map((s, i) => {
        const tone = getTone(s);
        const color = toneColors[tone] ?? "text-muted-foreground";
        return (
          <span key={i} className={color}>
            {s}{" "}
          </span>
        );
      })}
    </span>
  );
}
