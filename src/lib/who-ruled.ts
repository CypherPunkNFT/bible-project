/// <reference types="vite/client" /> // for import.meta.glob below
import type { Realm, RulerKind } from "@/data/people-pages/types";
import { ERAS, formatYears } from "@/lib/eras";

/**
 * "Who ruled when" in the reader: for each chapter, the rulers and prophets the text itself ties to it, each with its
 * reason. Generated per book by scripts/build-reader-rulers.py into src/data/who-ruled/<BOOK>.json (from the ruler pages,
 * the person records' verses and content/people/chapter-dating.json), and loaded only when that book is read.
 */
export type Span = [number, number];

export interface WhoRuler {
  name: string;
  title: string;
  kind: RulerKind;
  realm: Realm;
  sex?: "M" | "F" | "G" | "";
  /** The reign in the main dating system (BC positive, AD negative); `label` names the system. */
  dates?: { from: number; to: number; label: string; approx?: boolean };
  /** How many prophets the ruler's page lists. */
  prophets?: number;
}

/** A dating statement in Scripture's words; `why` says how far it reaches, `note` anything a reader should know. */
export interface Statement { span?: Span; quote: string; why?: string; note?: string; title?: boolean }
interface ChapterRulerRow { id: string; named?: number[]; dated?: Statement[]; title?: Statement[]; account?: Span }
interface ChapterProphetRow { id: string; named?: number[] }
export interface BookHeading { span: Span; quote: string; rulers?: string[]; prophet?: string; note?: string }
export interface BookRelated { span: Span; quote: string; rulers?: string[]; note?: string }

export interface WhoRuledBook {
  book: string;
  headings?: BookHeading[];
  none?: { prophet?: string; note?: string }[];
  related?: BookRelated[];
  chapters: Record<string, { rulers?: ChapterRulerRow[]; prophets?: ChapterProphetRow[]; statements?: Statement[] }>;
  /** Every ruler page the book's chapters use. */
  rulers: Record<string, WhoRuler>;
  /** Names of the prophets and other people without a ruler page. */
  people: Record<string, string>;
  /** People among them who have a prophet page (/people/<page id>/word). */
  words?: Record<string, string>;
}

export type Reason =
  | { kind: "dated"; span: Span; quote: string; why?: string; note?: string }
  | { kind: "title"; quote: string; note?: string }
  | { kind: "named"; verses: number[] }
  | { kind: "during"; span: Span }
  | { kind: "heading"; span: Span }
  /** The prophet a book is named for, when the book has no heading verse that names a king. */
  | { kind: "book" };

export interface WhoItem {
  id: string;
  name: string;
  /** Present when the person has a ruler page. */
  ruler?: WhoRuler;
  href: string;
  reasons: Reason[];
  /** Set in the chapter's own time (dated, a psalm title, or inside the reign's account), not only named or in the book's heading. */
  inTime: boolean;
}

export interface ChapterWho {
  rulers: WhoItem[];
  prophets: WhoItem[];
  /** Dating statements that name no ruler (Ezekiel's "sixth year"): shown with no ruler, never given one. */
  statements: Statement[];
  headings: BookHeading[];
  none: { prophet?: string; note?: string }[];
  related: BookRelated[];
  /** The era of the first ruler the chapter is set in (dated, inside their reign, or the book's heading). */
  era?: string;
}

const FILES = import.meta.glob<{ default: WhoRuledBook }>("/src/data/who-ruled/*.json");
const cache = new Map<string, Promise<WhoRuledBook | null>>();

/** This book's file, or null for a book with none (the Apocrypha). */
export function loadWhoRuled(code: string): Promise<WhoRuledBook | null> {
  const load = FILES[`/src/data/who-ruled/${code}.json`];
  if (!load) return Promise.resolve(null);
  if (!cache.has(code)) cache.set(code, load().then((m) => m.default).catch((error: unknown) => { cache.delete(code); throw error; }));
  return cache.get(code)!;
}

export const rulerPageHref = (id: string) => `/people/${id}/rule`;

function item(book: WhoRuledBook, id: string): WhoItem {
  const ruler = book.rulers[id];
  return { id, name: ruler?.name ?? book.people[id] ?? id, ruler, href: ruler ? rulerPageHref(id) : book.words?.[id] ? `/people/${book.words[id]}/word` : `/people/${id}`, reasons: [], inTime: false };
}

