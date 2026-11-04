import type { Mark, MarkedLink } from "./Bible";
import type { Section } from "./geometry";
import { seeded } from "./wall-books";

const SECTIONS: Section[] = ["history", "poetry", "prophets", "gospels", "epistles"];
/** How many threads a half of the loop draws. */
const THREADS = 4;
/** The Bible page's lines, split into bands so threads on one page start well apart from each other. */
const LINE_BANDS: [number, number][] = [[0, 2], [3, 5], [6, 8], [9, 10]];

/** `count` values spread over 0 to 1, one in each equal band, so some always fall at the outer edge and some at the gutter.
 *  Both pages' values run from the outer edge toward the gutter, so threads nest: the widest joins the two outer edges. */
function spreadAcross(next: () => number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + next()) / count);
}

/** One random line from each band, in random order. */
function spreadLines(next: () => number): number[] {
  return LINE_BANDS.map(([first, last]) => first + Math.floor(next() * (last - first + 1))).sort(() => next() - 0.5);
}

/** A page's marks for one half of the loop: lines from different bands, and positions along them from every part of the width. */
function pageMarks(next: () => number, side: "L" | "R", sections: Section[]): Mark[] {
  const lines = spreadLines(next), outwardIn = spreadAcross(next, THREADS);
  // A page's `at` runs from its outer edge on the left page but from the gutter on the right.
  return sections.map((section, i) => [side, lines[i], side === "L" ? outwardIn[i] : 1 - outwardIn[i], section]);
}

/** The threads of the heading drawing, drawn from a seed so the marks land all over both pages, not just toward the
 *  middle. `matched` joins two verses of one colour; otherwise each thread joins two different colours. */
export function spreadLinks(seed: number, matched: boolean): MarkedLink[] {
  const next = seeded(seed);
  const left = [...SECTIONS].sort(() => next() - 0.5).slice(0, THREADS);
  const right = matched ? left : left.map((_, i) => left[(i + 1 + Math.floor(next() * 3)) % THREADS]);
  const from = pageMarks(next, "L", left), to = pageMarks(next, "R", right);
  return from.map((a, i) => [a, to[i]]);
}
