"use client";

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import HanziWriter from "hanzi-writer";

export interface StrokeOrderHandle {
  animate: () => void;
  quiz: () => void;
}

interface StrokeOrderProps {
  character: string; // single character only
  size?: number;
  strokeColor?: string;
}

const StrokeOrder = forwardRef<StrokeOrderHandle, StrokeOrderProps>(
  function StrokeOrder({ character, size = 200, strokeColor = "var(--color-tab-2)" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const writerRef = useRef<HanziWriter | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";
      writerRef.current = null;
      setReady(false);

      const div = document.createElement("div");
      div.style.display = "inline-block";
      div.style.border = "1px solid var(--border, #e5e5e5)";
      div.style.borderRadius = "12px";
      div.style.background = "white";
      div.style.width = `${size}px`;
      div.style.height = `${size}px`;
      containerRef.current.appendChild(div);

      try {
        const writer = HanziWriter.create(div, character, {
          width: size,
          height: size,
          padding: 10,
          showOutline: true,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 200,
          strokeColor,
          outlineColor: "#e5e5e5",
          drawingColor: "#333",
          charDataLoader: (ch: string) => {
            return fetch(
              `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${ch}.json`
            ).then((r) => (r.ok ? r.json() : Promise.reject(`No data for ${ch}`)));
          },
        });
        writerRef.current = writer;
        setReady(true);
      } catch {
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.fontSize = `${size * 0.5}px`;
        div.textContent = character;
      }

      return () => {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        writerRef.current = null;
      };
    }, [character, size, strokeColor]);

    useImperativeHandle(
      ref,
      () => ({
        animate: () => {
          if (writerRef.current) writerRef.current.animateCharacter();
        },
        quiz: () => {
          if (writerRef.current) writerRef.current.quiz();
        },
      }),
      [ready]
    );

    return <div ref={containerRef} className="flex justify-center" />;
  }
);

export default StrokeOrder;
