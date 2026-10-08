import type { Parallel, Span } from "@/data/letters/types";

/** One cross-reference between the two books: a verse or passage on each side, and how many readers voted for it. */
export type Link = { left: Span; right: Span; votes: number };
type Pair = Parallel["pairs"][number];

/** Each verse's strongest link, on one side: verse id → the index of the link with the most votes that covers it. */
function strongest(links: Link[], side: "left" | "right") {
  const best = new Map<number, number>();
  links.forEach((link, i) => {
    for (let verse = link[side][0]; verse <= link[side][1]; verse++) {
      const held = best.get(verse);
      if (held === undefined || links[held].votes < link.votes) best.set(verse, i);
    }
  });
  return best;
}

/** Two passages in the same chapter that overlap or sit within a verse of each other (ids are book·chapter·verse). */
const near = (a: Span, b: Span) => Math.floor(a[0] / 1_000) === Math.floor(b[0] / 1_000) && a[0] - 1 <= b[1] && b[0] - 1 <= a[1];
const overlaps = (a: Span, b: Span) => a[0] <= b[1] && b[0] <= a[1];
const join = (a: Span, b: Span): Span => [Math.min(a[0], b[0]), Math.max(a[1], b[1])];

/**
 * The readers' cross-references turned into passage pairs, the way scholars set two texts side by side:
 * 1. a link is kept only where it is the strongest link for a verse on BOTH sides (one verse sending several weak
 *    links fans out across the chart; those are mostly a shared word, not a shared passage);
 * 2. kept links whose ends sit within a verse of each other on both sides become one passage pair, their votes added.
 * Where scholars pair the same two passages, their tag and note come along (`scholar`, in either order of the books).
 */
export function passagePairs(links: Link[], scholar?: Parallel): Pair[] {
  const fromLeft = strongest(links, "left"), fromRight = strongest(links, "right");
  const isBest = (best: Map<number, number>, span: Span, i: number) => {
    for (let verse = span[0]; verse <= span[1]; verse++) if (best.get(verse) === i) return true;
    return false;
  };
  const groups: Link[] = [];
  links.forEach((link, i) => {
    if (!isBest(fromLeft, link.left, i) || !isBest(fromRight, link.right, i)) return;
    groups.push({ ...link });
  });
  for (let merged = true; merged;) {
    merged = false;
    outer: for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) {
      const a = groups[i], b = groups[j];
      if (!near(a.left, b.left) || !near(a.right, b.right)) continue;
      groups[i] = { left: join(a.left, b.left), right: join(a.right, b.right), votes: a.votes + b.votes };
      groups.splice(j, 1);
      merged = true;
      break outer;
    }
  }
  const book = (span: Span) => Math.floor(span[0] / 1_000_000);
  return groups.sort((a, b) => b.votes - a.votes).map((g) => {
    const match = scholar?.pairs.find((p) => {
      const [mine, theirs] = book(p.left) === book(g.left) ? [p.left, p.right] : [p.right, p.left];
      return overlaps(mine, g.left) && overlaps(theirs, g.right);
    });
    return { left: g.left, right: g.right, weight: g.votes, kind: match?.kind, note: match?.note };
  });
}
