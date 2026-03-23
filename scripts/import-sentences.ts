/**
 * import-sentences.ts
 *
 * Generates sentence exercises for HSK 1-6 by extracting example sentences
 * from the grammar pattern files (public/data/hsk{N}-grammar.json) and
 * segmenting them into word-bank tiles using the vocabulary files.
 *
 * Usage: npx tsx scripts/import-sentences.ts
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GrammarExample {
  chinese: string;
  pinyin: string;
  english: string;
}

interface GrammarPattern {
  id: string;
  hskLevel: number;
  title: string;
  structure: string;
  explanation: string;
  examples: GrammarExample[];
}

interface SentenceExercise {
  id: string;
  hskLevel: number;
  targetSentence: string;
  targetPinyin: string;
  targetMeaning: string;
  wordBank: string[];
}

interface VocabEntry {
  simplified: string;
  hskLevel: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, "..", "public", "data");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
}

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2) + "\n"
  );
}

/** Fisher-Yates shuffle (in-place, returns same array). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Chinese punctuation we want to keep as separate tokens
const PUNCT_RE = /[。，、！？；：""（）《》……—·]/;

// ---------------------------------------------------------------------------
// Build a vocabulary lookup (all levels up to and including the target level)
// ---------------------------------------------------------------------------

function buildVocabSet(): Map<number, Set<string>> {
  // Collect all vocab words per level (cumulative)
  const allWords: { word: string; level: number }[] = [];
  for (let lvl = 1; lvl <= 6; lvl++) {
    const vocab = readJson<VocabEntry[]>(`hsk${lvl}-vocab.json`);
    for (const v of vocab) {
      allWords.push({ word: v.simplified, level: lvl });
    }
  }

  // For each level, build a set containing words from that level and all lower levels
  const cumulative = new Map<number, Set<string>>();
  const running = new Set<string>();
  for (let lvl = 1; lvl <= 6; lvl++) {
    for (const w of allWords.filter((x) => x.level === lvl)) {
      running.add(w.word);
    }
    cumulative.set(lvl, new Set(running));
  }
  return cumulative;
}

// ---------------------------------------------------------------------------
// Segment a Chinese sentence into word-bank tokens
// ---------------------------------------------------------------------------

/**
 * Segments a Chinese sentence into tokens using the pinyin as a guide.
 *
 * Strategy:
 *   1. Use pinyin syllable groups to determine word boundaries.
 *      Pinyin words written together (no space) correspond to
 *      multi-character words (e.g., "diànhuà" -> "电话").
 *   2. Punctuation in the pinyin is matched and emitted as separate tokens.
 *   3. After initial segmentation, refine using vocabulary lookup.
 */
function segmentSentence(
  chinese: string,
  pinyin: string,
  vocabSet: Set<string>
): string[] {
  const tokens: string[] = [];

  // Split pinyin into space-separated groups (each group = one word)
  const pinyinGroups = pinyin.split(/\s+/).filter((g) => g.length > 0);

  // Walk through the Chinese string, matching pinyin groups to characters
  let charIdx = 0;
  const chars = [...chinese]; // Handle multi-byte correctly

  for (const pg of pinyinGroups) {
    if (charIdx >= chars.length) break;

    // If this pinyin group is punctuation, match the punctuation char
    if (PUNCT_RE.test(pg) && pg.length <= 2) {
      if (charIdx < chars.length && PUNCT_RE.test(chars[charIdx])) {
        tokens.push(chars[charIdx]);
        charIdx++;
      }
      continue;
    }

    // Count the number of toned syllables in this pinyin group.
    // Each Chinese character maps to exactly one syllable.
    const syllableCount = countPinyinSyllables(pg);

    // Take that many characters from the Chinese string
    const wordChars: string[] = [];
    for (let s = 0; s < syllableCount && charIdx < chars.length; s++) {
      // Skip any inline punctuation characters
      while (charIdx < chars.length && PUNCT_RE.test(chars[charIdx])) {
        tokens.push(chars[charIdx]);
        charIdx++;
      }
      if (charIdx < chars.length) {
        wordChars.push(chars[charIdx]);
        charIdx++;
      }
    }

    if (wordChars.length > 0) {
      tokens.push(wordChars.join(""));
    }
  }

  // Pick up any remaining characters
  while (charIdx < chars.length) {
    tokens.push(chars[charIdx]);
    charIdx++;
  }

  // Refine: merge/split tokens using vocabulary knowledge
  return refineTokens(tokens, vocabSet);
}

/**
 * Count Mandarin syllables in a pinyin string (no spaces).
 * Each syllable has exactly one vowel nucleus.
 * Examples: "māmā" -> 2, "diànhuà" -> 2, "zhèngzài" -> 2, "wǒ" -> 1
 */
function countPinyinSyllables(py: string): number {
  // Remove tone marks for easier counting
  const normalized = py
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // Count vowel groups (a, e, i, o, u, ü)
  const vowelGroups = normalized.match(/[aeiouüv]+/g);
  return vowelGroups ? vowelGroups.length : 1;
}

