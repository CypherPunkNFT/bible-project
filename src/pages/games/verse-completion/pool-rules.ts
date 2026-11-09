// Verse completion: the rules the build applies to each curated passage (design §5.1, §7.2). Pure functions over the
// passage text, so the build script writes pool.json with them and data.test.ts checks pool.json against them.
import { endMark } from "./passage.ts";
import { words, type Word } from "./words.ts";
import { compareIds, type Level, type Passage, type PickLevel } from "./model.ts";

/** The share of the passage shown at each level (§7.2 rule 2). */
const SHOWN_SHARE: Record<Level, number> = { easy: 0.65, medium: 0.45, hard: 0.2 };
const JOINING = new Set(["and", "but", "for", "that", "so", "because", "who", "which", "when", "if"]);
export const MIN_SHOWN = 2;
export const MIN_HIDDEN = 3;
export const MAX_SHOWN_HARD = 6;

/** Word boundaries at a natural pause: after , ; : — . ? ! or before a joining word (§7.2 rule 1). */
export function pauses(list: readonly Word[]): number[] {
  const found: number[] = [];
  for (let i = 1; i < list.length; i++) {
    if (/[,;:—.?!]/.test(list[i - 1].text) || JOINING.has(list[i].key)) found.push(i);
  }
  return found;
}

/** Whether a split point obeys §7.2 rule 4 for this level. */
export function splitAllowed(point: number, count: number, level: Level): boolean {
  return Number.isInteger(point) && point >= MIN_SHOWN && point <= count - MIN_HIDDEN && (level !== "hard" || point <= MAX_SHOWN_HARD);
}

function autoSplit(count: number, found: readonly number[], level: Level): number {
  const target = count * SHOWN_SHARE[level];
  let best: number | null = null;
  for (const point of found) {
    if (Math.abs(point - target) > 0.15 * count) continue;
    if (best === null || Math.abs(point - target) < Math.abs(best - target)) best = point; // ties: the earlier one stays
  }
  const point = best ?? Math.round(target - 1e-9); // nearest word, ties towards the earlier one
  const upper = Math.min(count - MIN_HIDDEN, level === "hard" ? MAX_SHOWN_HARD : count);
  return Math.max(MIN_SHOWN, Math.min(upper, point));
}

/** The split for each level, with a curator's overrides checked against the same limits. */
export function splitPoints(text: string, overrides: Partial<Record<Level, number>> = {}, id = "?"): Record<Level, number> {
  const list = words(text);
  const found = pauses(list);
  const result = {} as Record<Level, number>;
  for (const level of ["easy", "medium", "hard"] as const) {
    const point = overrides[level] ?? autoSplit(list.length, found, level);
    if (!splitAllowed(point, list.length, level)) {
      throw new Error(`verse completion: ${id} ${level} split ${point} breaks the limits (≥${MIN_SHOWN} shown, ≥${MIN_HIDDEN} hidden, Hard ≤${MAX_SHOWN_HARD} shown) for ${list.length} words`);
    }
    result[level] = point;
  }
  if (!(result.hard <= result.medium && result.medium <= result.easy)) {
    throw new Error(`verse completion: ${id} splits must run hard ≤ medium ≤ easy, got ${result.hard}, ${result.medium}, ${result.easy}`);
  }
  return result;
}

/** A passage's hidden ending at one level, as comparison keys and as shown. */
export interface Ending { keys: string[]; text: string; mark: string }

const ENDINGS = new Map<string, Ending>();

export function endingOf(text: string, split: number): Ending {
  const key = `${split}|${text}`;
  let ending = ENDINGS.get(key);
  if (!ending) {
    const list = words(text);
    ending = { keys: list.slice(split).map((word) => word.key), text: text.slice(list[split].start), mark: endMark(text) };
    ENDINGS.set(key, ending);
  }
  return ending;
}

