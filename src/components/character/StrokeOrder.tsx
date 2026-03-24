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
  const writersRef = useRef<HanziWriter[]>([]);
  const [mode, setMode] = useState<"animate" | "quiz">("animate");
  const chars = [...character]; // Split into individual characters

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous
    containerRef.current.innerHTML = "";
    writersRef.current = [];

    const charSize = chars.length > 1 ? Math.min(size, 150) : size;

    for (const char of chars) {
      const div = document.createElement("div");
      div.style.display = "inline-block";
      div.style.border = "1px solid var(--border, #e5e5e5)";
      div.style.borderRadius = "12px";
      div.style.background = "white";
      div.style.width = `${charSize}px`;
      div.style.height = `${charSize}px`;
      containerRef.current.appendChild(div);

      try {
        const writer = HanziWriter.create(div, char, {
          width: charSize,
          height: charSize,
          padding: 10,
          showOutline: true,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 200,
          strokeColor: "#dc2626",
          outlineColor: "#e5e5e5",
          drawingColor: "#333",
          charDataLoader: (ch: string) => {
            return fetch(
              `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${ch}.json`
            ).then((r) => r.ok ? r.json() : Promise.reject(`No data for ${ch}`));
          },
        });
        writersRef.current.push(writer);
      } catch {
        // Character not available in hanzi-writer data
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.fontSize = `${charSize * 0.5}px`;
        div.textContent = char;
      }
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      writersRef.current = [];
    };
  }, [character, size]);

  const handleAnimate = () => {
    setMode("animate");
    // Animate characters sequentially
    let delay = 0;
    for (const writer of writersRef.current) {
      setTimeout(() => writer.animateCharacter(), delay);
      delay += 1000;
    }
  };

  const handleQuiz = () => {
    setMode("quiz");
    // Quiz each character
    for (const writer of writersRef.current) {
      writer.quiz();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="flex flex-wrap gap-2 justify-center"
      />
      <div className="flex gap-2">
        <button
          onClick={handleAnimate}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "animate"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Animate
        </button>
        <button
          onClick={handleQuiz}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
