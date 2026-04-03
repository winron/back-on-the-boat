// === Vocabulary / Character ===
export interface HskWord {
  id: string;
  simplified: string;
  traditional?: string;
  pinyin: string;
  meaning: string;
  hskLevel: 1 | 2 | 3 | 4 | 5 | 6;
  partOfSpeech?: string;
  frequency?: number;
  unitIndex: number;
  unitName: string;
  improvedMeaning?: boolean;
  exampleSentence?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
}

// === Grammar ===
export interface GrammarPattern {
  id: string;
  hskLevel: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  structure: string;
  explanation: string;
  examples: GrammarExample[];
}

export interface GrammarExample {
  chinese: string;
  pinyin: string;
  english: string;
}

// === Sentence Formation ===
export interface SentenceExercise {
  id: string;
  hskLevel: 1 | 2 | 3 | 4 | 5 | 6;
  targetSentence: string;
  targetPinyin: string;
  targetMeaning: string;
  wordBank: string[];
  grammarId?: string;
}

// === Dialogue ===
export interface Dialogue {
  id: string;
  hskLevel: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  context?: string;
  lines: DialogueLine[];
}

export interface DialogueLine {
  speaker: string;
  chinese: string;
  pinyin: string;
  english: string;
}

// === Reading Passage ===
export interface ReadingPassage {
  id: string;
  hskLevel: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  titleZh: string;
  titlePinyin?: string;
  type: 'short' | 'story';
  paragraphs: { chinese: string; pinyin: string; english: string }[];
  vocabHighlights: string[];
}

// === SRS Card State (FSRS) ===
export interface SrsCardState {
  id: string;
  module: "characters" | "grammar" | "sentences";
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3; // New | Learning | Review | Relearning
  last_review?: Date;
  bestGrade?: number;
}

// === Display Settings ===
export interface DisplaySettings {
  id: "displaySettings";
  showPinyin: boolean;
  showEnglish: boolean;
}

// === Per-Page HSK Levels ===
export type PageKey = "characters" | "grammar" | "sentences" | "reading";

export interface PageLevels {
  id: "pageLevels";
  characters: HskLevel;
  grammar: HskLevel;
  sentences: HskLevel;
  reading: HskLevel;
}

// === User Settings ===
export interface UserSettings {
  id: "settings";
  currentHskLevel: 1 | 2 | 3 | 4 | 5 | 6;
  theme: "light" | "dark" | "system";
  dailyGoal: number;
  showPinyin: boolean;
}

// === Daily Stats ===
export interface DailyStats {
  date: string;
  cardsReviewed: number;
  cardsNew: number;
  correctCount: number;
  totalCount: number;
  studyTimeSeconds: number;
}

export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

// === Word Corrections (Audit Feature) ===
export interface WordCorrection {
  id: string;           // e.g. "hsk1-042"
  pinyin?: string;      // corrected pinyin (tone after letters: sheng1)
  meaning?: string;     // corrected meaning
  correctedAt: string;  // ISO timestamp
}

// === Study Timers ===
export interface StudyTimers {
  date: string;               // YYYY-MM-DD in EST (primary key)
  charactersSeconds: number;
  sentencesSeconds: number;
}
