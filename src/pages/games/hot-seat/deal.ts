// Hot seat: drawing the next question of a turn (design §3.3–3.4). One at a time, at random from the player's pool,
// never one already asked this session, avoiding the phone's recently seen list, the same opening words twice in a
// turn and, where it can, the same topic twice running. Pure: the random function is passed in so tests repeat.
import type { PoolEntry } from "./pool";
import { firstWords } from "./words";

export const SEEN_MAX = 2000;
/** When fewer unseen questions than this remain in a pool, its oldest seen entries are let back in (§3.4). */
export const SEEN_FLOOR = 200;
/** How many random candidates are looked at to find a change of topic. */
const TOPIC_TRIES = 6;
/** Random picks tried before falling back to scanning the pool for new opening words. */
const PICK_TRIES = 40;

export interface FrozenQuestion {
  id: string;
  text: string;
  /** The option the reader judges against. */
  answer: string;
  /** The bank's full printed answer, when it says more. */
  full: string | null;
  reference: string | null;
  link: { book: string; chapter: number; verse: number | null } | null;
  level: string;
  topic: string | null;
  /** Two choices to read out, the right one among them, in the order to read them; null for an open answer. */
  choices: [string, string] | null;
  /** Asked before in this session: the pool ran dry (§12). */
  earlier?: true;
}

const pickIndex = (length: number, random: () => number) => Math.min(length - 1, Math.floor(random() * length));

/** The question as the turn keeps it; for two choices, the right option and one of its own three wrong ones. */
export function freeze(entry: PoolEntry, twoChoices: boolean, random: () => number): FrozenQuestion {
  const { frozen } = entry;
  const answer = frozen.options[frozen.correct];
  let choices: [string, string] | null = null;
  if (twoChoices) {
    const wrong = frozen.options.filter((_, i) => i !== frozen.correct);
    const other = wrong[pickIndex(wrong.length, random)];
    choices = random() < 0.5 ? [answer, other] : [other, answer];
  }
  return { id: frozen.id, text: frozen.text, answer, full: entry.full, reference: frozen.reference, link: frozen.link,
    level: entry.level, topic: entry.topic, choices };
}

/** The pool less this session's questions and the phone's seen list, letting the oldest seen back in when too few remain. */
export function available(pool: readonly PoolEntry[], asked: ReadonlySet<string>, seen: readonly string[]): PoolEntry[] {
  const fresh = pool.filter((e) => !asked.has(e.frozen.id));
  const seenSet = new Set(seen);
  const unseen = fresh.filter((e) => !seenSet.has(e.frozen.id));
  if (unseen.length >= SEEN_FLOOR || unseen.length === fresh.length) return unseen;
  const inPool = new Set(fresh.map((e) => e.frozen.id));
  const letBack = new Set(seen.filter((id) => inPool.has(id)).slice(0, SEEN_FLOOR - unseen.length));
  return fresh.filter((e) => !seenSet.has(e.frozen.id) || letBack.has(e.frozen.id));
}

export interface DrawInput {
  pool: readonly PoolEntry[];
  /** Ids asked this session, oldest first (including questions undone during a turn). */
  asked: readonly string[];
  seen: readonly string[];
  /** The questions already asked in this turn, in order. */
  turn: readonly FrozenQuestion[];
  /** Teens and adults open each turn with two easy questions. */
  warmUp: boolean;
  twoChoices: boolean;
  random: () => number;
}

/** The next question, or null when the pool is empty. */
export function drawNext(input: DrawInput): FrozenQuestion | null {
  const { pool, turn, random } = input;
  if (pool.length === 0) return null;
  const asked = new Set(input.asked);
  const seen = new Set(input.seen);
  const openings = new Set(turn.map((q) => firstWords(q.text)));
  const varied = (e: PoolEntry) => !openings.has(e.opening);
  const lastTopic = turn.at(-1)?.topic ?? null;
  // On a normal night most of the pool is fresh: random picks straight from it, each tested on its own, keep a tap
  // fast on a phone. Only when they keep missing is the pool filtered in full (the seen list's floor, the warm-up's
  // fallback, a pool that has run dry).
  const fresh = (e: PoolEntry) => !asked.has(e.frozen.id) && !seen.has(e.frozen.id) && (!input.warmUp || e.level === "easy") && varied(e);
  let chosen = pickFrom(pool, fresh, lastTopic, random);
  if (!chosen) {
    let candidates = available(pool, asked, input.seen);
    if (candidates.length === 0) return askedAgain(input);
    if (input.warmUp) {
      const easy = candidates.filter((e) => e.level === "easy");
      if (easy.length) candidates = easy;
    }
    const newOpenings = candidates.filter(varied);
    const from = newOpenings.length ? newOpenings : candidates;
    chosen = pickFrom(from, () => true, lastTopic, random) ?? from[0];
  }
  return freeze(chosen, input.twoChoices, random);
}

/** A random entry that passes `ok`; the first found is kept, and replaced by a later one with a different topic from the
 * last question, looking at most six ahead. Null when PICK_TRIES picks find none. */
function pickFrom(list: readonly PoolEntry[], ok: (e: PoolEntry) => boolean, lastTopic: string | null, random: () => number): PoolEntry | null {
  let chosen: PoolEntry | null = null;
  for (let tries = 0, looked = 0; tries < PICK_TRIES && looked < TOPIC_TRIES; tries++) {
    const entry = list[pickIndex(list.length, random)];
    if (!ok(entry)) continue;
    looked++;
    chosen ??= entry;
    if (lastTopic === null || entry.topic !== lastTopic) return entry;
  }
  return chosen;
}

/** Every question of the pool has been asked this session: the one asked longest ago that is not in this turn (§12). */
function askedAgain(input: DrawInput): FrozenQuestion | null {
  const byId = new Map(input.pool.map((e) => [e.frozen.id, e]));
  const inTurn = new Set(input.turn.map((q) => q.id));
  // The last asking of each id counts, so a question asked again moves to the back of the line.
  const lastAsked = new Map<string, number>();
  input.asked.forEach((id, i) => lastAsked.set(id, i));
  const order = [...lastAsked].filter(([id]) => byId.has(id) && !inTurn.has(id)).sort((a, b) => a[1] - b[1]);
  const entry = order.length ? byId.get(order[0][0]) : undefined;
  return entry ? { ...freeze(entry, input.twoChoices, input.random), earlier: true } : null;
}

/** The seen list with a turn's questions added at the newest end, capped at SEEN_MAX. */
export function addSeen(seen: readonly string[], ids: readonly string[]): string[] {
  const added = new Set(ids);
  return [...seen.filter((id) => !added.has(id)), ...ids].slice(-SEEN_MAX);
}