/**
 * Refine tokens:
 * - Try merging adjacent non-punctuation tokens into known vocabulary words
 * - Split multi-char tokens not found in vocab into sub-words or characters
 */
function refineTokens(tokens: string[], vocabSet: Set<string>): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];

    // Punctuation: keep as-is
    if (PUNCT_RE.test(tok)) {
      result.push(tok);
      i++;
      continue;
    }

    // Try greedy forward merge: see if combining with next tokens forms a vocab word
    let bestLen = 0;
    let bestWord = "";
    let combined = tok;
    for (let j = i + 1; j < Math.min(i + 4, tokens.length); j++) {
      if (PUNCT_RE.test(tokens[j])) break;
      combined += tokens[j];
      if (vocabSet.has(combined)) {
        bestLen = j - i + 1;
        bestWord = combined;
      }
    }

    if (bestLen > 1) {
      result.push(bestWord);
      i += bestLen;
      continue;
    }

    // Current token as-is if it's a known word or single character
    if (vocabSet.has(tok) || tok.length === 1) {
      result.push(tok);
      i++;
      continue;
    }

    // Multi-char token not in vocab: split using longest-match against vocab
    const subTokens = splitIntoVocabWords(tok, vocabSet);
    result.push(...subTokens);
    i++;
  }

  return result;
}

/**
 * Split a multi-character string into vocabulary words using greedy longest-match.
 * Falls back to individual characters for unrecognized segments.
 */
function splitIntoVocabWords(text: string, vocabSet: Set<string>): string[] {
  const chars = [...text];
  const result: string[] = [];
  let i = 0;

  while (i < chars.length) {
    let bestLen = 0;
    for (let len = Math.min(4, chars.length - i); len >= 2; len--) {
      const candidate = chars.slice(i, i + len).join("");
      if (vocabSet.has(candidate)) {
        bestLen = len;
        break;
      }
    }

    if (bestLen > 0) {
      result.push(chars.slice(i, i + bestLen).join(""));
      i += bestLen;
    } else {
      result.push(chars[i]);
      i++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("Building vocabulary lookup...");
  const vocabByLevel = buildVocabSet();

  // Use the full vocabulary (all HSK levels) for segmentation so that
  // grammar example sentences containing words from higher levels are
  // still tokenized correctly.
  const fullVocab = vocabByLevel.get(6)!;

  const summary: Record<number, number> = {};

  for (let level = 1; level <= 6; level++) {
    const grammar = readJson<GrammarPattern[]>(`hsk${level}-grammar.json`);
    const vocabSet = fullVocab;

    // Collect all example sentences from grammar patterns
    const allExamples: GrammarExample[] = [];
    for (const pattern of grammar) {
      for (const ex of pattern.examples) {
        allExamples.push(ex);
      }
    }

    // Deduplicate by Chinese sentence text
    const seen = new Set<string>();
    const uniqueExamples: GrammarExample[] = [];
    for (const ex of allExamples) {
      const key = ex.chinese.trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueExamples.push(ex);
      }
    }

    // Create sentence exercises
    const exercises: SentenceExercise[] = [];
    let idx = 1;

    for (const ex of uniqueExamples) {
      const chinese = ex.chinese.trim();
      const pinyinStr = ex.pinyin.trim();
      const english = ex.english.trim();

      // Skip very short sentences (< 2 non-punctuation characters)
      const contentChars = [...chinese].filter((ch) => !PUNCT_RE.test(ch));
      if (contentChars.length < 2) continue;

      // Segment into word bank tokens
      const tokens = segmentSentence(chinese, pinyinStr, vocabSet);

      // Filter out empty tokens and ensure we have at least 2
      const wordBank = tokens.filter((t) => t.length > 0);
      if (wordBank.length < 2) continue;

      // Clean up pinyin: remove extra spaces around punctuation
      const cleanPinyin = pinyinStr
        .replace(/\s+([。，、！？；：])/g, "$1")
        .replace(/\s+/g, " ")
        .trim();

      const id = `s${level}-${String(idx).padStart(3, "0")}`;
      exercises.push({
        id,
        hskLevel: level,
        targetSentence: chinese,
        targetPinyin: cleanPinyin,
        targetMeaning: english,
        wordBank: shuffle([...wordBank]),
      });
      idx++;
    }

    // Write output
    const outFile = `hsk${level}-sentences.json`;
    writeJson(outFile, exercises);
    summary[level] = exercises.length;
    console.log(
      `HSK ${level}: ${exercises.length} sentence exercises -> ${outFile}`
    );
  }

  console.log("\n=== Summary ===");
  let total = 0;
  for (let level = 1; level <= 6; level++) {
    console.log(`  HSK ${level}: ${summary[level]} sentences`);
    total += summary[level];
  }
  console.log(`  Total: ${total} sentences`);
}

main();
