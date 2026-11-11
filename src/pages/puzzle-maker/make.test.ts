// Making sheets from a passage and a theme with the shared generator (design §2, §3, §9, §10), on the real Bible and
// clue files.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import clues from "@/data/crossword/clues.json";
import type { CluesFile } from "@/pages/games/crossword/game";
import { clueProblem } from "@/pages/games/crossword/themes";
import type { PlainBook } from "@/lib/types";
import { enumeration, makeFromPassage, makeFromTheme, passageCandidates, themeSearchWords, type PassageSource, type Sheet } from "./make";
import { passageWords, selectVerses } from "./passage";
import { DEFAULTS, SEARCH_GRID, type Settings } from "./settings";

const data = clues as unknown as CluesFile;
const book = (code: string) => JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as PlainBook;

function passage(code: string, name: string, chapter: number, endChapter = chapter): PassageSource {
  const verses = selectVerses(book(code), [{ chapter, verse: null, endChapter, endVerse: null }]);
  return { code, name, verses, words: passageWords(verses, 17) };
}

const settings = (over: Partial<Settings>): Settings => ({ ...DEFAULTS, seed: 1, ...over });

/** Every word reads the same from its squares as its answer. */
function expectReadable(sheet: Sheet) {
  if (sheet.kind === "search") {
    for (const word of sheet.words) expect(word.cells.map((i) => sheet.grid[i]).join("")).toBe(word.written.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/[^A-Z]/g, ""));
  } else {
    for (const clue of sheet.clues) expect(clue.cells.map((i) => sheet.cells[i]).join("")).toBe(clue.written.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/[^A-Z]/g, ""));
  }
}

describe("from a passage", () => {
  const psalm23 = passage("PSA", "Psalm", 23);
  const john3 = passage("JHN", "John", 3);

  it("hides the passage's key words in a word search of the chosen size, the same from the same seed", () => {
    const made = makeFromPassage(psalm23, settings({ kind: "search", size: "small" }), 7);
    expect(made.ok).toBe(true);
    if (!made.ok || made.sheet.kind !== "search") return;
    expect(made.sheet.width).toBe(SEARCH_GRID.small.side);
    expect(made.sheet.words.map((w) => w.written.toUpperCase())).toContain("SHEPHERD");
    expectReadable(made.sheet);
    expect(makeFromPassage(psalm23, settings({ kind: "search", size: "small" }), 7)).toEqual(made);
  });

  it("makes a crossword whose clues are the passage's verses, none giving any answer away", () => {
    const made = makeFromPassage(john3, settings({ kind: "cross", size: "medium", level: "medium" }), 3);
    expect(made.ok).toBe(true);
    if (!made.ok || made.sheet.kind !== "cross") return;
    expect(made.sheet.clues.length).toBeGreaterThanOrEqual(6);
    expectReadable(made.sheet);
    const answers = made.sheet.clues.map((c) => c.cells.map((i) => (made.sheet as Extract<Sheet, { kind: "cross" }>).cells[i]).join(""));
    for (const clue of made.sheet.clues) {
      expect(clue.clue).toContain("____");
      expect(clue.clue).toMatch(/\(John 3:\d+\)$/);
      expect(clue.verse?.href).toMatch(/^\/read\/bsb\/JHN\/3\?hl=\d+$/);
      for (const answer of answers) expect(clueProblem(answer, clue.clue)).toBeNull();
    }
    expect(made.sheet.bank).toEqual([]);
    expect(makeFromPassage(john3, settings({ kind: "cross", size: "medium", level: "medium" }), 3)).toEqual(made);
  });

  it("prints a word bank on Easy and leaves the references off on Hard", () => {
    const easy = makeFromPassage(john3, settings({ kind: "cross", level: "easy" }), 5);
    const hard = makeFromPassage(john3, settings({ kind: "cross", level: "hard" }), 5);
    if (!easy.ok || easy.sheet.kind !== "cross" || !hard.ok || hard.sheet.kind !== "cross") throw new Error("John 3 should make crosswords");
    expect(easy.sheet.bank).toHaveLength(easy.sheet.clues.length);
    expect([...easy.sheet.bank].sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))).toEqual(easy.sheet.bank);
    expect(hard.sheet.clues.every((c) => !/\(John 3:\d+\)/.test(c.clue))).toBe(true);
  });

  it("never offers a candidate whose clue holds another candidate's answer", () => {
    const pool = passageCandidates(john3, 13, 48, true);
    for (const a of pool) for (const b of pool) if (a !== b) expect(clueProblem(b.word.grid, a.clue)).toBeNull();
  });

  it("says so when a passage is too short for a puzzle", () => {
    const one = { ...psalm23, verses: psalm23.verses.slice(0, 1), words: passageWords(psalm23.verses.slice(0, 1), 13).slice(0, 2) };
    expect(makeFromPassage(one, settings({ kind: "search" }), 1)).toEqual({ ok: false, problem: "too-few" });
    expect(makeFromPassage(one, settings({ kind: "cross" }), 1)).toEqual({ ok: false, problem: "too-few" });
  });
});

describe("from a theme", () => {
  it("makes a theme word search with words that fit its grid, topped up when the level has too few", () => {
    const { words } = themeSearchWords(data.entries, { theme: "jesus" }, "hard", "large", 4);
    expect(words).toHaveLength(SEARCH_GRID.large.target);
    expect(words.every((e) => e.a.length <= SEARCH_GRID.large.side)).toBe(true);
    const made = makeFromTheme(data, settings({ from: "theme", theme: "jesus", kind: "search", size: "large", level: "hard" }), 4);
    expect(made.ok).toBe(true);
    if (made.ok) expectReadable(made.sheet);
  });

  it("makes a theme crossword the game's way, the same from the same seed", () => {
    const choice = settings({ from: "theme", theme: "exodus", kind: "cross", size: "small", level: "medium" });
    const made = makeFromTheme(data, choice, 12);
    expect(made.ok).toBe(true);
    if (!made.ok || made.sheet.kind !== "cross") return;
    expect(made.sheet.width).toBeLessThanOrEqual(9);
    expectReadable(made.sheet);
    expect(makeFromTheme(data, choice, 12)).toEqual(made);
  });

  it("names the size or level it used when the chosen one has too few clues", () => {
    const made = makeFromTheme(data, settings({ from: "theme", theme: "people", kind: "cross", size: "large", level: "easy" }), 2);
    expect(made.ok).toBe(true);
    if (made.ok) expect(made.notes).toContainEqual(expect.objectContaining({ kind: "fitted" }));
  });
});

describe("enumeration", () => {
  it("counts the letters of each part", () => {
    expect(enumeration("Beer-sheba")).toBe("(4-5)");
    expect(enumeration("John the Baptist")).toBe("(4,3,7)");
    expect(enumeration("Moses")).toBe("");
  });
});
