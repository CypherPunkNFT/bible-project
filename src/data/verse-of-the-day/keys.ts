// A passage's key in the verse-of-the-day schedule (docs/features/verse-widget/design.md 4.3): its own verse ids, such
// as "LAM.3.22-23" or "JHN.3.16", so a scheduled day can always be rebuilt from the Berean even after its entry leaves
// the curation file. Imports nothing through "@/", so the build script and the tests can read it.
import { BOOK_NUMBERS, type LifeEventPassage } from "../life-events/types";

const BOOK_CODES: Record<number, string> = Object.fromEntries(Object.entries(BOOK_NUMBERS).map(([code, number]) => [number, code]));
const KEY = /^([1-3]?[A-Z]{2,3})\.(\d{1,3})\.(\d{1,3})(?:-(\d{1,3}))?$/;

const split = (id: number) => ({ book: Math.floor(id / 1_000_000), chapter: Math.floor(id / 1000) % 1000, verse: id % 1000 });

/** The book code of a passage ("LAM"). */
export const bookCodeOf = (passage: LifeEventPassage): string => BOOK_CODES[split(passage.from).book];

/** "LAM.3.22-23" for Lamentations 3:22–23. A passage with an excerpt or skipped verses has no key: the schedule refuses it. */
export function passageKey(passage: LifeEventPassage): string {
  if (passage.part || passage.skip?.length) throw new Error(`verse of the day: passage ${passage.from} uses an excerpt or skipped verses, which a schedule key cannot hold`);
  const first = split(passage.from);
  const last = split(passage.to ?? passage.from);
  const code = BOOK_CODES[first.book];
  if (!code || last.book !== first.book || last.chapter !== first.chapter || last.verse < first.verse) {
    throw new Error(`verse of the day: passage ${passage.from}–${passage.to ?? passage.from} must run forward inside one chapter`);
  }
  return `${code}.${first.chapter}.${first.verse}${last.verse > first.verse ? `-${last.verse}` : ""}`;
}

/** The passage a key names, or null if it is not a key. */
export function passageFromKey(key: string): LifeEventPassage | null {
  const match = KEY.exec(key);
  const book = match ? BOOK_NUMBERS[match[1]] : undefined;
  if (!match || !book) return null;
  const base = book * 1_000_000 + Number(match[2]) * 1000;
  const passage: LifeEventPassage = { from: base + Number(match[3]), role: "card", note: "" };
  if (match[4] && Number(match[4]) > Number(match[3])) passage.to = base + Number(match[4]);
  return passage;
}

/** The reader's address for a passage, its chapter open with the verses shaded: "/read/bsb/LAM/3?hl=22-23". */
export function readPath(passage: LifeEventPassage): string {
  const first = split(passage.from);
  const last = split(passage.to ?? passage.from);
  const shaded = last.verse > first.verse ? `${first.verse}-${last.verse}` : `${first.verse}`;
  return `/read/bsb/${BOOK_CODES[first.book]}/${first.chapter}?hl=${shaded}`;
}

/** A day number for a "YYYY-MM-DD" date (1970-01-01 is 0), as the countdowns' calendar counts. */
export const dayOfKey = (date: string): number => Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) / 86_400_000;

/** The "YYYY-MM-DD" date of a day number. */
export function keyOfDay(n: number): string {
  const date = new Date(n * 86_400_000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** A modulo that is never negative, for the pool rule on dates before the schedule (design 4.4). */
export const trueMod = (value: number, length: number): number => ((value % length) + length) % length;

/** The pool position the fallback rule gives a date: carrying on from the schedule's last day, either way (design 4.4). */
export const fallbackPosition = (next: number, lastDay: number, day: number, length: number): number => trueMod(next + (day - lastDay) - 1, length);
