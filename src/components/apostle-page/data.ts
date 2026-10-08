/// <reference types="vite/client" /> // for import.meta.glob below
import { useEffect, useState } from "react";
import booksJson from "@/data/apostle-pages/books.json";
import indexJson from "@/data/apostle-pages/index.json";
import type { Landing } from "./art/landing/shared";
import type { Apostle, ApostleView, Ref } from "./types";

/**
 * The apostle pages' data: one JSON file per apostle (src/data/apostle-pages/, built by scripts/build-apostle-pages.py),
 * each its own chunk loaded when the page opens and kept, so switching apostle is instant; and the landing drawing,
 * one module per apostle. Plus the small helpers every section shares (references, evidence labels, tones).
 */
const FILES = import.meta.glob<{ default: ApostleView }>(["/src/data/apostle-pages/*.json", "!/src/data/apostle-pages/index.json", "!/src/data/apostle-pages/books.json"]);
const LANDINGS: Record<string, () => Promise<{ draw: Landing }>> = {
  peter: () => import("./art/landing/peter"), andrew: () => import("./art/landing/andrew"), jamesz: () => import("./art/landing/jamesz"),
  johnz: () => import("./art/landing/johnz"), philip: () => import("./art/landing/philip"), bartholomew: () => import("./art/landing/bartholomew"),
  thomas: () => import("./art/landing/thomas"), matthew: () => import("./art/landing/matthew"), jamesa: () => import("./art/landing/jamesa"),
  thaddaeus: () => import("./art/landing/thaddaeus"), simonz: () => import("./art/landing/simonz"), iscariot: () => import("./art/landing/iscariot"),
  matthias: () => import("./art/landing/matthias"), paul: () => import("./art/landing/paul"),
};

/** The Twelve in the order of Matthew 10:2–4, then Matthias and Paul. */
export const WHO: { key: string; id: string; name: string; short: string }[] = indexJson;
const whoById = new Map(WHO.map((w) => [w.id, w]));
export const isApostlePage = (id: string) => whoById.has(id);

interface Loaded { apostle: Apostle; draw: Landing }
const loaded = new Map<string, Loaded>();
const pending = new Map<string, Promise<Loaded>>();

function prepare(d: ApostleView): Apostle {
  return {
    ...d,
    byKey: Object.fromEntries(d.entries.map((e) => [e.key, e])),
    rowByKey: Object.fromEntries(d.rows.map((r) => [r.key, r])),
    scripture: d.entries.filter((e) => e.type !== "trad"),
    trad: d.entries.filter((e) => e.type === "trad"),
    citeById: Object.fromEntries(d.citations.map((c) => [c.id, c])),
  };
}

/** An apostle's data and drawing, loaded once. */
export function loadApostle(id: string): Promise<Loaded> {
  const done = loaded.get(id);
  if (done) return Promise.resolve(done);
  let promise = pending.get(id);
  if (!promise) {
    const who = whoById.get(id), file = FILES[`/src/data/apostle-pages/${id}.json`];
    if (!who || !file) return Promise.reject(new Error(`apostle page: no data file for ${id} (expected src/data/apostle-pages/${id}.json)`));
    promise = Promise.all([file(), LANDINGS[who.key]()]).then(([data, art]) => {
      const value = { apostle: prepare(data.default), draw: art.draw };
      loaded.set(id, value);
      return value;
    });
    promise.catch((error: unknown) => { console.error(`apostle page: could not load ${id}`, error); pending.delete(id); });
    pending.set(id, promise);
  }
  return promise;
}

export type ApostleState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; value: Loaded };

/** The page's data; read straight from the cache when it is already loaded, so a page wipe never shows a loading frame. */
export function useApostleData(id: string): ApostleState {
  const [state, setState] = useState<{ id: string; value: ApostleState }>({ id, value: { status: "loading" } });
  useEffect(() => {
    if (loaded.has(id)) return;
    let live = true;
    loadApostle(id).then((value) => { if (live) setState({ id, value: { status: "ready", value } }); })
      .catch((error: unknown) => { if (live) setState({ id, value: { status: "error", message: error instanceof Error ? error.message : String(error) } }); });
    return () => { live = false; };
  }, [id]);
  const ready = loaded.get(id);
  if (ready) return { status: "ready", value: ready };
  return state.id === id ? state.value : { status: "loading" };
}