/** The era a reign's middle year falls in (the bands shared with the people guides). */
export function eraOf(ruler: WhoRuler | undefined): string | undefined {
  if (!ruler?.dates) return undefined;
  const year = (ruler.dates.from + ruler.dates.to) / 2;
  return ERAS.find((era) => year <= era.from && year > era.to)?.label;
}

/** "c. 729–687 BC": the reign in the main dating system. */
export const reignYears = (ruler: WhoRuler | undefined) => (ruler?.dates ? formatYears(ruler.dates.from, ruler.dates.to, ruler.dates.approx) : undefined);

/**
 * One chapter's rulers and prophets, each once with every reason that applies, in the order: dated by Scripture, named
 * in the chapter, during the reign, the book's heading. "During" is given only when the chapter does not name or date them.
 */
export function chapterWho(book: WhoRuledBook, chapter: number): ChapterWho {
  const rows = book.chapters[String(chapter)] ?? {};
  const headings = book.headings ?? [];
  const none = book.none ?? [];
  const rulers: WhoItem[] = [];
  let era: string | undefined;
  for (const row of rows.rulers ?? []) {
    const it = item(book, row.id);
    for (const d of row.dated ?? []) if (d.span) it.reasons.push({ kind: "dated", span: d.span, quote: d.quote, why: d.why, note: d.note });
    for (const t of row.title ?? []) it.reasons.push({ kind: "title", quote: t.quote, note: t.note });
    if (row.named?.length) it.reasons.push({ kind: "named", verses: row.named });
    if (row.account && !row.named?.length && !row.dated?.length) it.reasons.push({ kind: "during", span: row.account });
    it.inTime = !!(row.dated?.length || row.title?.length || row.account);
    if (!era && it.inTime) era = eraOf(it.ruler);
    rulers.push(it);
  }
  for (const heading of headings) {
    for (const id of heading.rulers ?? []) {
      const found = rulers.find((r) => r.id === id) ?? (rulers.push(item(book, id)), rulers[rulers.length - 1]);
      if (!found.reasons.some((r) => r.kind === "heading")) found.reasons.push({ kind: "heading", span: heading.span });
      era ??= eraOf(found.ruler);
    }
  }
  const prophets: WhoItem[] = [];
  for (const row of rows.prophets ?? []) {
    const it = item(book, row.id);
    if (row.named?.length) it.reasons.push({ kind: "named", verses: row.named });
    prophets.push(it);
  }
  for (const entry of [...headings, ...none]) {
    if (!entry.prophet || rulers.some((r) => r.id === entry.prophet)) continue;
    const found = prophets.find((p) => p.id === entry.prophet) ?? (prophets.push(item(book, entry.prophet)), prophets[prophets.length - 1]);
    if (found.reasons.some((r) => r.kind === "heading" || r.kind === "book")) continue;
    found.reasons.push("span" in entry ? { kind: "heading", span: (entry as BookHeading).span } : { kind: "book" });
  }
  return { rulers, prophets, statements: rows.statements ?? [], headings, none, related: book.related ?? [], era };
}

export const isEmpty = (who: ChapterWho) => !who.rulers.length && !who.prophets.length && !who.statements.length && !who.headings.length && !who.none.length;

/** "1, 13–15, 17": verse numbers with runs joined. */
export function verseRuns(verses: number[]): [number, number][] {
  const runs: [number, number][] = [];
  for (const v of [...verses].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && v === last[1] + 1) last[1] = v;
    else if (!last || v > last[1]) runs.push([v, v]);
  }
  return runs;
}

/** "his reign", "her time as judge", "his rule": the words for a ruler's account in the reason line. */
export function reignWords(ruler: WhoRuler | undefined): string {
  const their = ruler?.sex === "F" ? "her" : ruler?.sex === "G" ? "their" : "his";
  switch (ruler?.kind) {
    case "judge": return `${their} time as judge`;
    case "leader": return `${their} time as leader`;
    case "governor": return `${their} governorship`;
    case "herod":
    case "roman": return `${their} rule`;
    default: return `${their} reign`;
  }
}
