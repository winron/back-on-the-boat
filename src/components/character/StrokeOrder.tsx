"use client";

import { useRef, useEffect, useState } from "react";
import HanziWriter from "hanzi-writer";

interface StrokeOrderProps {
  character: string;
  size?: number;
}

export default function StrokeOrder({
  character,
  size = 200,
}: StrokeOrderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [mode, setMode] = useState<"animate" | "quiz">("animate");

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous
    containerRef.current.innerHTML = "";
    writerRef.current = null;

    const writer = HanziWriter.create(containerRef.current, character, {
      width: size,
      height: size,
      padding: 10,
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
      strokeColor: "#dc2626",
      outlineColor: "#e5e5e5",
      drawingColor: "#333",
    });

    writerRef.current = writer;

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      writerRef.current = null;
    };
  }, [character, size]);

  const handleAnimate = () => {
    setMode("animate");
    writerRef.current?.animateCharacter();
  };

  const handleQuiz = () => {
    setMode("quiz");
    writerRef.current?.quiz();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="border border-border rounded-xl bg-white"
        style={{ width: size, height: size }}
      />
      <div className="flex gap-2">
        <button
          onClick={handleAnimate}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === "animate"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Animate
        </button>
        <button
          onClick={handleQuiz}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === "quiz"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Practice
        </button>
      </div>
    </div>
  );
}