/** Two endings look alike: the same words, or the same first three or last three words (§5.1 rule 3). */
export function endingsClash(a: readonly string[], b: readonly string[]): boolean {
  const join = (list: readonly string[]) => list.join(" ");
  return join(a) === join(b) || join(a.slice(0, 3)) === join(b.slice(0, 3)) || join(a.slice(-3)) === join(b.slice(-3));
}

const STOP = new Set(["that", "with", "your", "will", "from", "this", "have", "they", "them", "their", "unto", "shall", "were",
  "what", "when", "then", "into", "upon", "those", "these", "there", "which", "whom", "who", "because", "about"]);

/** Content words of the shown opening: longer than three letters and not a common joining word (§5.1 rule 4). */
export const contentWords = (keys: readonly string[]): Set<string> => new Set(keys.filter((key) => key.length > 3 && !STOP.has(key)));

export interface DecoyInput { passage: Passage; text: string }

/** Wrong options for one passage at one level, or an error naming the passage (§5.1 rules 1–5). */
export function chooseDecoys(index: number, all: readonly DecoyInput[], level: PickLevel): [string, string] {
  const self = all[index];
  const right = endingOf(self.text, self.passage.split[level]);
  const opening = contentWords(words(self.text).slice(0, self.passage.split[level]).map((word) => word.key));
  const book = Math.floor(self.passage.from / 1e6);
  const options = all.filter((other) => other !== self && !other.passage.retired && !overlapping(other.passage, self.passage))
    .map((other) => ({ other, ending: endingOf(other.text, other.passage.split[level]) }))
    .filter(({ ending }) => ending.mark === right.mark && closeInLength(ending.keys.length, right.keys.length) && !endingsClash(ending.keys, right.keys))
    .map((option) => ({ ...option, cost: preference(option.other.passage, option.ending.keys, book, self.passage.testament, opening) }))
    .sort((a, b) => a.cost - b.cost || compareIds(a.other.passage.id, b.other.passage.id))
    .slice(0, 30);
  const wantLongest = index % 3 === 0; // the right ending is the longest on about a third of cards (§5.1 rule 5)
  let best: { pair: [string, string]; score: number } | null = null;
  for (let a = 0; a < options.length; a++) {
    for (let b = a + 1; b < options.length; b++) {
      if (endingsClash(options[a].ending.keys, options[b].ending.keys)) continue;
      const longest = right.keys.length > options[a].ending.keys.length && right.keys.length > options[b].ending.keys.length;
      const score = (longest === wantLongest ? 0 : 100) + options[a].cost + options[b].cost;
      if (!best || score < best.score) best = { pair: [options[a].other.passage.id, options[b].other.passage.id], score };
    }
  }
  if (!best) throw new Error(`verse completion: ${self.passage.id} has no two eligible ${level} decoys (same end mark, length within 30%, no shared first or last three words)`);
  return best.pair;
}

const overlapping = (a: Passage, b: Passage) => a.from <= b.to && b.from <= a.to;
const closeInLength = (other: number, right: number) => Math.abs(other - right) <= Math.max(2, right * 0.3);

/** Lower is better: the same book first, then the same testament; sharing a content word with the opening helps. */
function preference(other: Passage, keys: readonly string[], book: number, testament: string, opening: ReadonlySet<string>): number {
  const sameBook = Math.floor(other.from / 1e6) === book;
  const shares = keys.some((key) => opening.has(key));
  return (sameBook ? 0 : other.testament === testament ? 4 : 8) + (shares ? 0 : 2);
}

/** Of the three endings, the share of cards where the right one is the longest, ties counted fractionally (§5.1). */
export function longestShare(entries: readonly { right: number; decoys: readonly number[] }[]): number {
  let total = 0;
  for (const { right, decoys } of entries) {
    const max = Math.max(right, ...decoys);
    if (right === max) total += 1 / [right, ...decoys].filter((length) => length === max).length;
  }
  return entries.length ? total / entries.length : 0;
}
