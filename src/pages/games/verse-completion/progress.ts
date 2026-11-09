// Verse completion: every change a round makes to the stored record, as pure functions over it (design §8, §9). The
// page re-reads the stored record, applies one of these and writes it back, so each answer changes only its own part.
import { addToMyVerses, afterAnswer, countDay, freshProgress, removeFromMyVerses, type BoxChange } from "./boxes.ts";
import { answerStyle, type Settings } from "./model.ts";
import { withRecent, type Done, type Round, type VerseRecord } from "./storage.ts";

export interface NewRound { id: string; seed: number; review: boolean; settings: Settings; ids: string[]; stamp: string; owner: string }

/** A dealt round, saved before its first card shows. Ordinary rounds join the recent list; reviews do not. */
export function startRound(record: VerseRecord, round: NewRound): VerseRecord {
  const saved: Round = { pool: round.stamp, seed: round.seed, id: round.id, review: round.review, settings: round.settings,
    ids: round.ids, done: [], finished: false, owner: round.owner };
  return { ...record, settings: round.review ? record.settings : round.settings, round: saved,
    recent: round.review ? record.recent : withRecent(record.recent, round.ids) };
}

/** Why a card could not be saved: another round replaced it, the card was already saved, or another tab owns it. */
export type Refusal = "gone" | "repeat" | "elsewhere";

export interface CardOutcome { record: VerseRecord; change: BoxChange | null }

/**
 * One answered or skipped card, saved once per round and card index together with its passage's progress and the
 * totals. A skip (a verse that would not load) is recorded on the round only, never against the passage (§10.7).
 */
export function commitCard(record: VerseRecord, roundId: string, index: number, owner: string, done: Done, today: number): CardOutcome | Refusal {
  const round = record.round;
  if (!round || round.id !== roundId || round.finished) return "gone";
  if (round.owner !== owner) return "elsewhere";
  if (round.done.length !== index || round.ids[index] !== done.id) return "repeat";
  const next: VerseRecord = { ...record, round: { ...round, done: [...round.done, done] } };
  if (done.status === "skipped") return { record: next, change: null };
  const hard = round.review || round.settings.level === "hard";
  const { progress, change } = afterAnswer(record.passages[done.id] ?? freshProgress(),
    { accuracy: done.accuracy, style: answerStyle(round.settings), hard, today });
  next.passages = { ...record.passages, [done.id]: progress };
  next.totals = { ...record.totals, cards: record.totals.cards + 1, stars: record.totals.stars + done.stars };
  return { record: next, change };
}

/** The round's end: counted once, however often the summary is opened. An all-skipped round earns no streak day. */
export function finishRound(record: VerseRecord, roundId: string, today: number): VerseRecord {
  const round = record.round;
  if (!round || round.id !== roundId || round.finished) return record;
  const answered = round.done.some((done) => done.status === "answered");
  return { ...record, round: { ...round, finished: true }, totals: { ...record.totals, rounds: record.totals.rounds + 1 },
    days: answered ? countDay(record.days, today) : record.days };
}

/** Leave a round: the answered cards' stars are already in the totals; the round is dropped. */
export const leaveRound = (record: VerseRecord): VerseRecord => ({ ...record, round: null });

/** This tab answers the round from now on; the other tab sees that and stops (§9). */
export const takeOver = (record: VerseRecord, owner: string): VerseRecord => (record.round ? { ...record, round: { ...record.round, owner } } : record);

export const addPassage = (record: VerseRecord, id: string, today: number): VerseRecord =>
  ({ ...record, passages: { ...record.passages, [id]: addToMyVerses(record.passages[id] ?? freshProgress(), today) } });

export const removePassage = (record: VerseRecord, id: string): VerseRecord =>
  (record.passages[id] ? { ...record, passages: { ...record.passages, [id]: removeFromMyVerses(record.passages[id]) } } : record);

/** Passages answered in the round with fewer than three stars, for "Add all missed to My verses". */
export const missedIn = (round: Round): string[] => round.done.filter((done) => done.status === "answered" && done.stars < 3).map((done) => done.id);
