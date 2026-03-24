"use client";

import { useDisplaySettings } from "@/hooks/useDisplaySettings";

interface TrilingualLabelProps {
  chinese: string;
  pinyin: string;
  english: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: { pinyin: "text-[8px] leading-tight", chinese: "text-xs", english: "text-[8px] leading-tight" },
  sm: { pinyin: "text-[9px] leading-tight", chinese: "text-sm", english: "text-[9px] leading-tight" },
  md: { pinyin: "text-xs", chinese: "text-base font-medium", english: "text-xs" },
  lg: { pinyin: "text-sm", chinese: "text-xl font-bold", english: "text-sm" },
};

export default function TrilingualLabel({
  chinese,
  pinyin,
  english,
  size = "md",
  className = "",
}: TrilingualLabelProps) {
  const { showPinyin, showEnglish } = useDisplaySettings();
  const s = sizeMap[size];

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      {showPinyin && (
        <span className={`${s.pinyin} text-muted-foreground`}>{pinyin}</span>
      )}
      <span className={s.chinese}>{chinese}</span>
      {showEnglish && (
        <span className={`${s.english} text-muted-foreground`}>{english}</span>
      )}
    </span>
  );
}
