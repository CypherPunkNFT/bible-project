// Timeline sort build: how an event's window was set, recomputed from the site's own data (design §4.2, §4.3 and
// check 3). Each anchored window must contain the range its anchor gives in every dating system; it may be wider.
import { checkYear } from "../../src/pages/games/whos-older/pairing.ts";
import type { PageRuler } from "../whos-older/site-data.ts";

export type Anchor =
  | { kind: "person-age"; person: string; age: [number, number] }
  | { kind: "reign-year"; ruler: string; year: [number, number] }
  | { kind: "outside"; years: [number, number] }
  | { kind: "manual"; note: string };

export interface Range { lo: number | null; hi: number | null }

/** The dating systems the site's kings are dated in; a page with some but not all of them gets a notice (§4.3 step 2). */
const KING_SYSTEMS = ["thiele-mcfall", "albright", "ussher"];

/** `year` plus `years`, in historians' numbering (no year 0): 5 BC plus 10 years is AD 6. */
export function addYears(year: number, years: number): number {
  checkYear(year);
  const sum = year + years;
  if (year < 0 && sum >= 0) return sum + 1;
  if (year > 0 && sum <= 0) return sum - 1;
  return sum;
}

const isPair = (value: unknown): value is [number, number] =>
  Array.isArray(value) && value.length === 2 && value.every(Number.isInteger) && value[0] <= value[1];

export interface AnchorData {
  /** Who's older? birth windows by person id. */
  births: ReadonlyMap<string, Range>;
  rulers: ReadonlyMap<string, PageRuler>;
}

/** The range an anchor gives, or an error message; `notice` names dating systems a ruler's page lacks. */
export function anchorRange(anchor: Anchor, data: AnchorData): { range?: Range; error?: string; notice?: string } {
  switch (anchor.kind) {
    case "person-age": {
      const born = data.births.get(anchor.person);
      if (!born) return { error: `person-age anchor: ${anchor.person} has no Who's older? birth window (src/data/whos-older/characters.source.json)` };
      if (!isPair(anchor.age) || anchor.age[0] < 0) return { error: `person-age anchor: age must be [min, max], at least 0, got ${JSON.stringify(anchor.age)}` };
      return { range: { lo: born.lo === null ? null : addYears(born.lo, anchor.age[0]), hi: born.hi === null ? null : addYears(born.hi, anchor.age[1]) } };
    }
    case "reign-year": {
      const ruler = data.rulers.get(anchor.ruler);
      if (!ruler || !ruler.reigns.length) return { error: `reign-year anchor: ${anchor.ruler} has no dated reign on the people-pages` };
      if (!isPair(anchor.year) || anchor.year[0] < 1) return { error: `reign-year anchor: year must be [min, max], from 1, got ${JSON.stringify(anchor.year)}` };
      // Pages write BC as positive years and AD as negative, so -start is the historians' year of accession.
      const years = ruler.reigns.flatMap((reign) => [addYears(-reign.start, anchor.year[0] - 1), addYears(-reign.start, anchor.year[1] - 1)]);
      const systems = new Set(ruler.reigns.map((reign) => reign.system));
      const missing = KING_SYSTEMS.filter((system) => !systems.has(system));
      const notice = missing.length && missing.length < KING_SYSTEMS.length ? `${anchor.ruler}'s page has no ${missing.join(" or ")} dates: check the window covers them by hand` : undefined;
      return { range: { lo: Math.min(...years), hi: Math.max(...years) }, notice };
    }
    case "outside":
      if (!isPair(anchor.years) || anchor.years.includes(0)) return { error: `outside anchor: years must be [lo, hi] with no year 0, got ${JSON.stringify(anchor.years)}` };
      return { range: { lo: anchor.years[0], hi: anchor.years[1] } };
    case "manual":
      return anchor.note?.trim() ? {} : { error: "manual anchor: a note saying how the window was set is required" };
    default:
      return { error: `unknown anchor kind ${JSON.stringify((anchor as { kind: unknown }).kind)}: expected person-age, reign-year, outside or manual` };
  }
}

/** Whether `window` contains `range`: an open edge in the range must be open in the window too. */
export function contains(window: Range, range: Range): boolean {
  const loOk = window.lo === null || (range.lo !== null && window.lo <= range.lo);
  const hiOk = window.hi === null || (range.hi !== null && window.hi >= range.hi);
  return loOk && hiOk;
}
