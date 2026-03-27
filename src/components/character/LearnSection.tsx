"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getUnitNameZh, getUnitNamePinyin } from "@/lib/unit-names";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
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
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPendingTimers = () => {
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
  };

  // Reset selection when unit groups change
  useEffect(() => {
    clearPendingTimers();
    setSelectedUnit(0);
    setRevealedCard(null);
  }, [unitGroups]);

  // Cleanup on unmount
  useEffect(() => () => clearPendingTimers(), []);

  const closeDropdown = () => {
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
        closeDropdown();
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
    clearPendingTimers();

    if (revealedCard === id) {
      setRevealedCard(null);
      return;
    }

    // Open the card, then scroll only if needed after the expand animation settles.
    const openThenScroll = (targetId: string) => {
      setRevealedCard(targetId);
      const t = setTimeout(() => requestAnimationFrame(() => {
        const cardEl = document.querySelector(`[data-card-id="${targetId}"]`);
        if (cardEl && dropdownRef.current) {
          const dropdownHeight = dropdownRef.current.getBoundingClientRect().height;
          const gap = 16;
          const rect = cardEl.getBoundingClientRect();
          const hiddenAbove = rect.top < dropdownHeight + gap;
          const hiddenBelow = rect.bottom > window.innerHeight;
          if (hiddenAbove || hiddenBelow) {
            (cardEl as HTMLElement).style.scrollMarginTop = `${dropdownHeight + gap}px`;
            cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }), 120);
      pendingTimers.current.push(t);
    };

    if (revealedCard !== null) {
      // Collapse A and expand B simultaneously; scroll after B's animation settles
      setRevealedCard(null);
      openThenScroll(id);
    } else {
      openThenScroll(id);
    }
  }, [revealedCard]);

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
    closeDropdown();
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dropdown = (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => (isOpen ? closeDropdown() : setIsOpen(true))}
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
          className={`absolute left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-[60vh] overflow-y-auto overscroll-contain ${isClosing ? "dropdown-close" : "dropdown-open"}`}
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
        <div className="mt-6 space-y-3">
          {currentGroup.words.map((word) => (
            <div key={word.id} data-card-id={word.id}>
              <LearnCard
                word={word}
                revealed={revealedCard === word.id}
                onToggle={() => toggleReveal(word.id)}
                expandPos={expandPos}
              />
            </div>
          ))}
          <div className="py-10 text-center">
            <TrilingualLabel
              chinese="到底了"
              pinyin="dào dǐ le"
              english="You've reached the end"
              size="xs"
              className="opacity-40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
