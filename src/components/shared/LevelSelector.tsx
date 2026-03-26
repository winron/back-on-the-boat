"use client";

import { useState, useEffect, useRef } from "react";
import type { HskLevel } from "@/types";

interface LevelSelectorProps {
  currentLevel: HskLevel;
  onSelect: (level: HskLevel) => void;
  unlockedLevel?: HskLevel;
}

const levels: HskLevel[] = [1, 2, 3, 4, 5, 6];

export default function LevelSelector({
  currentLevel,
  onSelect,
  unlockedLevel = 6,
}: LevelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 100);
  };

  // Close dropdown when clicking outside + lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const main = document.querySelector("main");
    if (main) main.style.overflow = "hidden";
    document.addEventListener("mousedown", handleClick);
    return () => {
      if (main) main.style.overflow = "";
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        className="bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium cursor-pointer min-w-[5.5rem] text-center"
      >
        HSK {currentLevel}
      </button>

      {isOpen && (
        <div className={`absolute right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg min-w-[5.5rem] overflow-hidden ${isClosing ? "dropdown-close" : "dropdown-open"}`}>
          {levels.map((level) => {
            const locked = level > unlockedLevel;
            const isSelected = level === currentLevel;
            return (
              <button
                key={level}
                disabled={locked}
                onClick={() => {
                  onSelect(level);
                  close();
                }}
                className={`w-full text-center px-3 py-2 text-sm font-medium transition-colors ${
                  locked
                    ? "text-muted-foreground opacity-40 cursor-not-allowed"
                    : isSelected
                      ? "bg-primary/20 text-foreground"
                      : "text-foreground hover:bg-muted"
                } ${level === 1 ? "rounded-t-lg" : ""} ${level === 6 ? "rounded-b-lg" : ""}`}
              >
                HSK {level}{locked ? " --" : ""}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
