// Verse completion: My verses' five review boxes and the day streak (design §8.2, §8.4). Days are local calendar day
// numbers (calendarDay below), so a daylight-saving change never moves a due date.
import type { AnswerStyle } from "./model.ts";

/** A local date's place on the calendar, as a whole number of days (the same rule as Map quest's daily.ts). */
export const calendarDay = (date: Date): number => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;

export interface Progress {
  played: number;
  /** Best accuracy, 0–100. */
  best: number;
  last: number;
  /** 0: not in My verses. */
  box: 0 | 1 | 2 | 3 | 4 | 5;
  due: number;
  memorised: boolean;
}

export const freshProgress = (): Progress => ({ played: 0, best: 0, last: 0, box: 0, due: 0, memorised: false });

export const GAP_DAYS: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
export const MEMORISED_GAP = 60;
/** The highest box each answer style can lift a passage to (§8.2). */
export const CEILING: Record<AnswerStyle, 2 | 4 | 5> = { pick: 2, letters: 4, words: 5 };

export const PASS = 90;
export const PARTLY = 70;

/** What an answer did to a passage in My verses, for the result line ("Up to box 3: back in 7 days"). */
export type BoxChange =
  | { kind: "up"; box: number; days: number }
  | { kind: "memorised"; days: number }
  | { kind: "renewed"; days: number }
  | { kind: "stay"; box: number; days: number }
  | { kind: "reset" }
  | { kind: "early" }
  | { kind: "not-hard" }
  | { kind: "ceiling"; style: AnswerStyle };

export interface Answered { accuracy: number; style: AnswerStyle; hard: boolean; today: number }

export const isDue = (progress: Progress, today: number): boolean => progress.box > 0 && progress.due <= today;

/** A newly added passage: box 1, due tomorrow, since it has just been practised (§8.1). Already added: unchanged. */
export const addToMyVerses = (progress: Progress, today: number): Progress =>
  progress.box > 0 ? progress : { ...progress, box: 1, due: today + 1, memorised: false };

export const removeFromMyVerses = (progress: Progress): Progress => ({ ...progress, box: 0, due: 0, memorised: false });

/** A pass (90% or more). Only a due Hard answer can move a box, and only up to the style's ceiling. */
function passed(progress: Progress, answer: Answered): { progress: Progress; change: BoxChange } {
  if (!answer.hard) return { progress, change: { kind: "not-hard" } };
  if (progress.due > answer.today) return { progress, change: { kind: "early" } };
  if (progress.box === 5 && answer.style === "words") {
    const change: BoxChange = progress.memorised ? { kind: "renewed", days: MEMORISED_GAP } : { kind: "memorised", days: MEMORISED_GAP };
    return { progress: { ...progress, memorised: true, due: answer.today + MEMORISED_GAP }, change };
  }
  if (progress.box >= CEILING[answer.style]) return { progress, change: { kind: "ceiling", style: answer.style } };
  const box = (progress.box + 1) as Progress["box"];
  const days = GAP_DAYS[box as 1 | 2 | 3 | 4 | 5];
  return { progress: { ...progress, box, due: answer.today + days }, change: { kind: "up", box, days } };
}

/** A passage answered in a round or review (§8.2). Outside My verses only the play record changes. */
export function afterAnswer(before: Progress, answer: Answered): { progress: Progress; change: BoxChange | null } {
  const progress: Progress = { ...before, played: before.played + 1, best: Math.max(before.best, Math.round(answer.accuracy)), last: answer.today };
  if (progress.box === 0) return { progress, change: null };
  if (answer.accuracy >= PASS) return passed(progress, answer);
  if (answer.accuracy >= PARTLY) {
    const days = GAP_DAYS[progress.box as 1 | 2 | 3 | 4 | 5];
    // Partly right: same box, back after its gap from today; any Memorised badge is lost (box 5 then uses 30 days).
    return { progress: { ...progress, memorised: false, due: answer.today + days }, change: { kind: "stay", box: progress.box, days } };
  }
  return { progress: { ...progress, box: 1, due: answer.today + 1, memorised: false }, change: { kind: "reset" } };
}

export interface Days { streak: number; best: number; last: number }

/** A finished round or review on `today`: the day after the last adds one, a gap starts again at 1 (§8.4). */
export function countDay(days: Days, today: number): Days {
  if (days.last === today) return days;
  const streak = days.last === today - 1 ? days.streak + 1 : 1;
  return { streak, best: Math.max(days.best, streak), last: today };
}

/** The streak to show: 0 once a whole day has been missed; today does not break it until today is over. */
export const shownStreak = (days: Days, today: number): number => (days.last >= today - 1 ? days.streak : 0);
