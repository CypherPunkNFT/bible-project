// Bible Jeopardy's board link (design 7.2, 13).
import { THEME_CATEGORIES, bookCategories } from "./categories";
import { boardSettings, BOOKS, questionsFor } from "./bank.test.fixture";
import { buildBoard, idOf, makeDeck, seeded } from "./generate";
import { boardFromLink, decodeBoard, encodeBoard } from "./link";

const ALL = [...THEME_CATEGORIES, ...bookCategories(BOOKS)];
const questions = questionsFor();

describe("board links", () => {
  it("encode then decode gives the same board", () => {
    const deck = makeDeck(questions, ALL, boardSettings({ columns: 4, difficulty: "gentle", choices: true, testament: "" }));
    const board = buildBoard(deck, ["book:GEN"], seeded(21));
    const text = encodeBoard(board, "en");
    expect(text.length).toBeLessThan(700);
    const link = decodeBoard(text)!;
    expect(link.settings).toEqual(board.settings);
    expect(link.dailyDouble).toEqual(board.dailyDouble);
    const reopened = boardFromLink(makeDeck(questions, ALL, link.settings), link, "en", seeded(1));
    expect(reopened.columns.map((column) => column.tiles.map((tile) => tile.q.id))).toEqual(board.columns.map((column) => column.tiles.map((tile) => tile.q.id)));
    expect(reopened.columns.map((column) => column.category)).toEqual(board.columns.map((column) => column.category));
    expect(reopened.final!.q.id).toBe(board.final!.q.id);
    expect(reopened.notices).toEqual([]);
  });

  it("redraws a question no longer in the bank for the same category and counts it", () => {
    const deck = makeDeck(questions, ALL, boardSettings({ columns: 3 }));
    const board = buildBoard(deck, [], seeded(22));
    const gone = board.columns[1].tiles[2].q.id;
    const link = decodeBoard(encodeBoard(board, "en"))!;
    const fewer = questions.filter((q) => idOf(q) !== gone);
    const reopened = boardFromLink(makeDeck(fewer, ALL, link.settings), link, "en", seeded(2));
    expect(reopened.columns[1].category).toBe(board.columns[1].category);
    expect(reopened.columns[1].tiles.map((tile) => tile.q.id)).not.toContain(gone);
    const idsOf = (column: { tiles: { q: { id: string } }[] }) => column.tiles.map((tile) => tile.q.id);
    expect(idsOf(reopened.columns[0])).toEqual(idsOf(board.columns[0]));
    expect(reopened.notices).toEqual(["1 question is no longer in the bank and was replaced."]);
  });

  it("keeps the Daily Double on its column when an earlier column from the link is left out", () => {
    const deck = makeDeck(questions, ALL, boardSettings({ columns: 4 }));
    const board = { ...buildBoard(deck, [], seeded(24)), dailyDouble: { col: 2, row: 3 } };
    const link = decodeBoard(encodeBoard(board, "en"))!;
    const broken = { ...link, columns: [{ ...link.columns[0], category: "book:NOPE" }, ...link.columns.slice(1)] };
    const reopened = boardFromLink(makeDeck(questions, ALL, link.settings), broken, "en", seeded(4));
    expect(reopened.columns.map((column) => column.category)).toEqual(board.columns.slice(1).map((column) => column.category));
    expect(reopened.dailyDouble).toEqual({ col: 1, row: 3 });
  });

  it("a link made in another site language redraws with the same categories", () => {
    const deck = makeDeck(questions, ALL, boardSettings({ columns: 3 }));
    const board = buildBoard(deck, [], seeded(23));
    const link = decodeBoard(encodeBoard(board, "es"))!;
    const reopened = boardFromLink(makeDeck(questions, ALL, link.settings), link, "en", seeded(3));
    expect(reopened.columns.map((column) => column.category)).toEqual(board.columns.map((column) => column.category));
    expect(reopened.notices[0]).toMatch(/another site language/);
  });

  it("refuses malformed links", () => {
    const deck = makeDeck(questions, ALL, boardSettings({ columns: 3 }));
    const good = encodeBoard(buildBoard(deck, [], seeded(24)), "en");
    const [version, language, settings, body] = good.split(".");
    for (const bad of [
      "", "nonsense", `2.${language}.${settings}.${body}`, `${version}.EN!.${settings}.${body}`, `${version}.${language}.9s000b--1.${body}`,
      `${version}.${language}.${settings}.${body.replace(/_[0-9a-f]{16}/, "_xyz")}`, `${version}.${language}.${settings}.${body.split("~").slice(1).join("~")}`,
      `${version}.${language}.${settings.slice(0, -1)}0.${body}`, `${good}.extra`,
    ]) expect(decodeBoard(bad)).toBeNull();
  });
});
