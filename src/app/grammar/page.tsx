"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { loadGrammar } from "@/lib/data-loader";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { toChineseNumber } from "@/lib/chinese-numbers";
import type { GrammarPattern, HskLevel } from "@/types";

function GrammarPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { level, setLevel } = useHskLevel("grammar");
  const { unlockedLevel } = useUnlockedLevel();
  const { showPinyin, showEnglish } = useDisplaySettings();
  const [patterns, setPatterns] = useState<GrammarPattern[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [fromPage, setFromPage] = useState<string | null>(null);

  // Handle deep-link: /grammar?id=g2-005&from=sentences
  useEffect(() => {
    const id = searchParams.get("id");
    const from = searchParams.get("from");
    if (!id) return;
    const m = id.match(/^g(\d+)-/);
    if (m) {
      const targetLevel = parseInt(m[1]) as HskLevel;
      setPendingId(id);
      setLevel(targetLevel);
      if (from) setFromPage(from);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadGrammar(level)
      .then(setPatterns)
      .catch(() => setPatterns([]));
    if (!pendingId) setSelectedId(null);
  }, [level]);

  // Open the pending pattern once its level's patterns have loaded
  useEffect(() => {
    if (pendingId && patterns.length > 0) {
      if (patterns.some((p) => p.id === pendingId)) {
        setSelectedId(pendingId);
        setPendingId(null);
      }
    }
  }, [patterns, pendingId]);

  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedId]);

  const selected = patterns.find((p) => p.id === selectedId);

  return (
    <div className="tab-color-3 space-y-6">
      <div className="flex items-center justify-between">
        <TrilingualLabel chinese="语法" pinyin="yǔfǎ" english="Grammar" size="lg" />
        <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
      </div>

      {selected ? (
        <div className="space-y-4">
          <button
            onClick={() => fromPage ? router.push(`/${fromPage}`) : setSelectedId(null)}
            className="bg-card border border-border rounded-lg px-5 py-2.5 text-white flex items-center"
          >
            <svg viewBox="0 0 36 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-3">
              <line x1="36" y1="6" x2="0" y2="6" />
              <polyline points="8 0 0 6 8 12" />
            </svg>
          </button>
          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-2">{selected.title}</h2>
            <p className="text-sm text-primary font-mono mb-3">
              {selected.structure}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {selected.explanation}
            </p>
            <div className="space-y-3">
              {selected.examples.map((ex, i) => (
                <div key={i} className="bg-muted rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base">{ex.chinese}</p>
                    <AudioButton text={ex.chinese} className="w-8 h-8" />
                  </div>
                  {showPinyin && <PinyinDisplay pinyin={ex.pinyin} className="text-sm" />}
                  {showEnglish && <p className="text-sm text-muted-foreground">{ex.english}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <TrilingualLabel
            chinese={`${toChineseNumber(patterns.length)}种语法点`}
            pinyin={`${patterns.length} zhǒng yǔfǎ diǎn`}
            english={`${patterns.length} grammar pattern${patterns.length !== 1 ? "s" : ""}`}
            size="xs"
            className="opacity-60"
          />
          {patterns.map((pattern, index) => (
            <button
              key={pattern.id}
              onClick={() => setSelectedId(pattern.id)}
              className="relative w-full text-left bg-card rounded-lg p-4 pl-10 border border-border hover:border-primary transition-colors"
            >
              <span className="absolute top-3 left-3 text-xs text-muted-foreground/60 font-mono leading-none">
                {index + 1}
              </span>
              <p className="font-medium">{pattern.title}</p>
              <p className="text-sm text-primary font-mono">
                {pattern.structure}
              </p>
            </button>
          ))}
          {patterns.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              <TrilingualLabel chinese="还没有语法内容" pinyin="hái méiyǒu yǔfǎ nèiróng" english="No grammar content yet" size="sm" />
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function GrammarPage() {
  return (
    <Suspense>
      <GrammarPageInner />
    </Suspense>
  );
}
