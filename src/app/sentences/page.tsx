"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useHskLevel } from "@/hooks/useHskLevel";
import { useUnlockedLevel } from "@/hooks/useUnlockedLevel";
import { loadSentences } from "@/lib/data-loader";
import { db } from "@/lib/db";
import { getDueCards, getNewCards, createNewSrsCard, reviewCard, Rating } from "@/lib/srs";
import { recordReview } from "@/hooks/useStats";
import { getRecallCards } from "@/hooks/useReview";
import LevelSelector from "@/components/shared/LevelSelector";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import PinyinDisplay from "@/components/shared/PinyinDisplay";
import AudioButton from "@/components/shared/AudioButton";
import type { SentenceExercise, SrsCardState, HskLevel } from "@/types";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Drag-and-drop word chips ──────────────────────────────────────────────────

function SortableWord({ id, word, onTap }: { id: string; word: string; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <button
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
      onClick={onTap}
      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-lg font-medium"
    >
      {word}
    </button>
  );
}

function DraggableWord({ id, word, onTap }: { id: string; word: string; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <button
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.35 : 1, touchAction: "none" }}
      {...attributes}
      {...listeners}
      onClick={onTap}
      className="px-3 py-2 bg-card border border-border rounded-lg text-lg font-medium hover:border-primary transition-colors"
    >
      {word}
    </button>
  );
}

