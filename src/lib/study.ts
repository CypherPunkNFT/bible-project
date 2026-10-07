import { DataUnavailable } from "./data";
import { lastReadPath } from "./last-read";
import { bookByNum, splitId } from "./refs";
import type { Catalog } from "./types";

/** A passage as canonical verse ids [start, end] (scripts/bible/study_refs.py). */
export type Span = [number, number];

export interface HarmonySection {
  n: string;
  title: string;
  refs: Partial<Record<"MAT" | "MRK" | "LUK" | "JHN" | "also", Span[]>>;
  items: { title: string; refs: HarmonySection["refs"] | null }[];
}
export interface Harmony {
  parts: { n: number; title: string; sections: HarmonySection[] }[];
}
export interface Miracles {
  christ: { title: string; section: string }[];
  servants: { who: string; items: { title: string; refs: Span[] }[] }[];
  evil: { title: string; refs: Span[] }[];
}
export interface Letter {
  code: string;
  author: string;
  recipients: string;
  opening: Span[];
  verses: number;
  sections: { title: string; start: number; end: number; verses: number }[];
}
/** One row of the slim People list (scripts/build-study.py people_files): enough to search and list. */
export interface PersonRow {
  id: string;
  n: string;
  o: string[];
  /** one line: the brief, else the description */
  b: string;
  c: number;
  /** period id from src/lib/people-periods.ts ('' when the source gives no era) */
  p: string;
}
/** Everything else about one person, in its own small file, loaded when the person is opened. */
export interface PersonDetail {
  s: "M" | "F" | "G" | "";
  d: string;
  e: string;
  t: string;
  b: string;
  pa: string[];
  si: string[];
  sp: string[];
  ch: string[];
  /** book number -> verses naming them */
  k: Record<string, number>;
  f: number;
  short: string;
  article: string;
  refs: number[];
}
export type Person = Omit<PersonRow, "b"> & PersonDetail;
export interface Prophet {
  id: string;
  name: string;
  kind: "writing" | "prophet" | "nt" | "false";
  book: string;
  sex: string;
  era: string;
  king: string;
  anchor: Span | null;
  brief: string;
  first: number | null;
  count: number;
}
export interface NamesOfGod {
  groups: { key: "father" | "son" | "spirit"; label: string; names: { id: string; name: string; note: string; refs: Span[] }[] }[];
}
export interface StudyIndex {
  stamp: string;
  corrections: { source: string; where: string; printed: string; corrected: string; why: string }[];
}

const cache = new Map<string, Promise<unknown>>();
let indexPromise: Promise<StudyIndex> | null = null;

async function getJson<T>(path: string, stamp: string): Promise<T> {
  const response = await fetch(`/data/study/${path}?v=${stamp}`);
  if (!response.ok) throw new DataUnavailable(`study/${path}`, `HTTP ${response.status}`);
  if (!(response.headers.get("content-type") ?? "").includes("json")) throw new DataUnavailable(`study/${path}`, "not JSON");
  return (await response.json()) as T;
}

/** The study index carries its own stamp (the study data can be rebuilt without the Bible data). */
export function loadStudyIndex(): Promise<StudyIndex> {
  if (!indexPromise) {
    indexPromise = getJson<StudyIndex>("index.json", String(Date.now()));
    indexPromise.catch(() => (indexPromise = null));
  }
  return indexPromise;
}

const SAFE = /^[a-z0-9_\-/.]+$/;

function loadStudy<T>(path: string): Promise<T> {
  if (!SAFE.test(path) || path.includes("..")) return Promise.reject(new DataUnavailable(`study/${path}`, "unsafe path"));
  let pending = cache.get(path);
  if (!pending) {
    pending = loadStudyIndex().then((index) => getJson<T>(path, index.stamp));
    pending.catch(() => cache.delete(path));
    cache.set(path, pending);
  }
  return pending as Promise<T>;
}

export const loadHarmony = () => loadStudy<Harmony>("harmony.json");
export const loadMiracles = () => loadStudy<Miracles>("miracles.json");
export const loadLetters = () => loadStudy<Letter[]>("letters.json");
export const loadPeople = () => loadStudy<PersonRow[]>("people.json");
export const loadPersonDetail = (id: string) => loadStudy<PersonDetail>(`people/${id}.json`);
export const loadProphets = () => loadStudy<Prophet[]>("prophets.json");
export const loadNames = () => loadStudy<NamesOfGod>("names.json");

/**
 * Where a study reference opens: the last-read version if it numbers like the KJV and has the book, else the KJV;
 * the passage is shaded with ?hl= (only within the start chapter).
 */
export function studyRefLink(catalog: Catalog, [start, end]: Span): string {
  const a = splitId(start);
  const b = splitId(end);
  const code = bookByNum(catalog, a.num)?.code ?? "GEN";
  const recent = lastReadPath()?.split("/")[2];
  const version = catalog.translations.find((t) => t.slug === recent && t.numbering === "english" && t.books[code]);
  const slug = version?.slug ?? "kjv";
  const last = b.num === a.num && b.chapter === a.chapter ? b.verse : 999;
  return `/read/${slug}/${code}/${a.chapter}?hl=${a.verse}-${last}`;
}

/** Shorter label inside a gospel column: "6:30–44" (the column already names the book). */
export function shortRange([start, end]: Span): string {
  const a = splitId(start);
  const b = splitId(end);
  if (start === end) return `${a.chapter}:${a.verse}`;
  if (a.chapter === b.chapter) return `${a.chapter}:${a.verse}–${b.verse}`;
  return `${a.chapter}:${a.verse}–${b.chapter}:${b.verse}`;
}

export interface HomeVerse {
  ref: string;
  span: Span;
  text: string;
}
export interface HomeData {
  hero: { word: HomeVerse; light: HomeVerse };
  thesis: HomeVerse;
  movements: (HomeVerse & { key: string; title: string; line: string })[];
}
/** The home page's verses (scripts/bible/study_home.py): ~4 KB, built from our KJV text. */
export const loadHome = () => loadStudy<HomeData>("home.json");
