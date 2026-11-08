// Timeline sort build: the checks that look at the whole pool at once (design §4.6, checks 5 and 7–9) and the
// whole-pool order (`rank`, §5.1). Nothing here writes.
import fs from "node:fs";
import path from "node:path";
import { deal, LEVEL_KEYS, type EraChoice, type Level } from "../../src/pages/games/timeline/deal.ts";
import { mulberry32 } from "../../src/pages/games/timeline/daily-rules.ts";
import { ERA_KEYS, validRound, windowGap, type OrderFact, type OrderIndex, type TimelineEvent } from "../../src/pages/games/timeline/order.ts";
import { SITE, parseCsv } from "../whos-older/site-data.ts";

type Draft = Omit<TimelineEvent, "rank">;

/** Every direct "before" edge, ignoring the contested list: facts as written, and windows that share no year. */
function edges(events: readonly Draft[], facts: readonly OrderFact[]): Map<string, Set<string>> {
  const out = new Map(events.map((event) => [event.id, new Set<string>()]));
  for (const fact of facts) out.get(fact.first)?.add(fact.second);
  for (const a of events) for (const b of events) if (a.id !== b.id && windowGap({ ...a, rank: 0 }, { ...b, rank: 0 }) !== null) out.get(a.id)!.add(b.id);
  return out;
}

const midpoint = (event: Draft) => (event.lo !== null && event.hi !== null ? (event.lo + event.hi) / 2 : event.lo ?? event.hi ?? 0);

/** One loop among `ids` (A before B before … before A), for the error message. */
function findLoop(ids: readonly string[], next: Map<string, Set<string>>): string[] {
  const inside = new Set(ids);
  const state = new Map<string, "open" | "done">();
  const trail: string[] = [];
  const visit = (id: string): string[] | null => {
    state.set(id, "open");
    trail.push(id);
    for (const to of next.get(id) ?? []) {
      if (!inside.has(to)) continue;
      if (state.get(to) === "open") return [...trail.slice(trail.indexOf(to)), to];
      if (!state.has(to)) { const loop = visit(to); if (loop) return loop; }
    }
    trail.pop();
    state.set(id, "done");
    return null;
  };
  for (const id of ids) if (!state.has(id)) { const loop = visit(id); if (loop) return loop; }
  return [...ids];
}

/**
 * The whole-pool order: a topological sort of every window and fact, ties broken by window midpoint and then id, so it
 * agrees with every certain order (§5.1). Returns the loop instead when windows and facts contradict each other.
 */
export function rankEvents(events: readonly Draft[], facts: readonly OrderFact[]): { order: string[] } | { loop: string[] } {
  const next = edges(events, facts);
  const byId = new Map(events.map((event) => [event.id, event]));
  const incoming = new Map(events.map((event) => [event.id, 0]));
  for (const targets of next.values()) for (const to of targets) incoming.set(to, incoming.get(to)! + 1);
  const ready = events.filter((event) => incoming.get(event.id) === 0).map((event) => event.id);
  const before = (a: string, b: string) => midpoint(byId.get(a)!) - midpoint(byId.get(b)!) || (a < b ? -1 : 1);
  const order: string[] = [];
  while (ready.length) {
    ready.sort(before);
    const id = ready.shift()!;
    order.push(id);
    for (const to of next.get(id)!) {
      incoming.set(to, incoming.get(to)! - 1);
      if (incoming.get(to) === 0) ready.push(to);
    }
  }
  if (order.length === events.length) return { order };
  return { loop: findLoop(events.filter((event) => incoming.get(event.id)! > 0).map((event) => event.id), next) };
}

/** Contested pairs that the full chain of windows and facts would make certain anyway (check 5): each a fatal error. */
export function settledContested(events: readonly Draft[], facts: readonly OrderFact[], contested: readonly (readonly [string, string])[]): string[] {
  const next = edges(events, facts);
  const reaches = (from: string, to: string) => {
    const seen = new Set([from]);
    const queue = [from];
    while (queue.length) {
      for (const id of next.get(queue.shift()!) ?? []) {
        if (id === to) return true;
        if (!seen.has(id)) { seen.add(id); queue.push(id); }
      }
    }
    return false;
  };
  return contested.filter(([a, b]) => reaches(a, b) || reaches(b, a)).map(([a, b]) => `${a} / ${b}`);
}

/** Different Practice rounds a level and era can deal, counted up to `enough` from a fixed seed (check 9). */
export function countRounds(index: OrderIndex, level: Level, era: EraChoice, enough: number, seed = 1): { count: number; widened: boolean } {
  const random = mulberry32(seed);
  const seen = new Set<string>();
  let widened = false;
  for (let attempt = 0; attempt < enough * 6 && seen.size < enough; attempt++) {
    const round = deal(index, level, era, random);
    if (!round) break;
    widened ||= round.widened;
    seen.add([...round.dealt].sort().join("|"));
  }
  return { count: seen.size, widened };
}

