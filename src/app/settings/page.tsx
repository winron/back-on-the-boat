"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import TrilingualLabel from "@/components/shared/TrilingualLabel";
import type { UserSettings } from "@/types";

export default function SettingsPage() {
  const [dailyGoal, setDailyGoal] = useState(20);

  useEffect(() => {
    db.settings.get("settings").then((s) => {
      if (s) {
        setDailyGoal(s.dailyGoal);
      }
    });
  }, []);

  const updateSetting = async (updates: Partial<UserSettings>) => {
    const existing = await db.settings.get("settings");
    if (existing) {
      await db.settings.update("settings", updates);
    } else {
      await db.settings.put({
        id: "settings",
        currentHskLevel: 1,
        theme: "dark",
        dailyGoal,
        showPinyin: true,
        ...updates,
      });
    }
  };

  const handleExport = async () => {
    const cards = await db.srsCards.toArray();
    const stats = await db.dailyStats.toArray();
    const settings = await db.settings.get("settings");
    const displaySettings = await db.displaySettings.get("displaySettings");
    const pageLevels = await db.pageLevels.get("pageLevels");
    const data = JSON.stringify({ cards, stats, settings, displaySettings, pageLevels }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hsk-master-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.cards) await db.srsCards.bulkPut(data.cards);
      if (data.stats) await db.dailyStats.bulkPut(data.stats);
      if (data.settings) await db.settings.put(data.settings);
      if (data.displaySettings) await db.displaySettings.put(data.displaySettings);
      if (data.pageLevels) await db.pageLevels.put(data.pageLevels);
      window.location.reload();
    };
    input.click();
  };

  const handleReset = async () => {
    if (
      confirm(
        "This will delete all your progress. Are you sure?"
      )
    ) {
      await db.srsCards.clear();
      await db.dailyStats.clear();
      await db.settings.clear();
      await db.displaySettings.clear();
      await db.pageLevels.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <TrilingualLabel chinese="设置" pinyin="shèzhì" english="Settings" size="lg" />

      {/* Daily Goal */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Daily Goal</label>
        <div className="flex gap-2">
          {[10, 20, 30, 50].map((g) => (
            <button
              key={g}
              onClick={() => {
                setDailyGoal(g);
                updateSetting({ dailyGoal: g });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dailyGoal === g
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Data management */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h2 className="text-sm font-medium">Data</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 py-3 bg-muted rounded-xl text-sm font-medium"
          >
            Export Backup
          </button>
          <button
            onClick={handleImport}
            className="flex-1 py-3 bg-muted rounded-xl text-sm font-medium"
          >
            Import Backup
          </button>
        </div>
        <button
          onClick={handleReset}
          className="w-full py-3 bg-red-500 text-white rounded-xl text-sm font-medium"
        >
          Reset All Progress
        </button>
      </div>
    </div>
  );
}
