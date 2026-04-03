"use client";

import { useEffect, useState } from "react";
import { loadRadicals } from "@/lib/data-loader";
import { db } from "@/lib/db";
import AudioButton from "@/components/shared/AudioButton";
import type { Radical, RadicalCorrection } from "@/types";

interface RadicalPopupProps {
  radicalChar: string;
  onClose: () => void;
}

export default function RadicalPopup({ radicalChar, onClose }: RadicalPopupProps) {
  const [radical, setRadical] = useState<Radical | null>(null);
  const [correction, setCorrection] = useState<RadicalCorrection | undefined>();
  const [isClosing, setIsClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPinyin, setEditPinyin] = useState("");
  const [editMeaning, setEditMeaning] = useState("");

  useEffect(() => {
    loadRadicals().then((radicals) => {
      const match = radicals.find((r) => r.character === radicalChar);
      setRadical(match ?? null);
    });
    db.radicalCorrections.get(radicalChar).then((c) => {
      setCorrection(c);
    });
  }, [radicalChar]);

  // Lock background scroll while popup is open
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      if (main) main.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const displayPinyin = correction?.pinyin ?? radical?.pinyin ?? "";
  const displayMeaning = correction?.meaning ?? radical?.meaning ?? "";

  const handleEdit = () => {
    setEditPinyin(displayPinyin);
    setEditMeaning(displayMeaning);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!radical) return;
    const newPinyin = editPinyin !== radical.pinyin ? editPinyin : undefined;
    const newMeaning = editMeaning !== radical.meaning ? editMeaning : undefined;
    if (newPinyin !== undefined || newMeaning !== undefined) {
      const corr: RadicalCorrection = {
        id: radicalChar,
        pinyin: newPinyin,
        meaning: newMeaning,
        correctedAt: new Date().toISOString(),
      };
      await db.radicalCorrections.put(corr);
      setCorrection(corr);
    }
    setEditing(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 150);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={handleClose}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-150 ${isClosing ? "opacity-0" : "opacity-100"}`} />
      <div
        className={`relative bg-card border border-border rounded-xl p-6 mx-4 max-w-xs w-full text-center space-y-3 transition-all duration-150 ${
          isClosing ? "opacity-0 scale-90" : "animate-[popup-in_0.15s_ease-out]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-5xl">{radicalChar}</p>
        {radical ? (
          editing ? (
            <div className="space-y-3 text-left">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Pinyin</label>
                <input
                  type="text"
                  value={editPinyin}
                  onChange={(e) => setEditPinyin(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Meaning</label>
                <input
                  type="text"
                  value={editMeaning}
                  onChange={(e) => setEditMeaning(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 bg-muted text-foreground rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-lg text-indigo-400">{displayPinyin}</p>
              <p className="text-base text-muted-foreground">{displayMeaning}</p>
              <p className="text-xs text-muted-foreground">
                {radical.strokeCount} stroke{radical.strokeCount !== 1 ? "s" : ""}
                {radical.variantOf && ` · variant of ${radical.variantOf}`}
              </p>
              <div className="flex justify-center gap-3 pt-1">
                <AudioButton text={radical.character} />
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-border transition-colors"
                  aria-label="Edit radical"
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
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleClose}
                className="mt-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm"
              >
                Close
              </button>
            </>
          )
        ) : (
          <p className="text-sm text-muted-foreground">{radicalChar}</p>
        )}
      </div>
    </div>
  );
}
