import Dexie from "dexie";
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
} from "ts-fsrs";
import { db } from "./db";
import type { SrsCardState } from "@/types";

const params = generatorParameters({ enable_fuzz: true });
const f = fsrs(params);

export { Rating };

export function createNewSrsCard(
  id: string,
  module: SrsCardState["module"]
): SrsCardState {
  const card = createEmptyCard();
  return {
    id,
    module,
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ?? undefined,
  };
}

function toFsrsCard(srs: SrsCardState): Card {
  return {
    due: new Date(srs.due),
    stability: srs.stability,
    difficulty: srs.difficulty,
    elapsed_days: srs.elapsed_days,
    scheduled_days: srs.scheduled_days,
    learning_steps: srs.learning_steps,
    reps: srs.reps,
    lapses: srs.lapses,
    state: srs.state,
    last_review: srs.last_review ? new Date(srs.last_review) : undefined,
  };
}

export function reviewCard(
  srs: SrsCardState,
  grade: Grade
): SrsCardState {
  const card = toFsrsCard(srs);
  const scheduling = f.repeat(card, new Date());
  const result = scheduling[grade];
  return {
    ...srs,
    due: result.card.due,
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    elapsed_days: result.card.elapsed_days,
    scheduled_days: result.card.scheduled_days,
    learning_steps: result.card.learning_steps,
    reps: result.card.reps,
    lapses: result.card.lapses,
    state: result.card.state,
    last_review: result.card.last_review ?? undefined,
  };
}

export async function getDueCards(
  module: SrsCardState["module"],
  limit = 20,
  idPrefix?: string
): Promise<SrsCardState[]> {
  const now = new Date();
  let cards = await db.srsCards
    .where("[module+due]")
    .between([module, Dexie.minKey], [module, now], true, true)
    .toArray();

  if (idPrefix) {
    cards = cards.filter((c) => c.id.startsWith(idPrefix));
  }

  return cards.slice(0, limit);
}

export async function getNewCards(
  module: SrsCardState["module"],
  limit = 10,
  idPrefix?: string
): Promise<SrsCardState[]> {
  let cards = await db.srsCards
    .where({ module, state: 0 })
    .toArray();

  if (idPrefix) {
    cards = cards.filter((c) => c.id.startsWith(idPrefix));
  }

  return cards.slice(0, limit);
}
