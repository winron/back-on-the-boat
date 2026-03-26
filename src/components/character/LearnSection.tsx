"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getUnitNameZh, getUnitNamePinyin } from "@/lib/unit-names";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
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
  const { showPinyin, showEnglish } = useDisplaySettings();
  const [selectedUnit, setSelectedUnit] = useState(0);
  const [revealedCard, setRevealedCard] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset selection when unit groups change
  useEffect(() => {
    setSelectedUnit(0);
    setRevealedCard(null);
  }, [unitGroups]);

  // Close dropdown when clicking outside + lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // Lock the scrollable main container
    const main = document.querySelector("main");
    if (main) main.style.overflow = "hidden";
    document.addEventListener("mousedown", handleClick);
    return () => {
      if (main) main.style.overflow = "";
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen]);

  const toggleReveal = useCallback((id: string) => {
    setRevealedCard((prev) => (prev === id ? null : id));
  }, []);

  const currentGroup = unitGroups[selectedUnit];
  const currentNameZh = currentGroup
    ? (getUnitNameZh(level, currentGroup.unitIndex) ?? currentGroup.name)
    : "";
  const currentPinyin = currentGroup
    ? (getUnitNamePinyin(level, currentGroup.unitIndex) ?? "")
    : "";

  // IntersectionObserver: when the sentinel scrolls out of view, make the dropdown sticky.
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
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

  const handleSelect = (i: number) => {
    setSelectedUnit(i);
    setRevealedCard(null);
    setIsOpen(false);
  };

  const dropdown = (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full bg-muted text-foreground border border-border rounded-lg px-4 font-medium cursor-pointer text-left flex items-center justify-between"
        style={{ minHeight: "3.2rem", fontSize: "0.95rem" }}
      >
        <div className="flex-1 min-w-0 py-2">
          <div className="truncate">
            {currentNameZh}{showPinyin ? ` ${currentPinyin}` : ""} ({currentGroup?.words.length ?? 0})
          </div>
          {showEnglish && (
            <div className="text-xs text-muted-foreground truncate">
              {currentGroup?.name ?? ""}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-[60vh] overflow-y-auto overscroll-contain"
        >
          {unitGroups.map((group, i) => {
            const nameZh = getUnitNameZh(level, group.unitIndex) ?? group.name;
            const pinyin = getUnitNamePinyin(level, group.unitIndex) ?? "";
            const isSelected = i === selectedUnit;
            return (
              <button
                key={group.name}
                onClick={() => handleSelect(i)}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  isSelected
                    ? "bg-primary/20 text-foreground"
                    : "text-foreground hover:bg-muted"
                } ${i === 0 ? "rounded-t-lg" : ""} ${i === unitGroups.length - 1 ? "rounded-b-lg" : ""}`}
              >
                <div className="text-sm font-medium">
                  {nameZh}{showPinyin ? ` ${pinyin}` : ""} ({group.words.length})
                </div>
                {showEnglish && (
                  <div className="text-xs text-muted-foreground">
                    {group.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
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
        <div className="mt-2 space-y-3">
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
