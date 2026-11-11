// Who's older?: the small pure rules of the redesigned view (docs/visual-audits/whos-older-redesign.md), kept out of
// the components so they can be tested on their own: the timeline strip's geometry, which card stayed from the round
// before, the result's title line, the sample face-off and a label's bracketed qualifier.
import { formatYear, gapLabel, windowText, yearSpan } from "./explain";
import { MILESTONES, type Character, type Pool, type PoolPair, type Round } from "./game";

interface Bar { person: Character; left: number; width: number; open: boolean; note: string; start?: string; end?: string }

const OPEN_SHARE = 0.25; // an open edge fades out over this share of the axis
const ONE_LABEL_UNDER = 34; // a bar narrower than this share of the axis gets one label instead of one at each end (two collide on a phone)

interface Strip { bars: [Bar, Bar]; years: boolean; gap?: { left: number; width: number; label: string } }

export function strip(pair: PoolPair): Strip {
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
  const bar = (person: Character): Bar => {
    const lo = person.lo ?? start;
    const hi = person.hi ?? end;
    const width = Math.max(1.5, at(hi) - at(lo));
    const one = width < ONE_LABEL_UNDER;
    const from = person.lo === null ? "earlier" : formatYear(person.lo);
    return { person, left: at(lo), width, open: person.lo === null, note: windowText(person),
      ...(one ? { start: person.lo === null ? `earlier – ${formatYear(hi)}` : yearSpan(lo, hi) } : { start: from, end: formatYear(hi) }) };
  };
  const bars: [Bar, Bar] = [bar(first), bar(second)];
  const gap = pair.reason.kind === "windows" && first.hi !== null && second.lo !== null
    ? { left: at(first.hi), width: Math.max(0, at(second.lo) - at(first.hi)), label: gapLabel(pair.reason.gap) } : undefined;
  return { bars, years: true, gap };
}


/** Who the left card was in the round before: the right-hand person who slid over, the left one who held on, or nobody. */
export function stayedFrom(rounds: readonly Round[]): "right" | "left" | null {
  const [before, now] = rounds.slice(-2);
  if (!before || !now) return null;
  return now.left === before.right ? "right" : now.left === before.left ? "left" : null;
}


/** The milestone the streak reached, as the result's title line. */
export const reachedTitle = (score: number): string | undefined => {
  const reached = Object.keys(MILESTONES).map(Number).filter((n) => n <= score);
  return reached.length ? MILESTONES[Math.max(...reached)] : undefined;
};


/** The start screen's sample face-off: Moses and Paul, or the first two people of the pool. */
export function samplePair(pool: Pool): [Character, Character] {
  const moses = pool.byId.get("moses-exo-2-10");
  const paul = pool.byId.get("paul-act-7-58");
  return moses && paul ? [moses, paul] : [pool.data.characters[0], pool.data.characters[1]];
}


/** The bracketed part of a label, for a second small line: "Mary (mother of Jesus)" -> "mother of Jesus". */
export const qualifier = (label: string) => /\((.*)\)$/.exec(label)?.[1] ?? "";

