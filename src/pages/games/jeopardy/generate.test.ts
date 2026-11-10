// Bible Jeopardy's board (design 3.3–3.7, 13) with a seeded random function and the fixture bank.
import { THEME_CATEGORIES, bookCategories } from "./categories";
import { boardSettings, BOOKS, question, questionsFor, type Spec } from "./bank.test.fixture";
import {
  boardIds, buildBoard, drawFinal, drawTieBreaker, fillColumn, idOf, levelOf, makeDeck, pickOne, placeDailyDouble, redrawColumn, seeded, swapColumn, swapFinal,
} from "./generate";
import { LADDERS, VALUES, type Board, type Level } from "./model";

const ALL = [...THEME_CATEGORIES, ...bookCategories(BOOKS)];
const RANK: Record<Level, number> = { easy: 0, medium: 1, hard: 2 };
const deckOf = (specs?: Spec[], over = {}, seen: string[] = []) => makeDeck(questionsFor(specs), ALL, boardSettings(over), seen);

function expectSound(board: Board) {
  const ids = [...boardIds(board.columns)];
  if (board.final) ids.push(board.final.q.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const column of board.columns) {
    expect(column.tiles.map((tile) => tile.value)).toEqual([...VALUES]);
    const ranks = column.tiles.map((tile) => RANK[tile.level]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  }
}

describe("buildBoard", () => {
  it("makes columns of five tiles, 100 to 500, that never get easier going down, with no question twice", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const board = buildBoard(deckOf(undefined, { columns: 5 }), [], seeded(seed));
      expect(board.columns).toHaveLength(5);
      expectSound(board);
      expect(board.final).not.toBeNull();
      expect(board.columns.map((column) => column.category)).not.toContain(board.final!.category);
    }
  });

  it("follows the Standard ladder exactly when every level has questions", () => {
    const board = buildBoard(deckOf(undefined, { columns: 4 }), [], seeded(7));
    for (const column of board.columns) expect(column.tiles.map((tile) => tile.level)).toEqual(LADDERS.standard.rows);
    expect(board.final!.level).toBe("hard");
    expect(board.notices).toEqual([]);
  });

  it("uses the chosen categories in the chosen order, filling the rest by Surprise me", () => {
    const board = buildBoard(deckOf(undefined, { columns: 3 }), ["theme:ruth", "book:GEN"], seeded(3));
    expect(board.columns.map((column) => column.category).slice(0, 2)).toEqual(["theme:ruth", "book:GEN"]);
    expect(board.columns).toHaveLength(3);
    expect(board.columns[2].category.startsWith("theme:")).toBe(true);
  });

  it("gives the same board for the same seed", () => {
    const questions = questionsFor();
    const a = buildBoard(makeDeck(questions, ALL, boardSettings()), [], seeded(42));
    const b = buildBoard(makeDeck(questions, ALL, boardSettings()), [], seeded(42));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("fills the scarcest column first, so a small category keeps the questions it shares with a big one", () => {
    // Every Ruth question also names David, and David has eight more of his own.
    const shared = (["easy", "easy", "easy", "medium", "medium", "medium", "hard", "hard"] as const).map((level) => question("Ruth", level, "RUT", "OT", { people: ["Ruth", "David"] }));
    const own = (["easy", "easy", "easy", "medium", "medium", "medium", "hard", "hard"] as const).map((level) => question("David", level, "1SA", "OT"));
    const pool = [...shared, ...own, ...questionsFor([{ person: "Peter", book: "MAT", testament: "NT" }])];
    for (let seed = 1; seed <= 60; seed++) {
      const deck = makeDeck(pool, ALL, boardSettings({ columns: 3, final: false }));
      const board = buildBoard(deck, ["theme:david", "theme:ruth"], seeded(seed));
      expect(board.columns.map((column) => column.category).slice(0, 2)).toEqual(["theme:david", "theme:ruth"]);
      expect(board.notices).toEqual([]);
    }
  });

  it("drops a category that cannot reach five rows and says how many columns are left", () => {
    const deck = deckOf([{ person: "Moses", book: "EXO", testament: "OT" }, { person: "Peter", book: "MAT", testament: "NT" }], { columns: 6 });
    const board = buildBoard(deck, [], seeded(1));
    expect(board.columns.length).toBeLessThan(6);
    expect(board.notices.some((notice) => notice.startsWith("Only "))).toBe(true);
  });
});

describe("pickOne and fillColumn", () => {
  const easyAndHard = [question("Moses", "easy", "EXO", "OT"), question("Moses", "hard", "EXO", "OT")];
  it("takes the nearest level when the target has run out", () => {
    expect(levelOf(pickOne(easyAndHard, "medium", new Set(), new Map(), seeded(1))!)).toBe("easy");
    const easyAndMedium = [question("Moses", "easy", "EXO", "OT"), question("Moses", "medium", "EXO", "OT")];
    expect(levelOf(pickOne(easyAndMedium, "hard", new Set(), new Map(), seeded(1))!)).toBe("medium");
    expect(levelOf(pickOne(easyAndHard, "easy", new Set([idOf(easyAndHard[0])]), new Map(), seeded(1))!)).toBe("hard");
  });

  it("avoids recently played questions until only those are left, then takes the one played longest ago", () => {
    const qs = Array.from({ length: 8 }, () => question("Moses", "easy", "EXO", "OT"));
    const seen = new Map(qs.slice(0, 6).map((q, index) => [idOf(q), index]));
    const picked = fillColumn(qs, ["easy", "easy", "easy", "easy", "easy"], new Set(), seen, seeded(5))!.picked;
    expect(picked.slice(0, 2).map(idOf).sort()).toEqual([idOf(qs[6]), idOf(qs[7])].sort());
    expect(picked.slice(2).map(idOf)).toEqual([idOf(qs[0]), idOf(qs[1]), idOf(qs[2])]);
    const allSeen = new Map(qs.map((q, index) => [idOf(q), 10 - index]));
    expect(idOf(pickOne(qs, "easy", new Set(), allSeen, seeded(1))!)).toBe(idOf(qs[7]));
  });

  it("returns null when a column cannot reach five", () => {
    expect(fillColumn(easyAndHard, LADDERS.standard.rows, new Set(), new Map(), seeded(1))).toBeNull();
  });

  it("sorts a column that fell back so a lower value is never harder", () => {
    const qs = [question("Moses", "hard", "EXO", "OT"), ...Array.from({ length: 4 }, () => question("Moses", "easy", "EXO", "OT"))];
    const result = fillColumn(qs, LADDERS.challenging.rows, new Set(), new Map(), seeded(2))!;
    expect(result.picked.map(levelOf)).toEqual(["easy", "easy", "easy", "easy", "hard"]);
    expect(result.fellBack).toBeGreaterThan(0);
  });
});

describe("Daily Double and Final", () => {
  it("lands only in rows 300–500, about 1 : 2 : 2", () => {
    const random = seeded(99);
    const rows = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5000; i++) {
      const spot = placeDailyDouble(5, random);
      expect(spot.col).toBeGreaterThanOrEqual(0);
      expect(spot.col).toBeLessThan(5);
      rows[spot.row]++;
    }
    expect(rows[0] + rows[1]).toBe(0);
    expect(rows[2] / 5000).toBeCloseTo(0.2, 1);
    expect(rows[3] / 5000).toBeCloseTo(0.4, 1);
    expect(rows[4] / 5000).toBeCloseTo(0.4, 1);
  });

  it("has no Daily Double or Final when they are switched off", () => {
    const board = buildBoard(deckOf(undefined, { dailyDouble: false, final: false }), [], seeded(4));
    expect(board.dailyDouble).toBeNull();
    expect(board.final).toBeNull();
  });

  it("draws the Final from a group not on the board, never a tile's question", () => {
    const deck = deckOf(undefined, { columns: 3 });
    const board = buildBoard(deck, [], seeded(8));
    const final = drawFinal(deck, board.columns, boardIds(board.columns), seeded(9))!;
    const groups = board.columns.map((column) => deck.byId.get(column.category)!.group);
    expect(groups).not.toContain(deck.byId.get(final.category)!.group);
    expect(boardIds(board.columns).has(final.q.id)).toBe(false);
    const swapped = swapFinal(deck, board, seeded(10));
    expect(swapped.final!.category).not.toBe(board.final!.category);
  });

  it("never draws a second tie-breaker with the first one's question", () => {
    const deck = deckOf(undefined, { columns: 3 });
    const board = buildBoard(deck, [], seeded(30));
    for (let seed = 0; seed < 40; seed++) {
      const first = drawTieBreaker(deck, board, seeded(seed))!;
      expect(drawTieBreaker(deck, board, seeded(seed), first)?.q.id).not.toBe(first.q.id);
    }
  });
});

