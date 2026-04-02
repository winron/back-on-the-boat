"use client";

import { useEffect, useState } from "react";
import type { Radical, HskWord } from "@/types";
import { loadVocabulary } from "@/lib/data-loader";
import StrokeOrder from "@/components/character/StrokeOrder";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";

interface RadicalDetailProps {
  radical: Radical;
  onClose: () => void;
}

export default function RadicalDetail({
  radical,
  onClose,
}: RadicalDetailProps) {
  const { showPinyin, showEnglish } = useDisplaySettings();
  const [exampleWords, setExampleWords] = useState<HskWord[]>([]);
  const [loadingExamples, setLoadingExamples] = useState(true);

  // Load example words from vocabulary
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingExamples(true);
        const examples: HskWord[] = [];

        // Load all 6 HSK levels to find words containing this radical
        for (let level = 1; level <= 6; level++) {
          const words = await loadVocabulary(level as 1 | 2 | 3 | 4 | 5 | 6);
          const radicalWords = words.filter(
            (w) => w.radical === radical.character
          );
          examples.push(...radicalWords);

          // Stop if we have enough examples
          if (examples.length >= 6) {
            examples.length = 6;
            break;
          }
        }

        setExampleWords(examples);
      } catch (err) {
        console.error("Failed to load example words:", err);
      } finally {
        setLoadingExamples(false);
      }
    };

    fetch();
  }, [radical]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full bg-card rounded-t-lg p-6 max-h-[80vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-medium mb-1">{radical.character}</h2>
            <div className="flex gap-4 text-sm text-muted-foreground">
              {showPinyin && <span>{radical.pinyin}</span>}
              {showEnglish && <span>{radical.meaning}</span>}
              <span>{radical.strokeCount}画</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-border transition-colors"
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Stroke order animation */}
        <div className="flex justify-center mb-6">
          <StrokeOrder
            character={radical.character}
            size={180}
            strokeColor="#f15bb5"
          />
        </div>

        {/* Radical information */}
        <div className="mb-6 p-3 bg-muted rounded-lg">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
            RADICAL INFORMATION
          </h3>
          <div className="text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">Number: </span>
              <span className="font-medium">{radical.number}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Strokes: </span>
              <span className="font-medium">{radical.strokeCount}</span>
            </div>
            {radical.variants && radical.variants.length > 0 && (
              <div>
                <span className="text-muted-foreground">Variants: </span>
                <span className="font-medium">{radical.variants.join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Example words */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3">
            EXAMPLE WORDS ({exampleWords.length})
          </h3>
          {loadingExamples ? (
            <div className="text-xs text-muted-foreground py-4">
              Loading examples...
            </div>
          ) : exampleWords.length > 0 ? (
            <div className="space-y-2">
              {exampleWords.map((word) => (
                <div
                  key={word.id}
                  className="p-2.5 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium min-w-[2rem]">
                      {word.simplified}
                    </span>
                    <div className="flex-1">
                      {showPinyin && (
                        <div className="text-xs text-muted-foreground">
                          {word.pinyin}
                        </div>
                      )}
                      {showEnglish && (
                        <div className="text-xs text-foreground">
                          {word.meaning}
                        </div>
                      )}
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                      HSK {word.hskLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground py-4">
              No example words found for this radical
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
