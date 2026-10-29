// The site's studies that touch one chapter, from the study data's own verse references (verse codes are
// book × 1,000,000 + chapter × 1,000 + verse, books numbered 1–66 in canon order).
import { PARABLES, PARABLE_GUIDE_URL } from "@/data/parables";
import type { Harmony, Letter, Miracles, NamesOfGod, Prophet, Span } from "@/lib/study";

export interface StudyData { harmony: Harmony; miracles: Miracles; names: NamesOfGod; letters: Letter[]; prophets: Prophet[] }
export interface StudyLink { title: string; href: string; note?: string }
export interface StudyGroup { kind: string; links: StudyLink[] }

const LETTER_PAGE: Record<string, string> = { HEB: "hebrews", JAS: "james-peter-and-jude", "1PE": "james-peter-and-jude", "2PE": "james-peter-and-jude", JUD: "james-peter-and-jude", "1JN": "the-letters-of-john", "2JN": "the-letters-of-john", "3JN": "the-letters-of-john" };

export function studiesFor(data: StudyData, code: string, bookNumber: number, chapter: number): StudyGroup[] {
  const low = bookNumber * 1e6 + chapter * 1e3, high = low + 999;
  const touches = (spans: Span[] | null | undefined) => !!spans?.some(([start, end]) => start <= high && end >= low);
  const harmonySpans = (refs: Partial<Record<string, Span[]>>) => Object.values(refs).flat() as Span[];
  const sections = data.harmony.parts.flatMap((part) => part.sections);
  const sectionByNumber = new Map(sections.map((s) => [s.n, s]));

  const events = sections.filter((s) => touches(harmonySpans(s.refs))).map((s) => ({ title: s.title, href: `/study/gospels#event-${s.n}` }));
  const parables = PARABLES.filter((p) => p.passages.some((v) => v.book === code && v.chapter === chapter))
    .map((p) => ({ title: p.title, href: `${PARABLE_GUIDE_URL}&parable=${p.id}` }));
  const miracles = [
    ...data.miracles.christ.filter((m) => { const s = sectionByNumber.get(m.section); return !!s && touches(harmonySpans(s.refs)); }).map((m) => m.title),
    ...data.miracles.servants.flatMap((group) => group.items.filter((m) => touches(m.refs)).map((m) => `${m.title} (${group.who})`)),
    ...data.miracles.evil.filter((m) => touches(m.refs)).map((m) => m.title),
  ].map((title) => ({ title, href: "/study/miracles" }));
  const names = data.names.groups.flatMap((group) => group.names.filter((n) => touches(n.refs)).map((n) => ({ title: n.name, href: `/study/names#group-${group.key}`, note: group.label })));
  const letter = data.letters.find((l) => l.code === code);
  const letterSections = (letter?.sections ?? []).filter((s) => s.start <= high && s.end >= low)
    .map((s) => ({ title: s.title, href: `/study/letters/${LETTER_PAGE[code] ?? "paul"}` }));
  const prophets = data.prophets.filter((p) => p.kind !== "false" && (p.book === code || (p.first !== null && p.first >= low && p.first <= high)))
    .map((p) => ({ title: p.name, href: "/study/prophets", note: p.book === code ? "wrote this book" : "first named here" }));

  return [
    { kind: "Gospel harmony", links: events },
    { kind: "Parables", links: parables },
    { kind: "Miracles", links: miracles },
    { kind: "Letters", links: letterSections },
    { kind: "Prophets", links: prophets },
    { kind: "Names of God", links: names },
  ].filter((group) => group.links.length);
}