describe("swaps and redraws", () => {
  it("swapping a column keeps every other tile, and the Daily Double unless it was in that column", () => {
    const deck = deckOf(undefined, { columns: 3 });
    const board = { ...buildBoard(deck, [], seeded(11)), dailyDouble: { col: 0, row: 4 } };
    const swapped = swapColumn(deck, board, 1, null, seeded(12));
    expect(swapped.columns[0]).toEqual(board.columns[0]);
    expect(swapped.columns[2]).toEqual(board.columns[2]);
    expect(swapped.columns[1].category).not.toBe(board.columns[1].category);
    expect(swapped.dailyDouble).toEqual({ col: 0, row: 4 });
    expectSound(swapped);
    const moved = swapColumn(deck, board, 0, "book:ACT", seeded(13));
    expect(moved.columns[0].category).toBe("book:ACT");
    expect(moved.dailyDouble!.col).toBe(0);
    expect(moved.dailyDouble!.row).toBeGreaterThanOrEqual(2);
  });

  it("never swaps the Final's category onto the board (3.6)", () => {
    const deck = deckOf(undefined, { columns: 3 });
    const board = buildBoard(deck, [], seeded(31));
    for (let seed = 0; seed < 40; seed++) {
      expect(swapColumn(deck, board, seed % 3, null, seeded(seed)).columns.map((column) => column.category)).not.toContain(board.final!.category);
    }
  });

  it("New questions keeps the category and draws different questions where it can", () => {
    const deck = deckOf(undefined, { columns: 3 });
    const board = buildBoard(deck, [], seeded(14));
    const redrawn = redrawColumn(deck, board, 2, seeded(15));
    expect(redrawn.columns[2].category).toBe(board.columns[2].category);
    const before = new Set(board.columns[2].tiles.map((tile) => tile.q.id));
    expect(redrawn.columns[2].tiles.some((tile) => before.has(tile.q.id))).toBe(false);
    expect(redrawn.columns[0]).toEqual(board.columns[0]);
  });
});
