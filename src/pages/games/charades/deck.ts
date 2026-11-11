// Family charades: which scenes a deck holds and the order they are dealt in (docs/features/family-charades/design.md
// §3 and §4.4). Pure: no browser objects, so every rule here is tested directly.

export type ThemeKey = "beginnings" | "kings" | "jesus" | "miracles" | "parables" | "church" | "seasons";
export type AgeGroup = "little" | "kids" | "adults";
export type DeckKey = "everything" | ThemeKey;
export type Difficulty = "easy" | "medium" | "hard";

export interface Scene {
  id: string;
  title: string;
  /** "JON 1:17-2:10", several passages joined with "; ". */
  ref: string;
  check: string;
  tier: 1 | 2 | 3;
  age: 4 | 8 | 12;
  themes: ThemeKey[];
  picture?: string;
  /** Scenes of one episode share it; a round never deals two of them. */
  story?: string;
}

export interface ScenesFile { about: string; version: number; themes: { key: ThemeKey; title: string }[]; scenes: Scene[] }

export interface DeckChoice { ageGroup: AgeGroup; deck: DeckKey; difficulty: Difficulty }

/** A deck is offered only when it holds at least this many scenes (§3.3). */
export const MIN_DECK = 12;
export const RECENT_LIMIT = 200;
export const AGE_GROUPS: readonly { key: AgeGroup; label: string; maxAge: number }[] = [
  { key: "little", label: "Little ones (4–7)", maxAge: 4 },
  { key: "kids", label: "Kids (8–12)", maxAge: 8 },
  { key: "adults", label: "Teens and adults", maxAge: 12 },
];
export const DIFFICULTIES: readonly { key: Difficulty; label: string; tiers: readonly number[] }[] = [
  { key: "easy", label: "Easy", tiers: [1] },
  { key: "medium", label: "Medium", tiers: [1, 2] },
  { key: "hard", label: "Hard", tiers: [2, 3] },
];

const maxAgeOf = (group: AgeGroup) => AGE_GROUPS.find((g) => g.key === group)!.maxAge;

/** Whether the start screen asks for a difficulty: only for Everything, and never for Little ones (§3.2). */
export const usesDifficulty = (choice: Pick<DeckChoice, "ageGroup" | "deck">) => choice.deck === "everything" && choice.ageGroup !== "little";

/** The scenes a deck holds for an age group and difficulty (§3.2). */
export function poolFor(scenes: readonly Scene[], choice: DeckChoice): Scene[] {
  const maxAge = maxAgeOf(choice.ageGroup);
  const tiers = usesDifficulty(choice) ? DIFFICULTIES.find((d) => d.key === choice.difficulty)!.tiers : [1, 2, 3];
  return scenes.filter((scene) => scene.age <= maxAge && tiers.includes(scene.tier)
    && (choice.deck === "everything" || scene.themes.includes(choice.deck)));
}

/** A deck is offered when every difficulty it can be played at holds at least MIN_DECK scenes. */
export function deckOffered(scenes: readonly Scene[], ageGroup: AgeGroup, deck: DeckKey): boolean {
  const difficulties: Difficulty[] = usesDifficulty({ ageGroup, deck }) ? ["easy", "medium", "hard"] : ["medium"];
  return difficulties.every((difficulty) => poolFor(scenes, { ageGroup, deck, difficulty }).length >= MIN_DECK);
}

/** How many different scenes one round can deal: one per story, every scene without a story (§4.4). */
export function perRoundMaximum(pool: readonly Scene[]): number {
  const stories = new Set(pool.filter((s) => s.story).map((s) => s.story));
  return pool.filter((s) => !s.story).length + stories.size;
}

export type Random = () => number;

/** A number in [0, 1) from the browser's crypto generator, as §4.4 asks; Math.random only where crypto is missing. */
export const cryptoRandom: Random = () => {
  const buffer = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(buffer)[0] / 2 ** 32;
  return Math.random();
};

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffled, then the recently seen scenes moved to the back, the oldest seen first. `recent` is oldest first. */
export function dealOrder(pool: readonly Scene[], recent: readonly string[], random: Random): string[] {
  const seenAt = new Map(recent.map((id, index) => [id, index]));
  const shuffled = shuffle(pool.map((s) => s.id), random);
  const fresh = shuffled.filter((id) => !seenAt.has(id));
  const seen = shuffled.filter((id) => seenAt.has(id)).sort((a, b) => seenAt.get(a)! - seenAt.get(b)!);
  return [...fresh, ...seen];
}

