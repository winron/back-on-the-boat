import type {
  HskWord,
  GrammarPattern,
  SentenceExercise,
  Dialogue,
  HskLevel,
} from "@/types";

const cache = new Map<string, unknown>();

async function loadJson<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data = await res.json();
  cache.set(path, data);
  return data as T;
}

export async function loadVocabulary(level: HskLevel): Promise<HskWord[]> {
  return loadJson<HskWord[]>(`/data/hsk${level}-vocab.json`);
}

export async function loadGrammar(level: HskLevel): Promise<GrammarPattern[]> {
  return loadJson<GrammarPattern[]>(`/data/hsk${level}-grammar.json`);
}

export async function loadSentences(
  level: HskLevel
): Promise<SentenceExercise[]> {
  return loadJson<SentenceExercise[]>(`/data/hsk${level}-sentences.json`);
}

export async function loadDialogues(level: HskLevel): Promise<Dialogue[]> {
  return loadJson<Dialogue[]>(`/data/hsk${level}-dialogues.json`);
}
