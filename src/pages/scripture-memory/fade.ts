// Scripture memory: which words of a passage are hidden at each step (design §3 and §9). Words are split with the
// Verse completion game's words(), so dashes and quotes travel with their word and the Bible's text is kept exactly.
// The order words disappear in is fixed per passage, so a word hidden on step 2 stays hidden on step 3.
import { words, type Word } from "@/pages/games/verse-completion/words";

/** Steps 0 to 5 hide this share of the words; step 6 is "known by heart" and hides them all, like step 5. */
export const HIDDEN_SHARE = [0, 0.2, 0.4, 0.6, 0.8, 1] as const;
export const KNOWN = 6;

export const passageWords = (text: string): Word[] => words(text);

/** How many of `count` words are hidden at `stage`: none at 0, all from 5, and between them at least one more word per
 * step (so "Jesus wept." still fades a word at a time) but never the last word left before step 5. */
export function hiddenCount(count: number, stage: number): number {
  if (stage <= 0 || count === 0) return 0;
  if (stage >= 5) return count;
  return Math.min(count - 1, Math.max(stage, Math.round(HIDDEN_SHARE[stage] * count)));
}

/** A fixed 32-bit hash of a word's position in a passage (a splitmix-style mixer). */
function positionHash(seed: number, position: number): number {
  let x = (seed ^ Math.imul(position + 1, 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/** The passage's own seed, from its first and last verse ids. */
export const passageSeed = (from: number, to: number): number => positionHash(from >>> 0, to % 1_000_000);

/** Word positions in the order they disappear: by each position's hash, the first word always last. Ordering by a hash
 * of the position (not a shuffle) means a change in the text's length moves only the words added or removed. */
export function fadeOrder(count: number, seed: number): number[] {
  const rest = Array.from({ length: Math.max(0, count - 1) }, (_, i) => i + 1)
    .sort((a, b) => positionHash(seed, a) - positionHash(seed, b) || a - b);
  return count > 0 ? [...rest, 0] : [];
}

/** The positions hidden at `stage`. */
export function hiddenAt(count: number, stage: number, seed: number): Set<number> {
  return new Set(fadeOrder(count, seed).slice(0, hiddenCount(count, stage)));
}
