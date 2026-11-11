// Bible twenty questions: the pure game logic (docs/features/twenty-questions/design.md §7, §9). No React, no
// browser, no `@/` alias and only relative imports, so the tagging scripts can load it under Node with
// --experimental-strip-types (design §5.5) and the data test can play every person through it.

/** One question: `q` is asked in both modes; `l` 0 = everyday, 1 = detail. */
export interface TqTag { id: string; q: string; g: string; l: number; implies?: string[]; excludes?: string[] }
/** One person. `v` holds one letter per tag, in tag order: y n ? - (n/a) Y N (slip-marked). */
export interface TqPerson { id: string; label: string; also: string[]; t: number; f: number; slug: string; b: string; s: string; v: string }
export interface TqData { version: string; tags: TqTag[]; people: TqPerson[] }

export type Answer = "y" | "n" | "d";
export type Turn = { kind: "q"; tag: number; answer: Answer } | { kind: "g"; person: number; right: boolean };
export const TURNS = 20;
export const EXTRA_TURNS = 5;

const YES = 0, NO = 1, UNSURE = 2;

/** The data with its lookups built once: guess-mode values (slip and n/a read as unsure) and true values. */
export interface Engine {
  data: TqData;
  tagIndex: Map<string, number>;
  personIndex: Map<string, number>;
  /** guess[p * tags + t]: YES, NO or UNSURE as guess mode reads it. */
  guess: Uint8Array;
  /** truth[p * tags + t]: YES, NO or UNSURE with slip marks read as their true value (reverse mode, design §9.2). */
  truth: Uint8Array;
  /** settledBy[t]: tags a Yes (index 0) or a No (index 1) to t makes pointless to ask (design §7.3 rule 3). */
  settledBy: [number[], number[]][];
}

export function prepare(data: TqData): Engine {
  const tagCount = data.tags.length;
  const tagIndex = new Map(data.tags.map((t, i) => [t.id, i]));
  const guess = new Uint8Array(data.people.length * tagCount), truth = new Uint8Array(guess.length);
  data.people.forEach((person, p) => {
    if (person.v.length !== tagCount) throw new Error(`twenty questions: ${person.id} has ${person.v.length} values, expected ${tagCount}`);
    for (let t = 0; t < tagCount; t++) {
      const letter = person.v[t];
      guess[p * tagCount + t] = letter === "y" ? YES : letter === "n" ? NO : UNSURE;
      truth[p * tagCount + t] = letter === "y" || letter === "Y" ? YES : letter === "n" || letter === "N" ? NO : UNSURE;
    }
  });
  const settledBy: [number[], number[]][] = data.tags.map(() => [[], []]);
  data.tags.forEach((tag, a) => {
    for (const id of [...(tag.implies ?? []), ...(tag.excludes ?? [])]) {
      const b = tagIndex.get(id);
      if (b !== undefined) settledBy[a][0].push(b); // Yes to a: b is known
    }
    for (const id of tag.implies ?? []) {
      const b = tagIndex.get(id);
      if (b !== undefined) settledBy[b][1].push(a); // No to b: a (which implies b) is known
    }
  });
  return { data, tagIndex, personIndex: new Map(data.people.map((p, i) => [p.id, i])), guess, truth, settledBy };
}

