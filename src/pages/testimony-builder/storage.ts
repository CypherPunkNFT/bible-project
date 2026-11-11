// The Testimony builder's draft in this browser, under bp-testimony-builder, and its draft files (design §4 and §9).
// Everything read, from storage or from a file, is rebuilt field by field: the known question ids are walked (never the
// record's own keys), only strings are kept, each is cut to its question's limit without splitting a surrogate pair,
// control characters other than newline and tab are removed, and a line answer loses its newlines. A record from a newer
// version of the site is shown but never written over. Nothing here sends anything anywhere.
import { localDate } from "@/pages/scripture-memory/storage";
import { QUESTIONS, isAnswered, type Question } from "./questions";

export const STORAGE_KEY = "bp-testimony-builder";
/** Which question is open, per tab: another tab's choice is never applied here. */
export const OPEN_KEY = "bp-testimony-builder-open";
export const FILE_KIND = "bible-guide-testimony-draft";
export const VERSION = 1;
export const MAX_FILE_BYTES = 1_000_000;

/** Answers by question id: only answered questions are present. */
export type Answers = Readonly<Record<string, string>>;

export interface Stored {
  answers: Answers;
  /** Written by a newer version of the site: shown, never written over. */
  newer: boolean;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

// Every C0 and C1 control character but tab (U+0009) and newline (U+000A), with carriage return handled first, and the
// bidirectional overrides and isolates (U+202A to U+202E, U+2066 to U+2069) that could reorder a printed sheet.
const range = (from: number, to: number): string => String.fromCharCode(from) + "-" + String.fromCharCode(to);
const CONTROL = new RegExp("[" + range(0, 8) + range(0xb, 0x1f) + range(0x7f, 0x9f) + range(0x202a, 0x202e) + range(0x2066, 0x2069) + "]", "g");

/** `text` cut to `limit` UTF-16 units, never ending in a lone high surrogate. */
export function cutTo(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const last = cut.charCodeAt(cut.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
}

/** One answer as it is stored: cleaned, cut to its question's limit; "" when it is not a string or holds only spaces. */
export function cleanAnswer(question: Question, value: unknown): string {
  if (typeof value !== "string") return "";
  let text = value.replace(/\r\n?/g, "\n").replace(CONTROL, "");
  if (question.kind === "line") text = text.replace(/\n+/g, " ").trim();
  text = cutTo(text, question.limit);
  return isAnswered(text) ? text : "";
}

/** The answers rebuilt from anything: known ids walked, each cleaned; unanswered ones left out. */
export function readAnswers(value: unknown): Answers {
  const answers: Record<string, string> = {};
  if (!isObject(value)) return answers;
  for (const question of QUESTIONS) {
    if (!Object.prototype.hasOwnProperty.call(value, question.id)) continue;
    const text = cleanAnswer(question, value[question.id]);
    if (text) answers[question.id] = text;
  }
  return answers;
}

export const answeredCount = (answers: Answers): number => QUESTIONS.filter((question) => isAnswered(answers[question.id])).length;

/** localStorage when this browser lets the page use it, else null: the page then works without keeping anything. */
export function browserStore(): Storage | null {
  try {
    const store = window.localStorage;
    const probe = `${STORAGE_KEY}-probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch (error) {
    console.warn("Testimony builder: this browser will not keep the draft (storage is blocked or full):", error);
    return null;
  }
}

/** The stored draft, rebuilt; an empty one when there is none or it cannot be read. */
export function readStored(store: Storage | null): Stored {
  if (!store) return { answers: {}, newer: false };
  try {
    return readRecord(store.getItem(STORAGE_KEY));
  } catch (error) {
    console.warn("Testimony builder: the saved draft could not be read, so it starts empty:", error);
    return { answers: {}, newer: false };
  }
}

/** A stored record's text (or null for none), rebuilt. Throws on text that is not JSON. */
export function readRecord(text: string | null): Stored {
  const raw: unknown = text ? JSON.parse(text) : null;
  const record = isObject(raw) ? raw : {};
  const newer = typeof record.v === "number" && record.v > VERSION;
  return { answers: readAnswers(record.answers), newer };
}

/** Saves the whole draft (this tab's answers replace what was stored); false when the browser refused. */
export function writeStored(store: Storage | null, answers: Answers): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, saved: new Date().toISOString(), answers }));
    return true;
  } catch (error) {
    console.warn("Testimony builder: the draft could not be saved (storage is full or blocked):", error);
    return false;
  }
}

export function clearStored(store: Storage | null): boolean {
  if (!store) return true;
  try {
    store.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn("Testimony builder: the draft could not be cleared:", error);
    return false;
  }
}

/** Which question this tab had open, or null; kept in sessionStorage so other tabs never move it. */
export function readOpen(): string | null {
  try {
    const id = window.sessionStorage.getItem(OPEN_KEY);
    return id && QUESTIONS.some((question) => question.id === id) ? id : null;
  } catch {
    return null;
  }
}

export function writeOpen(id: string): void {
  try {
    window.sessionStorage.setItem(OPEN_KEY, id);
  } catch {
    // A tab that will not remember which question was open still works.
  }
}

export const draftFileName = (date: Date): string => `bible-guide-testimony-draft-${localDate(date)}.json`;

/** The draft file: the answers only, under the known ids. No fixed words, nothing else. */
export const draftFileText = (answers: Answers, date: Date): string =>
  JSON.stringify({ kind: FILE_KIND, v: VERSION, saved: localDate(date), answers }, null, 2);

export type DraftRead =
  | { ok: true; answers: Answers }
  | { ok: false; reason: "too-big" | "not-draft" | "newer" };

/** A draft file's answers, rebuilt. The caller checks the file's size in bytes before reading it (MAX_FILE_BYTES). */
export function readDraftFile(text: string): DraftRead {
  if (text.length > MAX_FILE_BYTES) return { ok: false, reason: "too-big" };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    console.warn("Testimony builder: the chosen file is not JSON:", error);
    return { ok: false, reason: "not-draft" };
  }
  if (!isObject(raw) || raw.kind !== FILE_KIND || typeof raw.v !== "number" || !isObject(raw.answers)) return { ok: false, reason: "not-draft" };
  if (raw.v > VERSION) return { ok: false, reason: "newer" };
  return { ok: true, answers: readAnswers(raw.answers) };
}
