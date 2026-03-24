/**
 * Improve English translations and parts of speech in HSK vocab JSON files.
 *
 * Uses Claude (Haiku) to rewrite each word's meaning into a clean,
 * learner-friendly definition and normalize partOfSpeech abbreviations.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/improve-translations.ts
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/improve-translations.ts --level 1
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/improve-translations.ts --dry-run
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/improve-translations.ts --reset
 *
 * Words with improvedMeaning=true are skipped — safe to re-run after a crash.
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { thematicUnits } from "./thematic-units";

const DATA_DIR = join(__dirname, "..", "public", "data");
const MODEL = "claude-haiku-4-5";
const BATCH_SIZE = 20;
const MAX_RETRIES = 4;
const INITIAL_RETRY_MS = 2000;
const INTER_BATCH_DELAY_MS = 500;

// Build a level+unitIndex → Chinese name lookup from thematic units
const unitNameZhLookup: Record<string, string> = {};
for (const [levelStr, units] of Object.entries(thematicUnits)) {
  for (const unit of units) {
    unitNameZhLookup[`${levelStr}:${unit.index}`] = unit.nameZh;
  }
}

const SYSTEM_PROMPT = `You are a Chinese language learning assistant improving English definitions for an HSK flashcard app aimed at adult English-speaking learners.

Your task: for each word, rewrite the English meaning AND normalize the part of speech.

MEANING rules:
- 1–3 definitions max, separated by semicolons only when meanings are genuinely different
- No linguistic jargon: never use "bound form", "substantive", "nominalizer", "coverb", "aspectual particle", or similar academic terms
- For grammatical particles (的, 了, 着, 过, 呢, 吗, etc.), describe their function in plain English (e.g. 的 → "marks possession or modifies a noun, like 's or 'of' in English")
- HSK 1–2: extremely simple English (A2 level)
- HSK 3–4: clear everyday English (B1 level)
- HSK 5–6: natural English, may be slightly more nuanced but still jargon-free
- Drop obscure or archaic usages; keep the most common meanings only

PART OF SPEECH rules:
Use only these plain English labels (pick the most appropriate):
noun, verb, adjective, adverb, pronoun, particle, preposition, conjunction, measure word, numeral, exclamation, phrase
- Expand single-letter codes: r→pronoun, v→verb, n→noun, d→adverb, a→adjective, u→particle, m→numeral, p→preposition, c→conjunction, e→exclamation, t→time word→noun, q→measure word
- Multi-function: use "/" (e.g. "verb / noun")
- Keep it concise — one or two labels max

OUTPUT: Return ONLY a valid JSON array of objects with "meaning" and "partOfSpeech" keys, in the exact same order as the input. No markdown, no explanation, no code fences.`;

interface VocabEntry {
  id: string;
  simplified: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  partOfSpeech?: string;
  frequency?: number;
  unitIndex: number;
  unitName: string;
  improvedMeaning?: boolean;
  [key: string]: unknown;
}

interface BatchItem {
  id: string;
  simplified: string;
  pinyin: string;
  hskLevel: number;
  rawPartOfSpeech: string;
  rawMeaning: string;
}

interface ImprovedResult {
  meaning: string;
  partOfSpeech: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const levelIdx = args.indexOf("--level");
  const batchIdx = args.indexOf("--batch-size");
  return {
    level: levelIdx !== -1 ? parseInt(args[levelIdx + 1]) : null,
    dryRun: args.includes("--dry-run"),
    reset: args.includes("--reset"),
    batchSize: batchIdx !== -1 ? parseInt(args[batchIdx + 1]) : BATCH_SIZE,
  };
}

function loadLevel(level: number): VocabEntry[] {
  const path = join(DATA_DIR, `hsk${level}-vocab.json`);
  return JSON.parse(readFileSync(path, "utf-8")) as VocabEntry[];
}

function saveLevel(level: number, words: VocabEntry[]): void {
  const path = join(DATA_DIR, `hsk${level}-vocab.json`);
  writeFileSync(path, JSON.stringify(words, null, 2), "utf-8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseResponse(text: string, expectedLen: number): ImprovedResult[] {
  // Strip accidental markdown fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  const parsed = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(parsed) || parsed.length !== expectedLen) {
    throw new Error(
      `Expected array of length ${expectedLen}, got length ${Array.isArray(parsed) ? parsed.length : "non-array"}: ${JSON.stringify(parsed).slice(0, 200)}`
    );
  }
  return parsed as ImprovedResult[];
}

async function callClaudeWithRetry(
  client: Anthropic,
  batch: BatchItem[],
  attempt = 0
): Promise<ImprovedResult[]> {
  try {
    const userContent =
      JSON.stringify(batch, null, 2) +
      "\n\nReturn only the JSON array, no explanation.";
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return parseResponse(text, batch.length);
  } catch (err) {
    const isRetryable =
      err instanceof Anthropic.RateLimitError ||
      err instanceof Anthropic.InternalServerError ||
      (err instanceof Anthropic.APIError && err.status === 529);
    if (isRetryable && attempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_MS * Math.pow(2, attempt);
      console.warn(
        `  Retryable error (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`
      );
      await sleep(delay);
      return callClaudeWithRetry(client, batch, attempt + 1);
    }
    throw err;
  }
}

async function processLevel(
  client: Anthropic,
  level: number,
  opts: { dryRun: boolean; batchSize: number }
): Promise<void> {
  const words = loadLevel(level);
  const pending = words.filter((w) => !w.improvedMeaning);
  const total = words.length;
  const alreadyDone = total - pending.length;

  console.log(
    `\nHSK ${level}: ${total} words total — ${alreadyDone} already improved, ${pending.length} pending`
  );

  if (pending.length === 0) {
    console.log(`  Nothing to do.`);
    return;
  }

  if (opts.dryRun) {
    console.log(
      `  [dry-run] Would process ${pending.length} words in ${Math.ceil(pending.length / opts.batchSize)} batches.`
    );
    return;
  }

  // Build index for fast word lookup by id
  const wordIndex = new Map(words.map((w, i) => [w.id, i]));

  // Chunk pending words into batches
  const chunks: VocabEntry[][] = [];
  for (let i = 0; i < pending.length; i += opts.batchSize) {
    chunks.push(pending.slice(i, i + opts.batchSize));
  }

  let processed = alreadyDone;
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const batch: BatchItem[] = chunk.map((w) => ({
      id: w.id,
      simplified: w.simplified,
      pinyin: w.pinyin,
      hskLevel: w.hskLevel,
      rawPartOfSpeech: w.partOfSpeech ?? "",
      rawMeaning: w.meaning,
    }));

    console.log(
      `  Batch ${ci + 1}/${chunks.length} — words ${processed + 1}–${processed + chunk.length} of ${total}...`
    );

    const results = await callClaudeWithRetry(client, batch);

    for (let i = 0; i < chunk.length; i++) {
      const idx = wordIndex.get(chunk[i].id)!;
      words[idx].meaning = results[i].meaning;
      words[idx].partOfSpeech = results[i].partOfSpeech;
      words[idx].improvedMeaning = true;
    }

    // Save after every batch for crash-resilience
    saveLevel(level, words);
    processed += chunk.length;

    if (ci < chunks.length - 1) {
      await sleep(INTER_BATCH_DELAY_MS);
    }
  }

  console.log(`  ✓ HSK ${level} complete — ${processed}/${total} words improved.`);
}

async function main() {
  const opts = parseArgs();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey && !opts.dryRun) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    console.error(
      "Usage: ANTHROPIC_API_KEY=sk-... npm run improve-translations"
    );
    process.exit(1);
  }

  const levels = opts.level ? [opts.level] : [1, 2, 3, 4, 5, 6];

  // --reset: clear improvedMeaning flags so the full run starts fresh
  if (opts.reset) {
    console.log(
      `Resetting improvedMeaning flags for HSK ${levels.join(", ")}...`
    );
    for (const level of levels) {
      const words = loadLevel(level);
      let count = 0;
      for (const w of words) {
        if (w.improvedMeaning) {
          delete w.improvedMeaning;
          count++;
        }
      }
      saveLevel(level, words);
      console.log(`  HSK ${level}: reset ${count} words.`);
    }
    console.log("Reset complete. Re-run without --reset to process.");
    return;
  }

  const client = new Anthropic({ apiKey: apiKey ?? "dry-run" });

  console.log(
    `Model: ${MODEL} | Batch size: ${opts.batchSize}${opts.dryRun ? " | DRY RUN" : ""}`
  );
  console.log(
    `Processing HSK level${levels.length > 1 ? "s" : ""}: ${levels.join(", ")}\n`
  );

  for (const level of levels) {
    await processLevel(client, level, opts);
  }

  console.log("\nAll done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
