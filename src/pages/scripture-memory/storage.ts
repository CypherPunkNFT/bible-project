// Scripture memory: the list kept in this browser under bp-scripture-memory, and its export and import files (design §5
// and §9). Everything read, from storage or from a file, is rebuilt field by field: unknown fields are dropped, numbers
// must be whole and in range, days later than today are pulled back to today, and no key from a file is ever copied
// into an object. Nothing here sends anything anywhere.
import { furtherAlong, verseKey, type MemoryVerse } from "./progress";
import { KNOWN } from "./fade";

export const STORAGE_KEY = "bp-scripture-memory";
export const FILE_KIND = "bible-guide-scripture-memory";
export const VERSION = 1;
export const MAX_LIST = 500;
export const MAX_FILE_BYTES = 1_000_000;
/** The earliest day number accepted (2022-01-08): anything earlier is not a day this tool wrote. */
export const FIRST_DAY = 19_000;

/** Checks a passage's ids against the catalogue (verse.ts passageAllowed). */
export type PassageCheck = (from: unknown, to: unknown) => boolean;

export interface Stored {
  verses: MemoryVerse[];
  /** Written by a newer version of the site: shown, never written over. */
  newer: boolean;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const wholeIn = (value: unknown, low: number, high: number): number | null =>
  Number.isSafeInteger(value) && (value as number) >= low && (value as number) <= high ? (value as number) : null;
/** A stored day: whole, not before FIRST_DAY, and never later than today. */
const dayOf = (value: unknown, day: number): number | null => (Number.isSafeInteger(value) && (value as number) >= FIRST_DAY ? Math.min(value as number, day) : null);

/** One entry, rebuilt; null when it cannot be read. */
export function readVerse(value: unknown, check: PassageCheck, day: number): MemoryVerse | null {
  if (!isObject(value) || !check(value.from, value.to)) return null;
  const stage = wholeIn(value.stage, 0, KNOWN);
  if (stage === null) return null;
  return { from: value.from as number, to: value.to as number, stage, added: dayOf(value.added, day) ?? day, last: value.last === 0 ? 0 : dayOf(value.last, day) ?? 0 };
}

/** Entries rebuilt, at most `limit` read, each passage once (its further-along copy, in the place it first appeared). */
export function readVerses(value: unknown, check: PassageCheck, day: number, limit = MAX_LIST): { verses: MemoryVerse[]; skipped: number } {
  const raw = Array.isArray(value) ? value.slice(0, limit) : [];
  const verses: MemoryVerse[] = [];
  const at = new Map<string, number>();
  let skipped = 0;
  for (const entry of raw) {
    const verse = readVerse(entry, check, day);
    if (!verse) { skipped++; continue; }
    const key = verseKey(verse);
    const seen = at.get(key);
    if (seen === undefined) { at.set(key, verses.length); verses.push(verse); }
    else if (furtherAlong(verse, verses[seen])) verses[seen] = verse;
  }
  return { verses, skipped };
}

/** localStorage when this browser lets the page use it, else null: the page then works without keeping anything. */
export function browserStore(): Storage | null {
  try {
    const store = window.localStorage;
    const probe = `${STORAGE_KEY}-probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch (error) {
    console.warn("Scripture memory: this browser will not keep the list (storage is blocked or full):", error);
    return null;
  }
}

export function readStored(store: Storage | null, check: PassageCheck, day: number): Stored {
  if (!store) return { verses: [], newer: false };
  try {
    const text = store.getItem(STORAGE_KEY);
    const raw: unknown = text ? JSON.parse(text) : null;
    const record = isObject(raw) ? raw : {};
    const newer = typeof record.v === "number" && record.v > VERSION;
    const { verses, skipped } = readVerses(record.verses, check, day);
    if (skipped) console.warn(`Scripture memory: ${skipped} saved entries could not be read and were left out`);
    return { verses, newer };
  } catch (error) {
    console.warn("Scripture memory: the saved list could not be read, so it starts empty:", error);
    return { verses: [], newer: false };
  }
}

/** Saves the list; false when the browser refused (storage full or blocked), so the page can say so. */
export function writeStored(store: Storage | null, verses: readonly MemoryVerse[]): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, verses }));
    return true;
  } catch (error) {
    console.warn("Scripture memory: the list could not be saved (storage is full or blocked):", error);
    return false;
  }
}

export function clearStored(store: Storage | null): boolean {
  if (!store) return true;
  try {
    store.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn("Scripture memory: the list could not be cleared:", error);
    return false;
  }
}

/** "2026-11-09" for a local date: the export's date and its file name. */
export function localDate(date: Date): string {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

export const exportName = (date: Date): string => `bible-guide-memory-verses-${localDate(date)}.json`;

/** The export file: the date, and each verse's ids, step and the days it was added and last practised. No verse text,
 * no name, nothing else. */
export const exportText = (verses: readonly MemoryVerse[], date: Date): string =>
  JSON.stringify({ kind: FILE_KIND, v: VERSION, exported: localDate(date), verses: verses.map(({ from, to, stage, added, last }) => ({ from, to, stage, added, last })) }, null, 2);

export type ImportRead =
  | { ok: true; verses: MemoryVerse[]; skipped: number }
  | { ok: false; reason: "too-big" | "not-export" | "newer" };

/** An export file's verses, rebuilt. The caller checks the file's size before reading it (MAX_FILE_BYTES). */
export function readImport(text: string, check: PassageCheck, day: number): ImportRead {
  if (text.length > MAX_FILE_BYTES) return { ok: false, reason: "too-big" };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    console.warn("Scripture memory: the chosen file is not JSON:", error);
    return { ok: false, reason: "not-export" };
  }
  if (!isObject(raw) || raw.kind !== FILE_KIND || !Array.isArray(raw.verses) || typeof raw.v !== "number") return { ok: false, reason: "not-export" };
  if (raw.v > VERSION) return { ok: false, reason: "newer" };
  const total = raw.verses.length;
  const read = readVerses(raw.verses, check, day);
  return { ok: true, verses: read.verses, skipped: read.skipped + Math.max(0, total - MAX_LIST) };
}

export interface Merged { verses: MemoryVerse[]; added: number; updated: number; same: number; full: number }

/** The imported verses merged into the list: a new verse is added at the end, one in both keeps the copy further along,
 * and the list never grows past MAX_LIST. */
export function mergeVerses(current: readonly MemoryVerse[], incoming: readonly MemoryVerse[]): Merged {
  const verses = [...current];
  const at = new Map(verses.map((verse, i) => [verseKey(verse), i]));
  const merged: Merged = { verses, added: 0, updated: 0, same: 0, full: 0 };
  for (const verse of incoming) {
    const i = at.get(verseKey(verse));
    if (i !== undefined) {
      if (furtherAlong(verse, verses[i])) { verses[i] = verse; merged.updated++; } else merged.same++;
    } else if (verses.length >= MAX_LIST) merged.full++;
    else { at.set(verseKey(verse), verses.length); verses.push(verse); merged.added++; }
  }
  return merged;
}
