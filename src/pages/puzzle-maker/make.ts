// Making the sheet (design §2, §3 and §10): the words from a passage or theme, laid out by the site's one puzzle
// generator (src/lib/puzzles), as one shape the page draws whether it is a word search or a crossword. Pure: the same
// words, settings and seed give the same sheet on every machine, because the crossword's tries are counted, not timed.
import { cellNumbers, generateCrossword, generateWordSearch, seededRandom, shuffled, wordCells, wordSearchCells,
  type WordSearchDirections } from "@/lib/puzzles";
import { candidates, fitSpec, toPuzzle, verseHref, verseLabel, type CluesFile, type Layout } from "@/pages/games/crossword/game";
import { clueProblem, inSource, LEVEL_TIER, MIN_SHARE, SIZE_GRID, type ClueEntry, type Source } from "@/pages/games/crossword/themes";
import { searchWords, verseClue, type PassageVerse, type PassageWord } from "./passage";
import { SEARCH_GRID, type Level, type Settings, type Size } from "./settings";

export interface SearchWord { written: string; cells: number[] }

export interface CrossClue {
  number: number;
  direction: "across" | "down";
  clue: string;
  /** The answer as written, e.g. "Beer-sheba". */
  written: string;
  /** "(4-5)" for an answer of more than one part, else "". */
  enumeration: string;
  cells: number[];
  /** The verse the clue quotes, when it names one. */
  verse: { label: string; href: string } | null;
}

export type Sheet =
  | { kind: "search"; width: number; height: number; grid: string[]; words: SearchWord[]; skipped: number }
  | { kind: "cross"; width: number; height: number; cells: (string | null)[]; numbers: number[]; clues: CrossClue[]; bank: string[] };

export type Made =
  | { ok: true; sheet: Sheet; notes: Note[] }
  | { ok: false; problem: "too-few" | "no-layout" };

/** Something the page tells the visitor about the sheet it made. */
export type Note =
  | { kind: "skipped"; count: number }
  | { kind: "topped-up" }
  | { kind: "fitted"; size: Size; level: Level };

/** The fewest words a word search is made with. */
export const MIN_SEARCH_WORDS = 4;
/** Seeds tried for a crossword before saying none could be made (the game tries as many). */
const SEEDS = 6;
/** Crossword tries per seed: counted, so every machine makes the same one. */
const ATTEMPTS = 12;
/** Passage candidates handed to the generator, per word aimed for. */
const CANDIDATES_PER_WORD = 4;

const DIRECTIONS: Record<Level, WordSearchDirections> = { easy: "forward", medium: "diagonal", hard: "all" };

/** "(4-5)" for "Beer-sheba", "(4,3,7)" for "John the Baptist", "" for one word. */
export function enumeration(written: string): string {
  const parts = written.split(/([\s-]+)/).filter(Boolean);
  if (parts.length < 2) return "";
  return `(${parts.map((part) => (/^[\s-]+$/.test(part) ? (part.includes("-") ? "-" : ",") : String(part.replace(/[^A-Za-z]/g, "").length))).join("")})`;
}

function wordSearch(words: readonly { grid: string; written: string }[], size: Size, level: Level, seed: number): Made {
  if (words.length < MIN_SEARCH_WORDS) return { ok: false, problem: "too-few" };
  const { side } = SEARCH_GRID[size];
  const made = generateWordSearch(words.map((word) => word.grid), { width: side, directions: DIRECTIONS[level], random: seededRandom(seed) });
  const placed = made.placed.map((word) => ({ written: words[word.index].written, cells: wordSearchCells(made, word) }));
  const notes: Note[] = made.skipped.length ? [{ kind: "skipped", count: made.skipped.length }] : [];
  return { ok: true, sheet: { kind: "search", width: made.width, height: made.height, grid: made.grid, words: placed, skipped: made.skipped.length }, notes };
}

/** The word bank an Easy crossword prints: its answers in A–Z order. */
const bankOf = (written: readonly string[]) => [...written].sort((a, b) => (a.toUpperCase() < b.toUpperCase() ? -1 : a.toUpperCase() > b.toUpperCase() ? 1 : 0));

// ---- From a passage ----------------------------------------------------------------------------------------------

export interface PassageSource { code: string; name: string; verses: readonly PassageVerse[]; words: readonly PassageWord[] }

/** True when the clue gives any of the answers away by the game's own rule (a word starting with it, or most of it). */
const givesAway = (clue: string, answers: Iterable<string>) => {
  for (const answer of answers) if (clueProblem(answer, clue)) return true;
  return false;
};

interface PassageCandidate { word: PassageWord; clue: string; verse: PassageVerse }

/** Crossword candidates from a passage, as the game chooses its own (design §10): each word's first verse whose clue is
 *  clean, no clue holding another candidate's answer, and no answer in an earlier clue. */
export function passageCandidates(source: PassageSource, max: number, limit: number, withReference: boolean): PassageCandidate[] {
  const chosen: PassageCandidate[] = [];
  const answers = new Set<string>();
  for (const word of source.words) {
    if (chosen.length >= limit) break;
    if (word.grid.length > max || chosen.some((other) => givesAway(other.clue, [word.grid]))) continue;
    for (const at of word.verses) {
      const verse = source.verses[at];
      const clue = verseClue(verse, word.grid, withReference ? `${source.name} ${verse.chapter}:${verse.verse}` : null);
      if (!clue || givesAway(clue, answers)) continue;
      chosen.push({ word, clue, verse });
      answers.add(word.grid);
      break;
    }
  }
  return chosen;
}

