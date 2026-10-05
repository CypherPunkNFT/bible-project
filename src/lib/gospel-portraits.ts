import { PORTRAIT_GOSPELS, type PortraitGospel } from "@/data/gospel-portraits";
import { splitId } from "./refs";
import type { Harmony, HarmonySection, Span } from "./study";
import type { Stats } from "./types";

export type PortraitEvent = HarmonySection & { partTitle: string };
export const portraitEvents = (harmony: Harmony): PortraitEvent[] =>
  harmony.parts.flatMap((part) => part.sections.map((event) => ({ ...event, partTitle: part.title })));

/** Inclusive KJV verse intervals. All multi-chapter calculations use actual chapter lengths. */
export function passagePosition(span: Span, book: Stats["books"][number]) {
  const start = splitId(span[0]);
  const end = splitId(span[1]);
  const first = book.chapters.slice(0, start.chapter - 1).reduce((n, c) => n + c[0], 0) + start.verse - 1;
  const last = book.chapters.slice(0, end.chapter - 1).reduce((n, c) => n + c[0], 0) + end.verse;
  return { start: first / book.verses, end: last / book.verses, count: last - first };
}

/** Overlapping spans count each verse once. Adjacent but disjoint passages remain separate in the UI. */
export function passageVerseCount(spans: Span[], book: Stats["books"][number]) {
  const verses = new Set<number>();
  for (const span of spans) {
    const start = splitId(span[0]);
    const end = splitId(span[1]);
    for (let chapter = start.chapter; chapter <= end.chapter; chapter++) {
      const from = chapter === start.chapter ? start.verse : 1;
      const to = chapter === end.chapter ? end.verse : book.chapters[chapter - 1][0];
      for (let verse = from; verse <= to; verse++) verses.add(chapter * 1000 + verse);
    }
  }
  return verses.size;
}

export function gospelOrder(events: PortraitEvent[], key: PortraitGospel) {
  return events.filter((event) => event.refs[key]?.length).sort((a, b) =>
    Math.min(...a.refs[key]!.map((span) => span[0])) - Math.min(...b.refs[key]!.map((span) => span[0])));
}

export function matchingPortraitEvents(events: PortraitEvent[], query: string, scope: "all" | "four" | "one") {
  const search = query.trim().toLowerCase();
  return events.filter((event) => {
    const accounts = PORTRAIT_GOSPELS.filter((g) => event.refs[g.key]?.length).length;
    return accounts > 0 && (scope === "all" || accounts === (scope === "four" ? 4 : 1)) &&
      (!search || `${event.title} ${event.n} ${event.partTitle}`.toLowerCase().includes(search));
  });
}