/** A seeded random number in [0, 1): the same game seed and turn always pick the same question. */
export function seeded(seed: number, step: number): number {
  let x = (seed ^ Math.imul(step + 1, 0x9e3779b1)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

/** Device-softened values (design §10.3): "person|tag" keys whose value never counts as a miss. */
export type Softened = ReadonlySet<string>;
export const softKey = (personId: string, tagId: string) => `${personId}|${tagId}`;

/** How many answers contradict each person (design §7.1). Don't know, unsure, n/a, slip and softened never count. */
export function missCounts(engine: Engine, turns: readonly Turn[], softened: Softened = new Set()): Int32Array {
  const { data, guess } = engine, tagCount = data.tags.length;
  const misses = new Int32Array(data.people.length);
  for (const turn of turns) {
    if (turn.kind !== "q" || turn.answer === "d") continue;
    const against = turn.answer === "y" ? NO : YES;
    for (let p = 0; p < misses.length; p++) {
      if (guess[p * tagCount + turn.tag] === against && !softened.has(softKey(data.people[p].id, data.tags[turn.tag].id))) misses[p]++;
    }
  }
  return misses;
}

export interface Field { remaining: number[]; leading: number[]; best: number }

/** Remaining = not rejected and at most one miss more than the best; leading = exactly the best (design §7.2). */
export function field(engine: Engine, turns: readonly Turn[], softened?: Softened, misses = missCounts(engine, turns, softened)): Field {
  const rejected = new Set(turns.flatMap((t) => (t.kind === "g" && !t.right ? [t.person] : [])));
  let best = Infinity;
  for (let p = 0; p < misses.length; p++) if (!rejected.has(p) && misses[p] < best) best = misses[p];
  const remaining: number[] = [], leading: number[] = [];
  for (let p = 0; p < misses.length; p++) {
    if (rejected.has(p) || misses[p] > best + 1) continue;
    remaining.push(p);
    if (misses[p] === best) leading.push(p);
  }
  return { remaining, leading, best };
}

/** Split of one tag over some people: yes, no and unsure counts, read from the given value table. */
export function split(engine: Engine, values: Uint8Array, people: readonly number[], tag: number): [number, number, number] {
  const tagCount = engine.data.tags.length, counts: [number, number, number] = [0, 0, 0];
  for (const p of people) counts[values[p * tagCount + tag]]++;
  return counts;
}

/** Tags already asked, or settled by an earlier answer. */
export function closedTags(engine: Engine, turns: readonly Turn[]): Set<number> {
  const closed = new Set<number>();
  for (const turn of turns) {
    if (turn.kind !== "q") continue;
    closed.add(turn.tag);
    if (turn.answer !== "d") for (const t of engine.settledBy[turn.tag][turn.answer === "y" ? 0 : 1]) closed.add(t);
  }
  return closed;
}

/**
 * The 50/50 rule (design §7.3): the tag whose worst case leaves the fewest of the people in the lead, everyday first,
 * seeded variety. The split is counted over the leaders (over everyone remaining while only one leads or nobody has
 * missed yet): counting the forgiven near-misses too made a 354-person pool take 15 turns on average and lose a fifth
 * of truthful games. Among the tags within the band, those that also best split everyone remaining are preferred,
 * so a slipped player's real person is still narrowed down.
 */
export function chooseTag(engine: Engine, turns: readonly Turn[], remaining: readonly number[], seed: number, leading: readonly number[] = remaining): number | null {
  const closed = closedTags(engine, turns), severalLead = leading.length !== 1;
  const base = severalLead ? leading : remaining;
  const scored: { tag: number; score: number; wide: number; detail: boolean }[] = [];
  engine.data.tags.forEach((tag, t) => {
    if (closed.has(t)) return;
    const [y, n, u] = split(engine, engine.guess, base, t);
    if (y === 0 || n === 0) return; // its answer could change nothing among the leaders
    const [wy, wn, wu] = split(engine, engine.guess, remaining, t);
    scored.push({ tag: t, score: Math.max(y, n) + u, wide: Math.max(wy, wn) + wu, detail: tag.l === 1 });
  });
  if (!scored.length) return null;
  const everyday = scored.filter((s) => !s.detail);
  const bestEveryday = Math.min(...everyday.map((s) => s.score));
  const pool = everyday.length && bestEveryday <= 0.7 * base.length ? everyday : scored;
  const best = Math.min(...pool.map((s) => s.score));
  const slack = base.length > 40 ? Math.max(2, 0.05 * base.length) : 2;
  const band = pool.filter((s) => s.score <= best + slack);
  const bestWide = Math.min(...band.map((s) => s.wide));
  const near = band.filter((s) => s.wide === bestWide).sort((a, b) => a.tag - b.tag);
  return near[Math.floor(seeded(seed, turns.length) * near.length)].tag;
}

export type Step = { kind: "ask"; tag: number } | { kind: "guess"; person: number } | { kind: "out" };

export const turnsUsed = (turns: readonly Turn[]) => turns.length;
export const questionsAnswered = (turns: readonly Turn[]) => turns.filter((t) => t.kind === "q").length;

/** What the site does next (design §7.4): guess when one person leads, when nothing splits, or on the last turn. */
export function nextStep(engine: Engine, turns: readonly Turn[], seed: number, limit = TURNS, softened?: Softened): Step {
  if (turns.length >= limit) return { kind: "out" };
  const { remaining, leading } = field(engine, turns, softened);
  if (!leading.length) return { kind: "out" };
  const famous = leading.reduce((a, b) => (engine.data.people[b].f < engine.data.people[a].f ? b : a));
  if ((leading.length === 1 && questionsAnswered(turns) >= 3) || turns.length === limit - 1) return { kind: "guess", person: famous };
  const tag = chooseTag(engine, turns, remaining, seed, leading);
  return tag === null ? { kind: "guess", person: famous } : { kind: "ask", tag };
}

/** Reverse mode's answer to one question about the secret person (design §9.2): true values, slip marks undone. */
export type ReverseAnswer = "yes" | "no" | "unknown" | "na";
export function reverseAnswer(engine: Engine, person: number, tag: number): ReverseAnswer {
  const letter = engine.data.people[person].v[tag];
  if (letter === "-") return "na";
  const value = engine.truth[person * engine.data.tags.length + tag];
  return value === YES ? "yes" : value === NO ? "no" : "unknown";
}

/** Reverse mode's secret (design §9.1): easy picks from tier 1, hard from everyone, avoiding the recent secrets. */
export function pickSecret(engine: Engine, level: "easy" | "hard", recent: readonly string[], random: number): number {
  const all = engine.data.people.flatMap((p, i) => (level === "hard" || p.t === 1 ? [i] : []));
  const avoid = new Set(recent);
  const fresh = all.filter((p) => !avoid.has(engine.data.people[p].id));
  const from = fresh.length ? fresh : all; // only a pool smaller than the recent list could run out
  return from[Math.min(from.length - 1, Math.floor(random * from.length))];
}

/** Reverse mode's helper: people the site's own answers still allow, with no forgiveness (design §9.2). */
export function stillPossible(engine: Engine, asked: readonly number[], secret: number, guessed: readonly number[] = []): number[] {
  const tagCount = engine.data.tags.length, out: number[] = [];
  const wrong = new Set(guessed.filter((p) => p !== secret));
  for (let p = 0; p < engine.data.people.length; p++) {
    if (wrong.has(p)) continue;
    const fits = asked.every((t) => {
      const truth = engine.truth[secret * tagCount + t], mine = engine.truth[p * tagCount + t];
      return truth === UNSURE || mine === UNSURE || truth === mine;
    });
    if (fits) out.push(p);
  }
  return out;
}

/** A player for the simulation: answers truthfully from the guess-mode values, with optional habits. */
export interface Player { dontKnowDetail?: boolean; wrongAt?: number }

/** Plays one whole guess-mode game for one person; returns the turn of the right guess, or null if lost (design §5.5). */
export function simulate(engine: Engine, secret: number, seed: number, player: Player = {}, limit = TURNS): number | null {
  const turns: Turn[] = [], tagCount = engine.data.tags.length;
  let slipped = false; // the one wrong answer lands on the first yes/no answer from question `wrongAt` on
  for (;;) {
    const step = nextStep(engine, turns, seed, limit);
    if (step.kind === "out") return null;
    if (step.kind === "guess") {
      const right = step.person === secret;
      turns.push({ kind: "g", person: step.person, right });
      if (right) return turns.length;
      continue;
    }
    const value = engine.guess[secret * tagCount + step.tag];
    let answer: Answer = value === YES ? "y" : value === NO ? "n" : "d";
    if (player.dontKnowDetail && engine.data.tags[step.tag].l === 1) answer = "d";
    if (!slipped && player.wrongAt !== undefined && questionsAnswered(turns) >= player.wrongAt && answer !== "d") {
      answer = answer === "y" ? "n" : "y";
      slipped = true;
    }
    turns.push({ kind: "q", tag: step.tag, answer });
  }
}