/** Every level and era pack that cannot deal `enough` different rounds (check 9). */
export function thinPacks(index: OrderIndex, enough: number): string[] {
  const out: string[] = [];
  for (const level of LEVEL_KEYS) {
    for (const era of ["all", ...ERA_KEYS] as EraChoice[]) {
      const { count } = countRounds(index, level, era, enough);
      if (count < enough) out.push(`${level} / ${era}: only ${count} different rounds (at least ${enough} needed)`);
    }
  }
  return out;
}

/** How many different valid rounds of `cards` events contain `event`, counted up to `enough` (check 9). */
export function roundsWith(index: OrderIndex, event: TimelineEvent, cards: number, enough: number): number {
  const random = mulberry32(event.rank + 7);
  const seen = new Set<string>();
  for (let attempt = 0; attempt < enough * 4 && seen.size < enough; attempt++) {
    const chosen = [event.id];
    const order = [...index.active].sort(() => random() - 0.5);
    while (chosen.length < cards) {
      const next = order.find((other) => !chosen.includes(other.id) && validRound(index, [...chosen, other.id]));
      if (!next) break;
      chosen.push(next.id);
    }
    if (chosen.length === cards) seen.add([...chosen].sort().join("|"));
  }
  return seen.size;
}

// ---- Cross-checks against outside sources: warnings, never fatal (checks 7 and 8) ----

const THEOGRAPHIC = path.join(SITE, "..", "sources", "theographic", "theographic-bible-metadata-master", "CSV");

/** Theographic's start year for each event whose first verse it dates (lifetimes left out), or null without the copy. */
export function theographicYears(events: readonly { id: string; refs: [number, number][] }[]): Map<string, { year: number; title: string }> | null {
  const eventsFile = path.join(THEOGRAPHIC, "Events.csv");
  const booksFile = path.join(THEOGRAPHIC, "Books.csv");
  if (!fs.existsSync(eventsFile) || !fs.existsSync(booksFile)) return null;
  const read = (file: string) => parseCsv(fs.readFileSync(file, "utf8").trimStart()); // trimStart also drops the byte-order mark
  const [bookHeader, ...bookRows] = read(booksFile);
  const osisAt = bookHeader.indexOf("osisName");
  const orderAt = bookHeader.indexOf("bookOrder");
  const bookNumber = new Map(bookRows.filter((row) => row[osisAt]).map((row) => [row[osisAt], Number(row[orderAt])]));
  const [header, ...rows] = read(eventsFile);
  const [titleAt, startAt, versesAt] = ["title", "startDate", "verses"].map((name) => header.indexOf(name));
  if (titleAt < 0 || startAt < 0 || versesAt < 0) throw new Error(`${eventsFile}: expected title, startDate and verses columns, got ${header.join(", ")}`);
  const byVerse = new Map<number, { year: number; title: string; size: number }>();
  for (const row of rows) {
    const year = Number(row[startAt]);
    if (!row[startAt] || !Number.isFinite(year) || /^lifetime of/i.test(row[titleAt])) continue;
    const verses = row[versesAt].split(",").map((ref) => ref.trim().split(".")).filter((parts) => parts.length === 3 && bookNumber.has(parts[0]))
      .map(([book, chapter, verse]) => bookNumber.get(book)! * 1_000_000 + Number(chapter) * 1000 + Number(verse));
    for (const verse of verses) {
      const known = byVerse.get(verse);
      if (!known || verses.length < known.size) byVerse.set(verse, { year: Math.round(year), title: row[titleAt], size: verses.length });
    }
  }
  const out = new Map<string, { year: number; title: string }>();
  for (const event of events) {
    const [start, end] = event.refs[0];
    for (let verse = start; verse <= end; verse++) {
      const found = byVerse.get(verse);
      if (found) { out.set(event.id, { year: found.year, title: found.title }); break; }
    }
  }
  return out;
}

/** For each verse in Robertson's harmony, the position of its section (0 = first); null without the file. */
export function harmonySections(): Map<number, number> | null {
  const file = path.join(SITE, "data", "study", "harmony.json");
  if (!fs.existsSync(file)) return null;
  const harmony = JSON.parse(fs.readFileSync(file, "utf8")) as { parts: { sections: { refs: Record<string, [number, number][]> }[] }[] };
  const at = new Map<number, number>();
  let position = 0;
  for (const part of harmony.parts) {
    for (const section of part.sections) {
      for (const spans of Object.values(section.refs)) for (const [start, end] of spans) for (let verse = start; verse <= end; verse++) if (!at.has(verse)) at.set(verse, position);
      position++;
    }
  }
  return at;
}
