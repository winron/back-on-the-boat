import Dexie, { type EntityTable } from "dexie";
import type {
  SrsCardState,
  UserSettings,
  DailyStats,
  DisplaySettings,
  PageLevels,
} from "@/types";

const db = new Dexie("hsk-master") as Dexie & {
  srsCards: EntityTable<SrsCardState, "id">;
  settings: EntityTable<UserSettings, "id">;
  dailyStats: EntityTable<DailyStats, "date">;
  displaySettings: EntityTable<DisplaySettings, "id">;
  pageLevels: EntityTable<PageLevels, "id">;
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

export { db };
