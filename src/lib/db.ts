import Dexie, { type EntityTable } from "dexie";
import type {
  SrsCardState,
  UserSettings,
  DailyStats,
  DisplaySettings,
  PageLevels,
  WordCorrection,
  StudyTimers,
} from "@/types";

const db = new Dexie("hsk-master") as Dexie & {
  srsCards: EntityTable<SrsCardState, "id">;
  settings: EntityTable<UserSettings, "id">;
  dailyStats: EntityTable<DailyStats, "date">;
  displaySettings: EntityTable<DisplaySettings, "id">;
  pageLevels: EntityTable<PageLevels, "id">;
  wordCorrections: EntityTable<WordCorrection, "id">;
  studyTimers: EntityTable<StudyTimers, "date">;
};

db.version(1).stores({
  srsCards: "id, module, due, state, [module+state], [module+due]",
  settings: "id",
  dailyStats: "date",
});

db.version(2).stores({
  srsCards: "id, module, due, state, [module+state], [module+due]",
  settings: "id",
  dailyStats: "date",
  displaySettings: "id",
  pageLevels: "id",
});

db.version(3).stores({
  srsCards: "id, module, due, state, [module+state], [module+due]",
  settings: "id",
  dailyStats: "date",
  displaySettings: "id",
  pageLevels: "id",
  wordCorrections: "id",
  studyTimers: "date",
});

export { db };
