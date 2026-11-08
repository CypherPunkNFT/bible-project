import fs from "node:fs";
import path from "node:path";
import type { BankQuestion } from "../data";
import { isQuestionList, LIMITS } from "./protocol";
import { DEFAULT_FILTERS, drawGame, freshCount, isPlayable, poolOf, questionId, toQuizQuestion, trimReference } from "./pick";

const bankFile = path.resolve(__dirname, "../../../data/questions/bank.json");
const bank: BankQuestion[] | null = fs.existsSync(bankFile) ? (JSON.parse(fs.readFileSync(bankFile, "utf8")) as { questions: BankQuestion[] }).questions : null;

const q = (patch: Partial<BankQuestion> = {}): BankQuestion => ({
  question: "Who built the ark?", answer: "Noah", answer_choice: "Noah", options: ["Moses", "Noah", "Abraham", "David"], reference: "Genesis 6:14",
  kind: "trivia", tradition: null, collection: "c1", lesson: null, books: ["GEN"], testament: "OT", topic: null,
  link: { book: "GEN", chapter: 6, verse: 14 }, standalone: true, level: "easy", children: true, child: null, ...patch,
});

let seed = 1;
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe("picking questions", () => {
  it("keeps only questions that stand on a projector", () => {
    expect(isPlayable(q())).toBe(true);
    expect(isPlayable(q({ standalone: false }))).toBe(false);
    expect(isPlayable(q({ standalone: false, lead_in: { question: "Who was his father?", answer: "Lamech" } }))).toBe(true);
    expect(isPlayable(q({ standalone: false, lead_in: { question: "x".repeat(350), answer: "y".repeat(60) } }))).toBe(false);
    expect(isPlayable(q({ question: "In this story, who built the ark?" }))).toBe(false);
    expect(isPlayable(q({ options: ["Moses", "Noah", "All of the above", "David"] }))).toBe(false);
    expect(isPlayable(q({ options: ["Moses", "Noah", "Abraham"] }))).toBe(false);
  });

  it("filters by kind, level, children, testament and book", () => {
    const all = [q(), q({ kind: "catechism", question: "a" }), q({ level: "hard", question: "b" }), q({ children: false, question: "c" }), q({ testament: "NT", books: ["MAT"], question: "d" })];
    expect(poolOf(all, DEFAULT_FILTERS)).toHaveLength(4);
    expect(poolOf(all, { ...DEFAULT_FILTERS, level: "hard" })).toHaveLength(1);
    expect(poolOf(all, { ...DEFAULT_FILTERS, children: true })).toHaveLength(3);
    expect(poolOf(all, { ...DEFAULT_FILTERS, testament: "NT" })).toHaveLength(1);
    expect(poolOf(all, { ...DEFAULT_FILTERS, book: "MAT" })).toHaveLength(1);
    expect(poolOf(all, DEFAULT_FILTERS, (x) => x.question === "b")).toHaveLength(1);
  });

  it("shuffles the options and keeps the right answer marked", () => {
    for (let i = 0; i < 20; i++) {
      const out = toQuizQuestion(q(), false, random);
      expect(out.options[out.correct]).toBe("Noah");
      expect([...out.options].sort()).toEqual(["Abraham", "David", "Moses", "Noah"]);
    }
  });

  it("swaps in the children's wording when asked", () => {
    const child = { question: "Who made a big boat?", answer: "Noah", options: ["Noah", "Jonah", "Peter", "Paul"] };
    const out = toQuizQuestion(q({ child }), true, random);
    expect(out.text).toBe("Who made a big boat?");
    expect(out.options[out.correct]).toBe("Noah");
    expect(out.options).toContain("Jonah");
  });

  it("trims long references to 160 characters", () => {
    expect(trimReference("Genesis 1:1")).toBe("Genesis 1:1");
    const long = trimReference("Genesis 1:1; ".repeat(40))!;
    expect(long.length).toBeLessThanOrEqual(LIMITS.reference);
    expect(long.endsWith("…")).toBe(true);
  });

  it("orders a mixed game easy to hard and never repeats a used question", () => {
    const pool = ["hard", "easy", "medium", "easy", "hard", "medium"].map((level, i) => q({ level: level as BankQuestion["level"], question: `Q${i}` }));
    const game = drawGame(pool, 6, { level: "mixed", children: false }, [], random);
    const levelOf = (id: string) => pool.find((p) => questionId(p) === id)!.level;
    expect(game.map((g) => levelOf(g.id))).toEqual(["easy", "easy", "medium", "medium", "hard", "hard"]);
    const used = game.slice(0, 4).map((g) => g.id);
    const again = drawGame(pool, 6, { level: "mixed", children: false }, used, random);
    expect(again).toHaveLength(2);
    expect(again.some((g) => used.includes(g.id))).toBe(false);
    expect(freshCount(pool, used)).toBe(2);
  });

  it.runIf(bank)("gives every question in the real bank its own id, and draws games the room accepts", () => {
    const ids = new Set(bank!.map(questionId));
    expect(ids.size).toBe(bank!.length);
    const pool = poolOf(bank!, DEFAULT_FILTERS);
    expect(pool.length).toBeGreaterThan(5000);
    const children = poolOf(bank!, { ...DEFAULT_FILTERS, children: true });
    for (const [source, kids] of [[pool, false], [children, true]] as const) {
      const game = drawGame(source, 30, { level: "mixed", children: kids }, [], random);
      expect(game).toHaveLength(30);
      expect(isQuestionList(game)).toBe(true);
    }
  });
});
