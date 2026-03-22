"use client";

import { useCallback, useState } from "react";
import { speak, isTtsSupported } from "@/lib/tts";

interface AudioButtonProps {
  text: string;
  className?: string;
  rate?: number;
}

export default function AudioButton({
  text,
  className = "",
  rate,
}: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  const handleClick = useCallback(async () => {
    if (!isTtsSupported() || playing) return;
    setPlaying(true);
    try {
      await speak(text, rate);
    } catch {
      // silently fail if TTS unavailable
    } finally {
      setPlaying(false);
    }
  }, [text, rate, playing]);

  if (!isTtsSupported()) return null;

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-border transition-colors ${
        playing ? "opacity-50" : ""
      } ${className}`}
      aria-label={`Play pronunciation for ${text}`}
      disabled={playing}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