function WordChip({ word, variant }: { word: string; variant: "selected" | "bank" }) {
  return (
    <div
      className={`px-3 py-2 rounded-lg text-lg font-medium pointer-events-none ${
        variant === "selected"
          ? "bg-primary text-primary-foreground"
          : "bg-card border border-border"
      }`}
    >
      {word}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function SentencesPageInner() {
  const searchParams = useSearchParams();
  const { level, setLevel } = useHskLevel("sentences");
  const { unlockedLevel } = useUnlockedLevel();

  const [exerciseMap, setExerciseMap] = useState<Map<string, SentenceExercise>>(new Map());
  const [sessionCards, setSessionCards] = useState<SrsCardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [shuffledBank, setShuffledBank] = useState<string[]>([]);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [activeDrag, setActiveDrag] = useState<{ id: string; word: string; variant: "selected" | "bank" } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  const loadSession = useCallback(async (exercises: SentenceExercise[], lv: HskLevel, resumeId?: string) => {
    const prefix = `s${lv}-`;

    const existing = await db.srsCards
      .where("module").equals("sentences")
      .filter((c) => c.id.startsWith(prefix))
      .toArray();
    const existingIds = new Set(existing.map((c) => c.id));
    const toSeed = exercises
      .filter((e) => !existingIds.has(e.id))
      .map((e) => createNewSrsCard(e.id, "sentences"));
    if (toSeed.length > 0) await db.srsCards.bulkAdd(toSeed);

    const due = await getDueCards("sentences", 20, prefix);
    const newCards =
      due.length < 5
        ? await getNewCards("sentences", 10 - Math.min(due.length, 5), prefix)
        : [];
    let session: SrsCardState[] = [...due, ...newCards];

    // Sprinkle in recall sentences from previous levels (1 per 4 main cards)
    if (lv > 1) {
      const recallPrefixes = Array.from({ length: lv - 1 }, (_, i) => `s${i + 1}-`);
      const recall = await getRecallCards("sentences", recallPrefixes, 2);
      if (recall.length > 0) {
        const mixed: SrsCardState[] = [];
        let ri = 0;
        for (let i = 0; i < session.length; i++) {
          if (i > 0 && i % 4 === 0 && ri < recall.length) mixed.push(recall[ri++]);
          mixed.push(session[i]);
        }
        while (ri < recall.length) mixed.push(recall[ri++]);
        session = mixed;
      }
    }

    const allCards = await db.srsCards
      .where("module").equals("sentences")
      .filter((c) => c.id.startsWith(prefix))
      .toArray();
    const mastered = allCards.filter((c) => (c.bestGrade ?? 0) >= 3).length;

    const startIndex = resumeId ? Math.max(0, session.findIndex((c) => c.id === resumeId)) : 0;
    setSessionCards(session);
    setCurrentIndex(startIndex);
    setMasteredCount(mastered);
    setTotalCount(exercises.length);
    setResult(null);
    setHasRated(false);
    setLoaded(true);
  }, []);

  useEffect(() => {
    const resumeId = searchParams.get("resume") ?? undefined;
    setLoaded(false);
    loadSentences(level)
      .then(async (data) => {
        const map = new Map(data.map((e) => [e.id, e]));
        // Pre-load previous levels' exercises so recall cards resolve correctly (cached)
        for (let i = 1; i < level; i++) {
          const prev = await loadSentences(i as HskLevel);
          for (const e of prev) map.set(e.id, e);
        }
        setExerciseMap(map);
        loadSession(data, level, resumeId);
      })
      .catch(() => {
        setExerciseMap(new Map());
        setLoaded(true);
      });
  }, [level, loadSession]);

  const currentCard = sessionCards[currentIndex] ?? null;
  const exercise = currentCard ? (exerciseMap.get(currentCard.id) ?? null) : null;
  const isComplete = loaded && currentIndex >= sessionCards.length;

  useEffect(() => {
    if (exercise) {
      setShuffledBank(shuffleArray(exercise.wordBank));
      setSelected([]);
      setResult(null);
      setHasRated(false);
    }
  }, [exercise]);

  // ── Tap handlers (keep existing tap-to-move behaviour) ────────────────────

  const handleWordTap = (word: string, index: number) => {
    setSelected((s) => [...s, word]);
    setShuffledBank((b) => b.filter((_, i) => i !== index));
  };

  const handleSelectedTap = (word: string, index: number) => {
    setShuffledBank((b) => [...b, word]);
    setSelected((s) => s.filter((_, i) => i !== index));
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    if (id.startsWith("bank-")) {
      const idx = parseInt(id.slice(5));
      setActiveDrag({ id, word: shuffledBank[idx], variant: "bank" });
    } else if (id.startsWith("sel-")) {
      const idx = parseInt(id.slice(4));
      setActiveDrag({ id, word: selected[idx], variant: "selected" });
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDrag(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Bank word → answer area (drop on answer zone or on an existing sel chip)
    if (activeId.startsWith("bank-") && (overId === "answer-area" || overId.startsWith("sel-"))) {
      const bankIdx = parseInt(activeId.slice(5));
      const word = shuffledBank[bankIdx];
      if (overId.startsWith("sel-")) {
        const targetIdx = parseInt(overId.slice(4));
        setSelected((s) => {
          const next = [...s];
          next.splice(targetIdx, 0, word);
          return next;
        });
      } else {
        setSelected((s) => [...s, word]);
      }
      setShuffledBank((b) => b.filter((_, i) => i !== bankIdx));
      return;
    }

    // Selected word → bank area (drag back)
    if (activeId.startsWith("sel-") && (overId === "bank-area" || overId.startsWith("bank-"))) {
      const selIdx = parseInt(activeId.slice(4));
      const word = selected[selIdx];
      setShuffledBank((b) => [...b, word]);
      setSelected((s) => s.filter((_, i) => i !== selIdx));
      return;
    }

    // Reorder within answer area
    if (activeId.startsWith("sel-") && overId.startsWith("sel-")) {
      const from = parseInt(activeId.slice(4));
      const to = parseInt(overId.slice(4));
      if (from !== to) setSelected((s) => arrayMove(s, from, to));
    }
  };

  // ── SRS check ─────────────────────────────────────────────────────────────

  const handleCheck = useCallback(async () => {
    if (!exercise || !currentCard) return;
    const isCorrect = selected.join("") === exercise.targetSentence;

    if (!hasRated) {
      const grade = isCorrect ? Rating.Good : Rating.Again;
      const updated = reviewCard(currentCard, grade);
      const prevBest = currentCard.bestGrade ?? 0;
      if (prevBest >= 3) {
        // Mastered: allow drop to 3 but never below
        updated.bestGrade = Math.max(3, grade as number);
      } else {
        // Not yet mastered: ratchet upward only
        updated.bestGrade = Math.max(prevBest, grade as number);
        if (updated.bestGrade >= 3 && prevBest < 3) setMasteredCount((n) => n + 1);
      }
      await db.srsCards.put(updated);
      await recordReview(isCorrect);
      setHasRated(true);
      setSessionCards((cards) => cards.map((c) => (c.id === updated.id ? updated : c)));
    }

    setResult(isCorrect ? "correct" : "incorrect");
    setTimeout(() => {
      document.querySelector("main")?.scrollTo({ top: 99999, behavior: "smooth" });
    }, 50);
  }, [exercise, currentCard, selected, hasRated]);

  const handleNext = () => {
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentIndex((i) => i + 1);
  };

  const startPractice = useCallback(async () => {
    const prefix = `s${level}-`;
    const all = await db.srsCards
      .where("module").equals("sentences")
      .filter((c) => c.id.startsWith(prefix))
      .toArray();
    const shuffled = shuffleArray(all);
    setSessionCards(shuffled);
    setCurrentIndex(0);
    setResult(null);
    setHasRated(false);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [level]);

  // ── Shared header ─────────────────────────────────────────────────────────

  const header = (
    <div className="flex items-center justify-between">
      <TrilingualLabel chinese="造句" pinyin="zàojù" english="Sentences" size="lg" />
      <LevelSelector currentLevel={level} onSelect={setLevel} unlockedLevel={unlockedLevel} />
    </div>
  );

  if (!loaded) {
    return (
      <div className="tab-color-4 space-y-6">
        {header}
        <p className="text-center text-muted-foreground py-8">
          <TrilingualLabel chinese="加载中…" pinyin="jiāzài zhōng" english="Loading…" size="sm" />
        </p>
      </div>
    );
  }

  if (isComplete) {
    const pct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
    return (
      <div className="tab-color-4 space-y-6">
        {header}
        <div className="text-center py-12 space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium">
              <TrilingualLabel chinese="做完了！" pinyin="zuò wán le!" english="Session complete!" size="sm" />
            </p>
            <p className="text-sm text-muted-foreground">
              {masteredCount} / {totalCount} mastered ({pct}%)
            </p>
          </div>
          <button
            onClick={startPractice}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            <TrilingualLabel chinese="练习" pinyin="liànxí" english="Practice all" size="xs" />
          </button>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="tab-color-4 space-y-6">
        {header}
        <p className="text-center text-muted-foreground py-8">
          <TrilingualLabel chinese="还没有练习题" pinyin="hái méiyǒu liànxí tí" english="No exercises yet" size="sm" />
        </p>
      </div>
    );
  }

  const selIds = selected.map((_, i) => `sel-${i}`);
  const bankIds = shuffledBank.map((_, i) => `bank-${i}`);

  return (
    <div className="tab-color-4 space-y-6 pb-8">
      {header}

      {/* 翻译 label left, counter right + target meaning */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="opacity-50">
            <TrilingualLabel chinese="翻译" pinyin="fānyì" english="Translate" size="xs" />
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {sessionCards.length}
            </span>
            {exercise.grammarId && (
              <Link
                href={`/grammar?id=${exercise.grammarId}&from=sentences&sentenceId=${currentCard!.id}`}
                className="text-xs text-primary/70 hover:text-primary font-mono border border-primary/30 hover:border-primary/60 rounded px-1.5 py-0.5 transition-colors"
              >
                语法
              </Link>
            )}
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-base font-medium">{exercise.targetMeaning}</p>
        </div>
      </div>

      {/* Drag-and-drop context wraps both answer area and word bank */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Answer area */}
        <AnswerDropZone
          selIds={selIds}
          selected={selected}
          onTap={handleSelectedTap}
        />

        {/* Word bank */}
        <BankDropZone
          bankIds={bankIds}
          shuffledBank={shuffledBank}
          onTap={handleWordTap}
        />

        {/* Floating preview while dragging */}
        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <WordChip word={activeDrag.word} variant={activeDrag.variant} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg p-5 space-y-4 ${
            result === "correct"
              ? "bg-green-950 border border-green-800"
              : "bg-red-950 border border-red-800"
          }`}
        >
          {result === "correct" ? (
            <TrilingualLabel chinese="答对了！" pinyin="dá duì le!" english="Got it right!" size="sm" />
          ) : (
            <TrilingualLabel chinese="不太对，再试一下" pinyin="bú tài duì, zài shì yí xià" english="Not quite, try again" size="sm" />
          )}
          {result === "incorrect" && (
            <div className="space-y-1">
              <p className="text-sm">{exercise.targetSentence}</p>
              <PinyinDisplay pinyin={exercise.targetPinyin} className="text-sm" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <AudioButton text={exercise.targetSentence} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!result && (
          <button
            onClick={handleCheck}
            disabled={selected.length === 0}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-30"
          >
            <TrilingualLabel chinese="确认" pinyin="quèrèn" english="Confirm" size="xs" />
          </button>
        )}
        {result === "incorrect" && (
          <button
            onClick={() => {
              document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
              setResult(null);
            }}
            className="flex-1 py-3 bg-muted text-foreground rounded-lg font-medium"
          >
            <TrilingualLabel chinese="再试" pinyin="zài shì" english="Try Again" size="xs" />
          </button>
        )}
        {result === "correct" && (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            <TrilingualLabel chinese="下一题" pinyin="xià yì tí" english="Next" size="xs" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function SentencesPage() {
  return (
    <Suspense>
      <SentencesPageInner />
    </Suspense>
  );
}

// ── Drop zones (defined after main to keep hook rules happy) ──────────────────

function AnswerDropZone({
  selIds,
  selected,
  onTap,
}: {
  selIds: string[];
  selected: string[];
  onTap: (word: string, i: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "answer-area" });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] bg-muted rounded-lg p-3 flex flex-wrap gap-2 transition-colors ${
        isOver ? "ring-2 ring-primary/60" : ""
      }`}
    >
      <SortableContext items={selIds} strategy={rectSortingStrategy}>
        {selected.map((word, i) => (
          <SortableWord
            key={selIds[i]}
            id={selIds[i]}
            word={word}
            onTap={() => onTap(word, i)}
          />
        ))}
      </SortableContext>
    </div>
  );
}

function BankDropZone({
  bankIds,
  shuffledBank,
  onTap,
}: {
  bankIds: string[];
  shuffledBank: string[];
  onTap: (word: string, i: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "bank-area" });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-wrap gap-2 min-h-[44px] rounded-lg transition-colors ${
        isOver ? "ring-2 ring-muted-foreground/30" : ""
      }`}
    >
      {shuffledBank.map((word, i) => (
        <DraggableWord
          key={bankIds[i]}
          id={bankIds[i]}
          word={word}
          onTap={() => onTap(word, i)}
        />
      ))}
    </div>
  );
}
