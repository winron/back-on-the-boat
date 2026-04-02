"use client";

import { useEffect, useState } from "react";
import { loadRadicals } from "@/lib/data-loader";
import type { Radical } from "@/types";
import RadicalGrid from "@/components/radical/RadicalGrid";
import TrilingualLabel from "@/components/shared/TrilingualLabel";

export default function RadicalsPage() {
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await loadRadicals();
        setRadicals(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load radicals"
        );
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <main className="min-h-screen bg-background tab-color-2">
      <div className="max-w-lg mx-auto p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <TrilingualLabel
            chinese="部首"
            pinyin="bùshǒu"
            english="Radicals"
            size="lg"
            className="block text-center"
          />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading radicals...
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-8">
            Error: {error}
          </div>
        ) : radicals.length > 0 ? (
          <RadicalGrid radicals={radicals} />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No radicals found
          </div>
        )}
      </div>
    </main>
  );
}
