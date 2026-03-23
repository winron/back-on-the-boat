/**
 * Import grammar data from krmanik/Chinese-Grammar (AllSet Learning Wiki)
 *
 * Fetches CSV files for HSK 1-6, groups example sentences by grammar topic,
 * and outputs structured grammar pattern JSON files.
 *
 * Usage: npx tsx scripts/import-grammar.ts
 *
 * Source: https://github.com/krmanik/Chinese-Grammar (CC BY-NC-SA 3.0)
 * Output: public/data/hsk{1-6}-grammar.json
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = join(__dirname, "..", "public", "data");

const BASE_URL =
  "https://raw.githubusercontent.com/krmanik/Chinese-Grammar/master/CSV%20Files%20HSK1%20-%20HSK6";

interface CsvRow {
  chinese: string;
  simplified: string;
  pinyin: string;
  english: string;
  audio: string;
  pattern: string;
  category: string;
  topic: string;
  url: string;
}

interface GrammarPattern {
  id: string;
  hskLevel: number;
  title: string;
  structure: string;
  explanation: string;
  examples: { chinese: string; pinyin: string; english: string }[];
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  // Skip header
  return lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    return {
      chinese: fields[0] || "",
      simplified: fields[1] || "",
      pinyin: fields[2] || "",
      english: fields[3] || "",
      audio: fields[4] || "",
      pattern: fields[5] || "",
      category: fields[6] || "",
      topic: fields[7] || "",
      url: fields[8] || "",
    };
  });
}

function cleanPattern(pattern: string): string {
  // Remove :: delimiters and clean up
  return pattern.replace(/::/g, "").trim();
}

function generateExplanation(topic: string, category: string): string {
  // Create a concise explanation from the topic name and categories
  const cleanTopic = topic.replace(/"/g, "'");
  const cats = category
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  if (cats.length > 0) {
    return `${cleanTopic}. Used for ${cats.join(", ")}.`;
  }
  return cleanTopic;
}

async function fetchCsv(level: number): Promise<CsvRow[]> {
  const url = `${BASE_URL}/hsk${level}.csv`;
  console.log(`  Fetching ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch HSK ${level}: ${res.status}`);
  const text = await res.text();
  return parseCsv(text);
}

async function processLevel(level: number): Promise<GrammarPattern[]> {
  const rows = await fetchCsv(level);

  // Group by grammar topic
  const topicMap = new Map<
    string,
    { pattern: string; category: string; url: string; examples: CsvRow[] }
  >();

  for (const row of rows) {
    if (!row.topic || !row.simplified) continue;

    const key = row.topic;
    if (!topicMap.has(key)) {
      topicMap.set(key, {
        pattern: row.pattern,
        category: row.category,
        url: row.url,
        examples: [],
      });
    }
    topicMap.get(key)!.examples.push(row);
  }

  // Convert to GrammarPattern format
  const patterns: GrammarPattern[] = [];
  let idx = 0;

  for (const [topic, data] of topicMap) {
    idx++;
    const id = `g${level}-${String(idx).padStart(3, "0")}`;

    // Take up to 5 example sentences per grammar topic
    const examples = data.examples.slice(0, 5).map((ex) => ({
      chinese: ex.simplified,
      pinyin: ex.pinyin,
      english: ex.english,
    }));

    patterns.push({
      id,
      hskLevel: level,
      title: topic.replace(/"/g, "'"),
      structure: cleanPattern(data.pattern),
      explanation: generateExplanation(topic, data.category),
      examples,
    });
  }

  return patterns;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Importing grammar from AllSet Learning (Chinese-Grammar)...\n");

  let totalPatterns = 0;
  let totalExamples = 0;

  for (let level = 1; level <= 6; level++) {
    try {
      const patterns = await processLevel(level);
      const outPath = join(OUTPUT_DIR, `hsk${level}-grammar.json`);
      writeFileSync(outPath, JSON.stringify(patterns, null, 2));

      const exCount = patterns.reduce(
        (sum, p) => sum + p.examples.length,
        0
      );
      totalPatterns += patterns.length;
      totalExamples += exCount;

      console.log(
        `  HSK ${level}: ${patterns.length} grammar patterns, ${exCount} examples → ${outPath}`
      );
    } catch (err) {
      console.error(`  HSK ${level}: ERROR -`, err);
    }
  }

  console.log(
    `\nDone! Total: ${totalPatterns} patterns, ${totalExamples} examples`
  );
}

main().catch(console.error);
