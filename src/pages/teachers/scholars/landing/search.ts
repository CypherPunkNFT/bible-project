// The landing's search: scholars by name, book, field, faith or place. Every word must appear somewhere; names rank
// first, then works, then field, place or faith. Each match says why it matched when it was not the name.
import type { Field, Scholar, ScholarsData } from "@/data/teachers/pages-types";
import { byBirth } from "../marks/facts";

const FIELD_WORDS: Record<Field, string> = {
  history: "historian", texts: "translator languages greek hebrew latin", places: "archaeologist archaeology dig",
  reference: "dictionary concordance", theology: "theologian philosopher",
};
export type Why = { work: string; year: number } | { text: string };
export interface Match { s: Scholar; score: number; why: Why }

function score(data: ScholarsData, s: Scholar, words: string[]): Omit<Match, "s"> | null {
  const name = `${s.name} ${s.short}`.toLowerCase(), works = s.works.map((w) => w[0].toLowerCase());
  const field = `${data.fields[s.field]} ${FIELD_WORDS[s.field]}`.toLowerCase(), place = s.place[0].toLowerCase();
  const faith = data.faiths[s.faith].toLowerCase();
  const all = [name, ...works, field, place, faith].join(" ");
  if (!words.every((w) => all.includes(w))) return null;
  if (words.every((w) => name.includes(w))) {
    return { score: name.split(/\s+/).some((part) => part.startsWith(words[0])) ? 4 : 3, why: { text: data.fields[s.field] } };
  }
  const work = s.works.find(([t]) => words.some((w) => t.toLowerCase().includes(w)));
  if (work) return { score: 2, why: { work: work[0], year: work[1] } };
  if (words.some((w) => field.includes(w))) return { score: 1, why: { text: data.fields[s.field] } };
  if (words.some((w) => place.includes(w))) return { score: 1, why: { text: `Worked in ${s.place[0]}` } };
  return { score: 1, why: { text: data.faiths[s.faith] } };
}

export function findScholars(data: ScholarsData, query: string): Match[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const out: Match[] = [];
  for (const s of byBirth(data.scholars)) {
    const hit = score(data, s, words);
    if (hit) out.push({ s, ...hit });
  }
  return out.sort((a, b) => b.score - a.score || a.s.born - b.s.born);
}
