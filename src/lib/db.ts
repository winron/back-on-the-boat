import Dexie, { type EntityTable } from "dexie";
import type { SrsCardState, UserSettings, DailyStats } from "@/types";

const db = new Dexie("hsk-master") as Dexie & {
  srsCards: EntityTable<SrsCardState, "id">;
  settings: EntityTable<UserSettings, "id">;
  dailyStats: EntityTable<DailyStats, "date">;
};

db.version(1).stores({
  srsCards: "id, module, due, state, [module+state], [module+due]",
  settings: "id",
  dailyStats: "date",
});

export { db };
