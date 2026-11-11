// Scripture memory: a verse's place on the way to known by heart (design §4 and §9). One step per calendar day: "I said
// it today" moves a verse on only when today is later than the day it last moved. Days are local calendar day numbers
// (calendarDay, shared with the Verse completion game), so a daylight-saving change never moves a day.
import { calendarDay } from "@/pages/games/verse-completion/boxes";
import { KNOWN } from "./fade";

export interface MemoryVerse {
  /** First and last verse ids (BBCCCVVV), one chapter. */
  from: number;
  to: number;
  /** 0–5: the steps; 6: known by heart. */
  stage: number;
  /** The day it was added. */
  added: number;
  /** The last day "I said it today" was pressed for it; 0 when never. */
  last: number;
}

/** "Today", worked out at the moment of each press, so a page left open past midnight is right. */
export const today = (): number => calendarDay(new Date());

export const verseKey = (verse: Pick<MemoryVerse, "from" | "to">): string => `${verse.from}-${verse.to}`;

export const isKnown = (verse: MemoryVerse): boolean => verse.stage >= KNOWN;
export const doneToday = (verse: MemoryVerse, day: number): boolean => verse.last >= day;

export const newVerse = (from: number, to: number, day: number): MemoryVerse => ({ from, to, stage: 0, added: day, last: 0 });

export type PractiseOutcome = "stepped" | "known" | "kept" | "already";

/** "I said it today": the next step, once per calendar day. A known verse stays known and only its day moves. */
export function practise(verse: MemoryVerse, day: number): { verse: MemoryVerse; outcome: PractiseOutcome } {
  if (doneToday(verse, day)) return { verse, outcome: "already" };
  if (isKnown(verse)) return { verse: { ...verse, last: day }, outcome: "kept" };
  const stage = verse.stage + 1;
  return { verse: { ...verse, stage, last: day }, outcome: stage >= KNOWN ? "known" : "stepped" };
}

/** One step back, any time. Its day is left as it is, so after a step back today the next step forward is tomorrow. */
export const stepBack = (verse: MemoryVerse): MemoryVerse => ({ ...verse, stage: Math.max(0, verse.stage - 1) });

export const startOver = (verse: MemoryVerse): MemoryVerse => ({ ...verse, stage: 0, last: 0 });

/** Further along: a higher step, then the later day. What import keeps when a verse is in both lists. */
export const furtherAlong = (a: MemoryVerse, b: MemoryVerse): boolean => a.stage > b.stage || (a.stage === b.stage && a.last > b.last);
