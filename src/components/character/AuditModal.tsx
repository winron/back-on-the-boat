"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import type { HskWord, WordCorrection } from "@/types";

interface AuditModalProps {
  word: HskWord;
  onClose: () => void;
  onSaved: (corrections: { pinyin?: string; meaning?: string }) => void;
}

export default function AuditModal({ word, onClose, onSaved }: AuditModalProps) {
  const [pinyin, setPinyin] = useState(word.pinyin);
  const [meaning, setMeaning] = useState(word.meaning);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const correction: WordCorrection = {
      id: word.id,
      pinyin: pinyin !== word.pinyin ? pinyin : undefined,
      meaning: meaning !== word.meaning ? meaning : undefined,
      correctedAt: new Date().toISOString(),
    };
    if (correction.pinyin !== undefined || correction.meaning !== undefined) {
      await db.wordCorrections.put(correction);
      onSaved({ pinyin: correction.pinyin, meaning: correction.meaning });
    }
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 mx-4 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-2xl font-normal">{word.simplified}</p>
          <p className="text-xs text-muted-foreground font-mono">{word.id}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Pinyin <span className="opacity-60">(tones after letters, e.g. sheng1)</span>
            </label>
            <input
              type="text"
              value={pinyin}
              onChange={(e) => setPinyin(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Meaning
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-muted text-foreground rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