/** One round's deal: the order, how far into it the deal has gone, which stories are used, and the passes (earliest first). */
export interface Dealer {
  order: string[];
  /** Everything before this index has been dealt, or skipped because its story was already dealt this round. */
  cursor: number;
  stories: string[];
  passed: string[];
  correct: string[];
}

export const newDealer = (order: string[]): Dealer => ({ order, cursor: 0, stories: [], passed: [], correct: [] });

/**
 * The next scene, or null when the round has run out: every scene that can be dealt has been guessed. A fresh scene
 * first (skipping one whose story was dealt this round, for the rest of the round); when none is left, the scenes
 * passed this round come back, earliest-passed first. A scene marked correct never comes back.
 */
export function deal(dealer: Dealer, storyOf: (id: string) => string | undefined): { dealer: Dealer; id: string | null } {
  for (let i = dealer.cursor; i < dealer.order.length; i++) {
    const id = dealer.order[i];
    const story = storyOf(id);
    if (story && dealer.stories.includes(story)) continue;
    return { id, dealer: { ...dealer, cursor: i + 1, stories: story ? [...dealer.stories, story] : dealer.stories } };
  }
  const [again, ...rest] = dealer.passed;
  if (!again) return { dealer: { ...dealer, cursor: dealer.order.length }, id: null };
  return { id: again, dealer: { ...dealer, cursor: dealer.order.length, passed: rest } };
}

/** How many cards the round can still deal: the fresh scenes ahead whose story has not been dealt (one per story), plus
 * the passed scenes that come back. Drawn on the card so the room can feel the deck shrinking. */
export function cardsLeft(dealer: Dealer, storyOf: (id: string) => string | undefined): number {
  const stories = new Set(dealer.stories);
  let fresh = 0;
  for (let i = dealer.cursor; i < dealer.order.length; i++) {
    const story = storyOf(dealer.order[i]);
    if (story) { if (stories.has(story)) continue; stories.add(story); }
    fresh++;
  }
  return fresh + dealer.passed.length;
}

/** Records the answer to the scene on screen: a pass goes to the bottom of the pile, a correct one leaves it. */
export function answerScene(dealer: Dealer, id: string, mark: "correct" | "pass"): Dealer {
  return mark === "correct" ? { ...dealer, correct: [...dealer.correct, id] } : { ...dealer, passed: [...dealer.passed, id] };
}

/** The recently seen list after a round: the played ids moved to the newest end, at most RECENT_LIMIT kept. */
export function addRecent(recent: readonly string[], played: readonly string[]): string[] {
  const playedSet = new Set(played);
  return [...recent.filter((id) => !playedSet.has(id)), ...played].slice(-RECENT_LIMIT);
}

export interface Passage { code: string; start: number; end: number }

/**
 * "JON 1:17-2:10; JON 3:1" into verse ids (BBCCCVVV, as src/lib/refs.ts uses). `numOf` gives a book code's number
 * (from the site's catalog). Throws on a reference it cannot read, naming it.
 */
export function parseRef(ref: string, numOf: (code: string) => number | undefined): Passage[] {
  return ref.split(";").map((part) => {
    const match = /^\s*([1-3A-Z]{3}) (\d+):(\d+)(?:-(\d+)(?::(\d+))?)?\s*$/.exec(part);
    const num = match ? numOf(match[1]) : undefined;
    if (!match || !num) throw new Error(`Family charades: cannot read the reference "${part.trim()}" in "${ref}"`);
    const [, code, chapter, verse, a, b] = match;
    const id = (c: string | number, v: string | number) => num * 1_000_000 + Number(c) * 1000 + Number(v);
    const start = id(chapter, verse);
    const end = b ? id(a, b) : a ? id(chapter, a) : start;
    return { code, start, end };
  });
}

/** The reader on the passage's first chapter, its verses shaded; a passage running on to the next chapter shades to the end. */
export function readHref(passage: Passage): string {
  const chapter = Math.floor(passage.start / 1000) % 1000;
  const verse = passage.start % 1000;
  const sameChapter = Math.floor(passage.end / 1000) === Math.floor(passage.start / 1000);
  const last = !sameChapter ? 999 : passage.end % 1000;
  return `/read/bsb/${passage.code}/${chapter}?hl=${verse}${last !== verse ? `-${last}` : ""}`;
}
