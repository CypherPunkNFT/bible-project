// Bible Jeopardy's categories and pool (design 3.2, 3.5, 13), on the fixture bank and once against the real bank.
import fs from "node:fs";
import path from "node:path";
import type { QuestionBank } from "@/lib/data";
import type { TestQuestion } from "../../questions/test/engine";
import { boardSettings, BOOKS, question, questionsFor } from "./bank.test.fixture";
import {
  MIN_CANDIDATES, THEME_CATEGORIES, bookCategories, limitsOf, poolFor, shownText, surprise, visibleCategories,
} from "./categories";
import { buildBoard, makeDeck, seeded } from "./generate";

const ALL = [...THEME_CATEGORIES, ...bookCategories(BOOKS)];

describe("Surprise me", () => {
  it("takes at most one theme per group and, on five or six columns, at most two per shelf", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const columns = 5 + (seed % 2);
      const picked = surprise(THEME_CATEGORIES, columns, limitsOf([], columns), seeded(seed));
      expect(picked).toHaveLength(columns);
      expect(new Set(picked.map((category) => category.group)).size).toBe(columns);
      const shelves = new Map<string, number>();
      for (const category of picked) shelves.set(category.shelf, (shelves.get(category.shelf) ?? 0) + 1);
      expect(Math.max(...shelves.values())).toBeLessThanOrEqual(2);
    }
  });

  it("never draws books, nor a category or group already on the board", () => {
    const moses = THEME_CATEGORIES.find((category) => category.id === "theme:moses")!;
    for (let seed = 1; seed <= 50; seed++) {
      const picked = surprise(ALL, 4, limitsOf([moses], 5), seeded(seed));
      expect(picked.every((category) => category.kind === "theme" && category.group !== "leaders")).toBe(true);
    }
  });
});

describe("offered categories", () => {
  it("offers a category only with at least eight candidates", () => {
    const deck = makeDeck(questionsFor([
      { person: "Moses", book: "EXO", testament: "OT", easy: 3, medium: 2, hard: 2 },
      { person: "Peter", book: "MAT", testament: "NT", easy: 3, medium: 3, hard: 2 },
    ]), ALL, boardSettings());
    expect(MIN_CANDIDATES).toBe(8);
    expect(deck.offered.map((category) => category.id)).toContain("theme:peter");
    expect(deck.offered.map((category) => category.id)).not.toContain("theme:moses");
  });

  it("the testament filter narrows the pool and hides the other testament's books", () => {
    const questions = questionsFor();
    const pool = poolFor(questions, boardSettings({ testament: "NT" }));
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((q) => q.testament === "NT")).toBe(true);
    const visible = visibleCategories(ALL, { testament: "NT" }).filter((category) => category.kind === "book").map((category) => category.id);
    expect(visible).toEqual(["book:MAT", "book:ACT"]);
  });
});

describe("the pool", () => {
  const notClue = question("Moses", "easy", "EXO", "OT", { question: "Which of these is NOT one of the plagues?" });
  const ofThese = question("Moses", "easy", "EXO", "OT", { question: "Who of these led Israel out of Egypt?" });
  const plain = question("Moses", "easy", "EXO", "OT");

  it("leaves out clues that need their options only when the choices are hidden", () => {
    expect(poolFor([notClue, ofThese, plain], boardSettings({ choices: false }))).toEqual([plain]);
    expect(poolFor([notClue, ofThese, plain], boardSettings({ choices: true }))).toHaveLength(3);
  });

  it("leaves catechism out unless it is switched on", () => {
    const catechism = question("Moses", "easy", "EXO", "OT", { kind: "catechism" });
    expect(poolFor([catechism, plain], boardSettings())).toEqual([plain]);
    expect(poolFor([catechism, plain], boardSettings({ catechism: true }))).toHaveLength(2);
  });

  it("for children takes only children's questions, in their wording, and tests that wording", () => {
    const adult = question("Moses", "easy", "EXO", "OT", { children: false });
    const child = { question: "Which of these is NOT a plague? (for children)", answer: "Snow", options: ["Snow", "Frogs", "Flies", "Hail"] };
    const worded = question("Moses", "easy", "EXO", "OT", { child });
    expect(shownText(worded, true)).toBe(child.question);
    expect(shownText(worded, false)).toBe(worded.question);
    expect(poolFor([adult, worded, plain], boardSettings({ children: true, choices: false }))).toEqual([plain]);
    expect(poolFor([adult, worded, plain], boardSettings({ children: true, choices: true }))).toEqual([worded, plain]);
  });
});

const BANK = path.resolve(__dirname, "../../../../data/questions/bank.json");
describe.skipIf(!fs.existsSync(BANK))("against the real question bank", () => {
  it("offers at least 50 themes and fills 200 random six-column Standard boards without falling short", () => {
    const bank = JSON.parse(fs.readFileSync(BANK, "utf8")) as QuestionBank;
    const all = [...THEME_CATEGORIES, ...bookCategories(bank.books)];
    const deck = makeDeck(bank.questions as TestQuestion[], all, boardSettings({ columns: 6 }));
    expect(deck.offered.filter((category) => category.kind === "theme").length).toBeGreaterThanOrEqual(50);
    for (let seed = 1; seed <= 200; seed++) {
      const board = buildBoard(deck, [], seeded(seed));
      expect(board.columns).toHaveLength(6);
      expect(board.final).not.toBeNull();
      expect(board.notices.filter((notice) => notice.startsWith("Only "))).toEqual([]);
    }
  }, 120_000);
});
