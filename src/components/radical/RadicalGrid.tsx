"use client";

import { useState, useMemo } from "react";
import type { Radical } from "@/types";
import RadicalCard from "@/components/radical/RadicalCard";
import RadicalDetail from "@/components/radical/RadicalDetail";

interface RadicalGridProps {
  radicals: Radical[];
}

export default function RadicalGrid({ radicals }: RadicalGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrokeCount, setSelectedStrokeCount] = useState<number | null>(
    null
  );
  const [selectedRadical, setSelectedRadical] = useState<Radical | null>(null);

  // Get unique stroke counts for filter buttons
  const strokeCounts = useMemo(() => {
    return Array.from(
      new Set(radicals.map((r) => r.strokeCount))
    ).sort((a, b) => a - b);
  }, [radicals]);

  // Filter radicals based on search and stroke count
  const filteredRadicals = useMemo(() => {
    return radicals.filter((radical) => {
      // Filter by stroke count if selected
      if (selectedStrokeCount !== null && radical.strokeCount !== selectedStrokeCount) {
        return false;
      }

      // Filter by search query (character, pinyin, or meaning)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          radical.character.includes(searchQuery) ||
          radical.pinyin.toLowerCase().includes(query) ||
          radical.meaning.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [radicals, searchQuery, selectedStrokeCount]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <input
        type="text"
        placeholder="Search by character, pinyin, or meaning..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 bg-muted text-foreground border border-border rounded-lg text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Stroke count filter buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStrokeCount(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedStrokeCount === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-border"
          }`}
        >
          All ({radicals.length})
        </button>
        {strokeCounts.map((count) => {
          const count_radicals = radicals.filter((r) => r.strokeCount === count).length;
          return (
            <button
              key={count}
              onClick={() => setSelectedStrokeCount(count)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedStrokeCount === count
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {count}画 ({count_radicals})
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filteredRadicals.length} of {radicals.length} radicals
      </p>

      {/* Radicals grid */}
      {filteredRadicals.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {filteredRadicals.map((radical) => (
            <button
              key={radical.number}
              onClick={() => setSelectedRadical(radical)}
              className="focus:outline-none"
            >
              <RadicalCard radical={radical} />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No radicals found
        </div>
      )}

      {/* Detail modal/panel */}
      {selectedRadical && (
        <RadicalDetail
          radical={selectedRadical}
          onClose={() => setSelectedRadical(null)}
        />
      )}
    </div>
  );
}