export function makeFromPassage(source: PassageSource, settings: Settings, seed: number): Made {
  if (settings.kind === "search") return wordSearch(searchWords(source.words, SEARCH_GRID[settings.size].target), settings.size, settings.level, seed);
  const { max, target } = SIZE_GRID[settings.size];
  const pool = passageCandidates(source, max, target * CANDIDATES_PER_WORD, settings.level !== "hard");
  if (pool.length < 3) return { ok: false, problem: "too-few" };
  for (let attempt = 0; attempt < SEEDS; attempt++) {
    const random = seededRandom(seed + attempt * 7919);
    const order = shuffled(pool, random);
    const made = generateCrossword(order.map((c) => c.word.grid), { maxWidth: max, target, random, attempts: ATTEMPTS, timeBudgetMs: Infinity });
    if (!made) continue;
    const clues = made.words.map((w): CrossClue => {
      const { word, clue, verse } = order[w.index];
      return {
        number: w.number, direction: w.direction, clue, written: word.written, enumeration: enumeration(word.written),
        cells: wordCells(made, w),
        verse: { label: `${source.name} ${verse.chapter}:${verse.verse}`, href: `/read/bsb/${source.code}/${verse.chapter}?hl=${verse.verse}` },
      };
    });
    return { ok: true, sheet: { kind: "cross", width: made.width, height: made.height, cells: made.cells, numbers: cellNumbers(made), clues, bank: settings.level === "easy" ? bankOf(clues.map((c) => c.written)) : [] }, notes: [] };
  }
  return { ok: false, problem: "no-layout" };
}

// ---- From a theme ------------------------------------------------------------------------------------------------

/** Word-search words from a theme (design §10): distinct answers that fit the grid, at the level's tier, topped up from
 *  the next tiers when the level alone has too few. */
export function themeSearchWords(entries: readonly ClueEntry[], source: Source, level: Level, size: Size, seed: number): { words: ClueEntry[]; toppedUp: boolean } {
  const { side, target } = SEARCH_GRID[size];
  const random = seededRandom(seed ^ 0x5bd1e995);
  const fits = entries.filter((e) => e.a.length >= 3 && e.a.length <= side && inSource(e, source));
  const easier = shuffled(fits.filter((e) => e.t <= LEVEL_TIER[level]), random);
  const harder = shuffled(fits.filter((e) => e.t > LEVEL_TIER[level]), random);
  const chosen: ClueEntry[] = [];
  let toppedUp = false;
  for (const entry of [...easier, ...harder]) {
    if (chosen.length >= target) break;
    if (chosen.some((other) => other.a.includes(entry.a) || entry.a.includes(other.a))) continue;
    if (entry.t > LEVEL_TIER[level]) toppedUp = true;
    chosen.push(entry);
  }
  return { words: chosen, toppedUp };
}

/** A theme crossword, laid out as the game lays one out (its candidates and its puzzle), with counted tries. */
export function themeCrossword(data: CluesFile, source: Source, settings: Settings, seed: number): Made {
  const spec = fitSpec(data, { source, level: settings.level, size: settings.size });
  const { max, target } = SIZE_GRID[spec.size];
  for (let attempt = 0; attempt < SEEDS; attempt++) {
    const random = seededRandom(seed + attempt * 7919);
    const picked = candidates(data, spec, random);
    const made = generateCrossword(picked.map((e) => data.entries[e].a), { maxWidth: max, target, random, minWords: Math.ceil(target * MIN_SHARE), attempts: ATTEMPTS, timeBudgetMs: Infinity });
    if (!made) continue;
    const layout: Layout = { width: made.width, height: made.height, words: made.words.map((w) => ({ e: picked[w.index], row: w.row, col: w.col, d: w.direction })) };
    const puzzle = toPuzzle(data, layout);
    if (!puzzle) continue;
    const clues = puzzle.words.map((w): CrossClue => ({
      number: w.number, direction: w.direction, clue: w.entry.c, written: w.entry.w, enumeration: enumeration(w.entry.w), cells: w.cells,
      verse: w.entry.r !== null ? { label: verseLabel(data, w.entry.r), href: verseHref(data, w.entry.r) } : null,
    }));
    const notes: Note[] = spec.size !== settings.size || spec.level !== settings.level ? [{ kind: "fitted", size: spec.size, level: spec.level }] : [];
    return { ok: true, sheet: { kind: "cross", width: puzzle.width, height: puzzle.height, cells: puzzle.cells, numbers: puzzle.numbers, clues, bank: spec.level === "easy" ? bankOf(clues.map((c) => c.written)) : [] }, notes };
  }
  return { ok: false, problem: "no-layout" };
}

export function makeFromTheme(data: CluesFile, settings: Settings, seed: number): Made {
  const source: Source = { theme: settings.theme };
  if (settings.kind === "cross") return themeCrossword(data, source, settings, seed);
  const { words, toppedUp } = themeSearchWords(data.entries, source, settings.level, settings.size, seed);
  const made = wordSearch(words.map((e) => ({ grid: e.a, written: e.w })), settings.size, settings.level, seed);
  return made.ok && toppedUp ? { ...made, notes: [{ kind: "topped-up" }, ...made.notes] } : made;
}
