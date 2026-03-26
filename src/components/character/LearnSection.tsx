"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getUnitNameZh } from "@/lib/unit-names";
import LearnCard from "@/components/character/LearnCard";
import type { HskWord, HskLevel } from "@/types";

interface UnitGroup {
  name: string;
  unitIndex: number;
  words: HskWord[];
}

interface LearnSectionProps {
  unitGroups: UnitGroup[];
  level: HskLevel;
  expandPos: (pos: string) => string;
}

export default function LearnSection({ unitGroups, level, expandPos }: LearnSectionProps) {
  const [selectedUnit, setSelectedUnit] = useState(0);
  const [revealedCard, setRevealedCard] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset selection when unit groups change
  useEffect(() => {
    setSelectedUnit(0);
    setRevealedCard(null);
  }, [unitGroups]);

  const toggleReveal = useCallback((id: string) => {
    setRevealedCard((prev) => (prev === id ? null : id));
  }, []);

  const currentGroup = unitGroups[selectedUnit];
  const currentNameZh = currentGroup
    ? (getUnitNameZh(level, currentGroup.unitIndex) ?? currentGroup.name)
    : "";

  // IntersectionObserver: when the sentinel (original dropdown position) scrolls out of view,
  // make the dropdown sticky. When it scrolls back into view, remove sticky.
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
        // Observe relative to the scrollable main container
        threshold: 0,
        rootMargin: "0px",
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  if (unitGroups.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        暂时没有词汇
      </p>
    );
  }

  const dropdown = (
    <div className="relative">
      <select
        value={selectedUnit}
        onChange={(e) => {
          setSelectedUnit(Number(e.target.value));
          setRevealedCard(null);
          // Scroll back to top of word list
          sentinelRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
        className="w-full bg-muted text-foreground border border-border rounded-lg px-4 font-medium appearance-none cursor-pointer text-left"
        style={{
          backgroundImage: "none",
          height: "3.2rem", // 1.6x of ~2rem default
          fontSize: "0.95rem",
        }}
      >
        {unitGroups.map((group, i) => {
          const nameZh = getUnitNameZh(level, group.unitIndex) ?? group.name;
          return (
            <option key={group.name} value={i} className="bg-card text-foreground">
              {nameZh} — {group.name} ({group.words.length})
            </option>
          );
        })}
      </select>
      {/* Large dropdown arrow */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-3xl">
        ▾
      </span>
    </div>
  );

  return (
    <div ref={containerRef}>
      {/* Sentinel: marks the original position of the dropdown */}
      <div ref={sentinelRef} />

      {/* Sticky dropdown that fades in when scrolled past */}
      {isSticky && (
        <div
          className="fixed top-0 left-0 right-0 z-50 px-4 pt-2 pb-2 animate-in fade-in duration-200"
          style={{ background: "var(--background)" }}
        >
          <div className="max-w-lg mx-auto">
            {dropdown}
          </div>
        </div>
      )}

      {/* Normal dropdown in flow */}
      <div ref={dropdownRef} className={isSticky ? "invisible" : ""}>
        {dropdown}
      </div>

      {/* Word list for selected theme */}
      {currentGroup && (
        <div className="mt-2 space-y-1">
          {currentGroup.words.map((word) => (
            <LearnCard
              key={word.id}
              word={word}
              revealed={revealedCard === word.id}
              onToggle={() => toggleReveal(word.id)}
              expandPos={expandPos}
            />
          ))}
        </div>
      )}
    </div>
  );
}
