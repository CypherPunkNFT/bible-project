// What came first?: the small pure rules of the view (Who's older?'s redesign, docs/visual-audits/whos-older-redesign.md),
// kept out of the components so they can be tested on their own: the year strip's geometry, which card stayed from the
// round before, the result's title line, the sample face-off and a label's bracketed qualifier.
import { formatYear, gapLabel, yearSpan } from "../whos-older/explain";
import { MILESTONES, type PairRound } from "./game";
import type { PairCategory } from "./order";
import type { PairPool, PoolPair, ShownItem } from "./pool";

/** The categories whose reveal draws the year strip: their items have windows of years (design §9.3). */
export const hasStrip = (category: PairCategory) => category !== "went" && category !== "books";

/** The strip's words for one window, per category, for screen readers: "born about 1090–1030 BC". */
export function windowNote(category: PairCategory, item: Pick<ShownItem, "lo" | "hi">): string {
  const { lo, hi } = item;
  if (lo === null && hi === null) return "date unknown";
  const span = lo !== null && hi !== null ? yearSpan(lo, hi) : formatYear((lo ?? hi)!);
  switch (category) {
    case "lived": return hi === null ? `born after about ${span}` : lo === null ? `born before about ${span}` : `born about ${span}`;
    case "ruled": return hi === null ? `began to reign after about ${span}` : lo === null ? `began to reign before about ${span}` : `began to reign about ${span}`;
    case "built": return hi === null ? `built after about ${span}` : lo === null ? `built before about ${span}` : `built about ${span}`;
    case "died": return hi === null ? `died after about ${span}` : lo === null ? `died before about ${span}` : `died about ${span}`;
    default: return hi === null ? `after about ${span}` : lo === null ? `before about ${span}` : `about ${span}`;
  }
}

interface Bar { person: ShownItem; left: number; width: number; open: boolean; note: string; start?: string; end?: string }

const OPEN_SHARE = 0.25; // an open edge fades out over this share of the axis
const ONE_LABEL_UNDER = 34; // a bar narrower than this share of the axis gets one label instead of one at each end (two collide on a phone)

interface Strip { bars: [Bar, Bar]; years: boolean; gap?: { left: number; width: number; label: string } }

export function strip(pair: PoolPair, category: PairCategory = "lived"): Strip {
  const { first, second } = pair;
  if (!first.shown || !second.shown) {
    return { years: false, bars: [
      { person: first, left: 2, width: 40, open: first.lo === null, note: "earlier", start: "earlier" },
      { person: second, left: 58, width: 40, open: false, note: "later", start: "later" },
    ] };
  }
  const known = [first.lo, first.hi, second.lo, second.hi].filter((y): y is number => y !== null);
  let start = Math.min(...known);
  const end = Math.max(...known);
  if (first.lo === null) start -= Math.max(50, (end - start) * OPEN_SHARE);
  const span = Math.max(1, end - start);
  const at = (year: number) => ((year - start) / span) * 100;
  const bar = (person: ShownItem): Bar => {
    const lo = person.lo ?? start;
    const hi = person.hi ?? end;
    const width = Math.max(1.5, at(hi) - at(lo));
    const one = width < ONE_LABEL_UNDER;
    const from = person.lo === null ? "earlier" : formatYear(person.lo);
    return { person, left: at(lo), width, open: person.lo === null, note: windowNote(category, person),
      ...(one ? { start: person.lo === null ? `earlier – ${formatYear(hi)}` : yearSpan(lo, hi) } : { start: from, end: formatYear(hi) }) };
  };
  const bars: [Bar, Bar] = [bar(first), bar(second)];
  const gap = pair.reason.kind === "windows" && first.hi !== null && second.lo !== null
    ? { left: at(first.hi), width: Math.max(0, at(second.lo) - at(first.hi)), label: gapLabel(pair.reason.gap) } : undefined;
  return { bars, years: true, gap };
}


/** Who the left card was in the round before: the right-hand person who slid over, the left one who held on, or nobody. */
export function stayedFrom(rounds: readonly PairRound[]): "right" | "left" | null {
  const [before, now] = rounds.slice(-2);
  if (!before || !now) return null;
  return now.left === before.right ? "right" : now.left === before.left ? "left" : null;
}


/** The milestone the streak reached, as the result's title line. */
export const reachedTitle = (score: number): string | undefined => {
  const reached = Object.keys(MILESTONES).map(Number).filter((n) => n <= score);
  return reached.length ? MILESTONES[Math.max(...reached)] : undefined;
};


/** The start screen's sample face-off: Moses and Paul for people, else the first easy pair of the category. */
export function samplePair(pool: PairPool): [ShownItem, ShownItem] {
  const moses = pool.byId.get("moses-exo-2-10");
  const paul = pool.byId.get("paul-act-7-58");
  if (pool.key === "lived" && moses && paul) return [moses, paul];
  const pair = pool.byBand.easy[0] ?? pool.pairs[0];
  return [pair.first, pair.second];
}


/** The bracketed part of a label, for a second small line: "Mary (mother of Jesus)" -> "mother of Jesus". */
export const qualifier = (label: string) => /\((.*)\)$/.exec(label)?.[1] ?? "";


const SECTION_LABELS: Record<string, string> = {
  history: "History", poetry: "Poetry and wisdom", prophets: "Prophets", gospels: "Gospels", epistles: "Letters", revelation: "Prophecy",
};

/** The card's second line: a tag, or a book's library section; events and stops have none (it would hint the date). */
export const cardTag = (category: PairCategory, item: Pick<ShownItem, "section" | "tag">): string => (category === "books" ? SECTION_LABELS[item.section ?? ""] ?? "" : item.tag ?? "");
