// Who's older? build: the cross-checks of design §4.6 that compare the hand-kept windows with other sources.
// Each returns messages; the build decides which are fatal.
import type { Fact, Person } from "../../src/pages/games/whos-older/pairing.ts";
import type { PageRuler } from "./site-data.ts";

/** A people-page year (BC positive, AD negative) as an astronomical year (1 BC = 0), so plain subtraction works. */
const astroFromPage = (year: number) => (year > 0 ? 1 - year : -year);
/** A historians' year (negative = BC, no 0) as an astronomical year, and back. */
const astroFromHistorian = (year: number) => (year < 0 ? year + 1 : year);
export const historianFromAstro = (year: number) => (year <= 0 ? year - 1 : year);

export interface PageBounds { lo: number; hi: number; how: string }

/**
 * The widest birth range a people-page demands (check 6), in historians' years, or null when the page gives no dated
 * reign. Ruler with a recorded age: every system's accession minus every recorded age. Otherwise the age range
 * (`pageAge`, else the adult allowance 15–80) at every system's accession. Prophet: adult (15–80) at some point in
 * the first listed king's reign on every system.
 */
export function pageBounds(ruler: PageRuler | undefined, firstKing: PageRuler | undefined, pageAge: [number, number] | undefined): PageBounds | null {
  if (ruler?.reigns.length) {
    const starts = ruler.reigns.map((r) => astroFromPage(r.start));
    if (ruler.ages.length) {
      const births = starts.flatMap((s) => ruler.ages.map((age) => s - age));
      return { lo: historianFromAstro(Math.min(...births)), hi: historianFromAstro(Math.max(...births)), how: `aged ${ruler.ages.join(" or ")} at accession (page)` };
    }
    const [min, max] = pageAge ?? [15, 80];
    return { lo: historianFromAstro(Math.min(...starts) - max), hi: historianFromAstro(Math.max(...starts) - min), how: `aged ${min}–${max} at accession${pageAge ? " (pageAge)" : ""}` };
  }
  if (firstKing?.reigns.length) {
    const starts = firstKing.reigns.map((r) => astroFromPage(r.start));
    const ends = firstKing.reigns.map((r) => astroFromPage(r.end));
    return { lo: historianFromAstro(Math.min(...starts) - 80), hi: historianFromAstro(Math.max(...ends) - 15), how: "adult in the first listed king's reign" };
  }
  return null;
}

/** Does the window reach at least over the page's bounds? A null edge is unbounded, so it always reaches. */
export function windowCovers(person: Pick<Person, "lo" | "hi">, bounds: PageBounds): boolean {
  const loOk = person.lo === null || astroFromHistorian(person.lo) <= astroFromHistorian(bounds.lo);
  const hiOk = person.hi === null || astroFromHistorian(person.hi) >= astroFromHistorian(bounds.hi);
  return loOk && hiOk;
}

/** Facts pointing opposite ways, and loops (A before B before C before A), each named by the people in it (check 4a). */
export function factContradictions(facts: readonly Fact[], label: (id: string) => string): string[] {
  const problems: string[] = [];
  const direction = new Map<string, string>();
  for (const fact of facts) {
    const reverse = `${fact.second}>${fact.first}`;
    if (direction.has(reverse)) problems.push(`facts point opposite ways: ${label(fact.first)} and ${label(fact.second)}`);
    direction.set(`${fact.first}>${fact.second}`, fact.kind);
  }
  const next = new Map<string, string[]>();
  for (const fact of facts) next.set(fact.first, [...(next.get(fact.first) ?? []), fact.second]);
  const state = new Map<string, "open" | "done">();
  const stack: string[] = [];
  const visit = (id: string) => {
    state.set(id, "open");
    stack.push(id);
    for (const to of next.get(id) ?? []) {
      if (state.get(to) === "open") problems.push(`facts make a loop: ${[...stack.slice(stack.indexOf(to)), to].map(label).join(" before ")}`);
      else if (!state.has(to)) visit(to);
    }
    stack.pop();
    state.set(id, "done");
  };
  for (const id of next.keys()) if (!state.has(id)) visit(id);
  return problems;
}
