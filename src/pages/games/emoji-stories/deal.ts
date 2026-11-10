// Dealing (design §6.2 and §8.2): Practice and room rounds, the three wrong choices beside each answer, and the
// memory of recently seen puzzles. Pure and seeded, so a test can deal a thousand rounds and a Daily's four choices
// are the same for everyone.
import { mulberry32 } from "./daily-rules";
import type { Story, Testament } from "./types";

export const ROUND_LENGTH = 10;
export const RECENT_LIMIT = 60;
/** A Practice filter is offered only with at least this many puzzles. */
export const MIN_FILTER_SIZE = 20;

export type Difficulty = "easy" | "mixed" | "hard";
export type TestamentFilter = Testament | "both";
export interface Filter {
  difficulty: Difficulty;
  testament: TestamentFilter;
}

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "mixed", "hard"];
export const TESTAMENTS: readonly TestamentFilter[] = ["both", "old", "new"];
export const filterKey = (filter: Filter): string => `${filter.difficulty}-${filter.testament}`;

export const active = (stories: readonly Story[]): Story[] => stories.filter((story) => !story.retired);

export function inFilter(story: Story, filter: Filter): boolean {
  if (filter.testament !== "both" && story.testament !== filter.testament) return false;
  if (filter.difficulty === "easy") return story.tier === 1;
  if (filter.difficulty === "hard") return story.tier >= 2;
  return true;
}

export const storiesFor = (stories: readonly Story[], filter: Filter): Story[] => active(stories).filter((story) => inFilter(story, filter));

export const isOffered = (stories: readonly Story[], filter: Filter): boolean => storiesFor(stories, filter).length >= MIN_FILTER_SIZE;

/** Shuffled copy, Fisher–Yates with the given random source. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Ten puzzles for a round: unseen ones first (the last 60 seen wait), then those seen longest ago. */
export function dealRound(stories: readonly Story[], filter: Filter, recent: readonly string[], seed: number): string[] {
  const random = mulberry32(seed);
  const pool = shuffle(storiesFor(stories, filter), random);
  const fresh = pool.filter((story) => !recent.includes(story.id));
  const seen = pool.filter((story) => recent.includes(story.id)).sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
  return [...fresh, ...seen].slice(0, ROUND_LENGTH).map((story) => story.id);
}

const emojiOf = (story: Story): Set<string> => new Set(story.emoji.map(([emoji]) => emoji));
const shared = (a: Story, b: Story): number => [...emojiOf(a)].filter((emoji) => emojiOf(b).has(emoji)).length;
const peopleOf = (story: Story): Set<string> => new Set(story.people.map((person) => person.id));
export const sharePerson = (a: Story, b: Story): boolean => [...peopleOf(a)].some((id) => peopleOf(b).has(id));

/** May `other` stand beside `answer` as a wrong choice at all? (§6.2 rule 1: never a confusable or look-alike row.) */
export function fairWrongChoice(answer: Story, other: Story): boolean {
  return (
    other.id !== answer.id &&
    !other.retired &&
    !answer.confusable.includes(other.id) &&
    !other.confusable.includes(answer.id) &&
    shared(answer, other) < 2
  );
}

/** The answer and three wrong titles, in shuffled order (§6.2). */
export function choicesFor(answer: Story, stories: readonly Story[], seed: number): string[] {
  const random = mulberry32(seed);
  const fair = shuffle(stories.filter((other) => fairWrongChoice(answer, other)), random);
  const tiers = (story: Story) => Math.abs(story.tier - answer.tier) <= 1;
  const preferences = [
    fair.filter((story) => story.testament === answer.testament && tiers(story)),
    fair.filter((story) => story.testament !== answer.testament && tiers(story)),
    fair,
  ];
  const picked: Story[] = [];
  for (const group of preferences) {
    for (const story of group) {
      if (picked.length === 3) break;
      if (picked.includes(story) || sharePerson(story, answer) || picked.some((other) => sharePerson(other, story))) continue;
      picked.push(story);
    }
  }
  if (picked.length < 3) throw new Error(`emoji stories: fewer than three fair wrong choices for ${answer.id}`);
  return shuffle([answer, ...picked], random).map((story) => story.id);
}

/** The recent-puzzle memory with these ids added at the end, at most 60 kept. */
export const remember = (recent: readonly string[], ids: readonly string[]): string[] =>
  [...recent.filter((id) => !ids.includes(id)), ...ids].slice(-RECENT_LIMIT);

/** Points for one Practice puzzle (§8.2): 3 with no hint, 2 with one, 1 with two or three, 0 if wrong. */
export const points = (right: boolean, hints: number): number => (!right ? 0 : hints === 0 ? 3 : hints === 1 ? 2 : 1);

/** A Practice round's score: the sum of its puzzles' points. */
export const roundScore = (round: { puzzles: readonly { id: string; pick: string | null; hints: number }[] }): number =>
  round.puzzles.reduce((sum, puzzle) => sum + points(puzzle.pick === puzzle.id, puzzle.hints), 0);
