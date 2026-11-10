// Matching a typed answer (design §6.3). The player types, the game suggests stories from its own closed list, and the
// story picked is judged by id: free text is never compared with the answer, so spelling never costs a guess.
// Also the word rules the data test applies to titles and aliases (§5.2.6).
import { compareText } from "@/lib/site-format";
import type { Story } from "./types";

const STOP_WORDS = new Set(["the", "a", "an", "of", "and", "in", "on", "at", "to"]);

/** Text as search words: accents, apostrophes, case and punctuation removed, then the little words dropped. */
export function searchWords(text: string): string[] {
  const plain = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['‘’ʼ`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ");
  return plain.split(" ").filter((word) => word && !STOP_WORDS.has(word));
}

/** A word with a final "s" dropped, so "widows" and "widow", "dreams" and "dream" count as one word. */
export const singular = (word: string): string => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word);

export interface SearchEntry {
  story: Story;
  /** Each search key (title, aliases, people's names, a translated title) as its search words. */
  keys: string[][];
}

export function searchIndex(stories: readonly Story[], translatedTitles: ReadonlyMap<string, string> = new Map()): SearchEntry[] {
  return stories
    .filter((story) => !story.retired)
    .map((story) => {
      const texts = [story.title, ...story.aliases, ...story.people.map((person) => person.name)];
      const translated = translatedTitles.get(story.id);
      if (translated) texts.push(translated);
      return { story, keys: texts.map(searchWords).filter((words) => words.length) };
    });
}

/** Edits between two words, counting a swap of neighbours as one (optimal string alignment). */
export function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  }
  return rows[a.length][b.length];
}

const closeEnough = (typed: string, word: string): boolean => {
  if (typed.length < 5) return false;
  const allowed = typed.length >= 8 ? 2 : 1;
  return Math.abs(typed.length - word.length) <= allowed && editDistance(typed, word) <= allowed;
};

function keyScore(typed: string[], key: string[]): number {
  const text = typed.join(" "), keyText = key.join(" ");
  if (text === keyText) return 100;
  if (keyText.startsWith(text)) return 80;
  if (typed.every((word) => key.some((keyWord) => keyWord.startsWith(word)))) return 60;
  if (typed.every((word) => key.some((keyWord) => keyWord.startsWith(word) || closeEnough(word, keyWord)))) return 40;
  return 0;
}

export interface Suggestion {
  story: Story;
  score: number;
}

export const MIN_SEARCH_LETTERS = 2;
export const MAX_SUGGESTIONS = 6;

/** Whether the text is enough to search on: two letters or more once the little words are dropped ("the" is not). */
export const isSearchable = (text: string): boolean => searchWords(text).join("").length >= MIN_SEARCH_LETTERS;

/** The best few stories for what the player typed, best first; ties go to the better-known story, then the title. */
export function suggest(index: readonly SearchEntry[], text: string): Suggestion[] {
  if (!isSearchable(text)) return [];
  const typed = searchWords(text);
  return index
    .map(({ story, keys }) => ({ story, score: Math.max(0, ...keys.map((key) => keyScore(typed, key))) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.story.tier - b.story.tier || compareText(a.story.title, b.story.title))
    .slice(0, MAX_SUGGESTIONS);
}

/** The puzzle's clue words, as singular search words. */
export const clueWords = (story: Story): Set<string> => new Set(story.emoji.flatMap(([, word]) => searchWords(word).map(singular)));

/** How many of the puzzle's clue words a title or alias spells out (§5.2.6: at most one for tiers 2 and 3). */
export function clueWordsIn(label: string, story: Story): string[] {
  const clues = clueWords(story);
  return [...new Set(searchWords(label).map(singular))].filter((word) => clues.has(word));
}