/** Loads every other apostle in the background, so the counter's arrows and list switch at once. */
export function preloadOthers(id: string) {
  for (const w of WHO) if (w.id !== id) loadApostle(w.id).catch(() => undefined);
}

// ── References ──
const BOOKS = new Map((booksJson as [number, string, string][]).map(([num, code, name]) => [num, { code, name }]));
export const chapterOf = (id: number) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
export const bookName = (num: number) => BOOKS.get(num)?.name ?? `Book ${num}`;
export const bookCode = (num: number) => BOOKS.get(num)?.code ?? "";
export function refText([a, b = a]: Ref): string {
  const x = chapterOf(a), y = chapterOf(b), name = bookName(x.book);
  if (a === b) return `${name} ${x.ch}:${x.v}`;
  if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${bookName(y.book)} ${y.ch}:${y.v}`;
  return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
}
export const refHref = ([a]: Ref) => { const x = chapterOf(a); return `/read/kjv/${bookCode(x.book)}/${x.ch}?v=${x.v}`; };
export const personHref = (id: string) => `/people/${id}`;

// ── Evidence labels, tones, small words ──
export const LAYER: Record<string, string> = { scripture: "Scripture", text: "From the text", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars", "ancient-record": "Ancient record", letters: "Views on the Letters pages" };
export const ROMAN = ["", "I", "II", "III", "IV"];
export const PERIOD_TONE = ["", "var(--history)", "var(--gospels)", "var(--acts)", "var(--muted)"];
export const BOOK_TONE = (num: number) => (num === 40 ? "var(--history)" : num === 41 ? "var(--poetry)" : num === 42 ? "var(--prophets)" : num === 43 ? "var(--gospels)" : num === 44 ? "var(--acts)" : num >= 45 && num < 66 ? "var(--epistles)" : "var(--revelation)");
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const REDUCED = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** "about AD 95–96" → "c. 95"; "4th century" → "4th c.". */
export function whenShort(when = ""): string {
  if (/(\d)(st|nd|rd|th) century/.test(when)) { const c = when.match(/(\w+ )?(\d)(st|nd|rd|th) century/)!; return `${c[1] && /early|late/i.test(c[1]) ? c[1].trim() + " " : ""}${c[2]}${c[3]} c.`; }
  const ad = when.match(/(about|not later than|c\.)?\s*AD\s*(\d{2,4})/i);
  if (ad) return `${/not later/i.test(ad[1] ?? "") ? "by " : ad[1] ? "c. " : ""}${ad[2]}`;
  const m = when.match(/(about|c\.)?\s*(\d{3,4})/i);
  return m ? `${m[1] ? "c. " : ""}${m[2]}` : "date unknown";
}

/** His names inside a verse, as runs of text, each marked or not (other men who share a name are left unmarked). */
const OTHERS = "(?![ ,]+(?:Iscariot|Zelotes|the Canaanite|a tanner|the tanner|the leper|of Cyrene|the sorcerer|which also betrayed|the brother of James|not Iscariot))";
export function markRuns(text: string, names: string[]): { t: string; mark: boolean }[] {
  const re = new RegExp(`\\b(${names.map((n) => n.replace(/[-]/g, "\\-")).join("|")})\\b${OTHERS}`, "g");
  const out: { t: string; mark: boolean }[] = [];
  let at = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > at) out.push({ t: text.slice(at, m.index), mark: false });
    out.push({ t: m[0], mark: true });
    at = m.index! + m[0].length;
  }
  if (at < text.length) out.push({ t: text.slice(at), mark: false });
  return out;
}

/** The section at the top of the window and how far into it (to keep the reader's place when switching apostle). */
export interface ReadingPlace { sec: string; off: number; at: number }
export const headerHeight = () => document.querySelector("body > #root header, header.sticky")?.getBoundingClientRect().height ?? 61;
export function readingPlace(): ReadingPlace | null {
  const line = headerHeight() + 20;
  const secs = [...document.querySelectorAll<HTMLElement>(".ap-page [data-sec]")];
  const s = secs.filter((x) => x.getBoundingClientRect().top <= line).pop();
  return s ? { sec: s.dataset.sec!, off: line - s.getBoundingClientRect().top, at: Date.now() } : null;
}
