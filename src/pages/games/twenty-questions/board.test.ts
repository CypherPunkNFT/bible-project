// The suspect board's sums (board.ts): cards keep their places, ruled-out cards are marked in place or dropped, and
// the next people fill the empty places.
import { describe, expect, it } from "vitest";
import { BOARD_CARDS, boardCards, dropOut } from "./board";

const people = (n: number, from = 0) => Array.from({ length: n }, (_, i) => from + i);

describe("boardCards", () => {
  it("draws the first cards from nothing, and no more than the board holds", () => {
    expect(boardCards([], [3, 1, 2])).toEqual([{ person: 3, out: false }, { person: 1, out: false }, { person: 2, out: false }]);
    expect(boardCards([], people(100))).toHaveLength(BOARD_CARDS);
  });

  it("keeps the places of those still possible, marks the ruled out in place and fills the room at the end", () => {
    const start = boardCards([], people(6));
    const next = boardCards(start, [0, 2, 4, 6, 7, 8, 9], true, 6);
    expect(next.map((c) => c.person)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(next.filter((c) => c.out).map((c) => c.person)).toEqual([1, 3, 5]);
    expect(next.filter((c) => !c.out)).toHaveLength(6);
  });

  it("drops the ruled out at once when asked (reduced motion), and never resurrects one", () => {
    const start = boardCards([], people(4));
    const next = boardCards(start, [0, 2], false, 4);
    expect(next.map((c) => c.person)).toEqual([0, 2]);
    const again = boardCards(boardCards(start, [0, 2], true, 4), [0], true, 4);
    expect(again.map((c) => [c.person, c.out])).toEqual([[0, false], [1, true], [2, true], [3, true]]);
  });

  it("dropOut removes the marked cards and hands back the same array when none is marked", () => {
    const cards = boardCards([], people(3));
    expect(dropOut(cards)).toBe(cards);
    expect(dropOut(boardCards(cards, [1], true, 3)).map((c) => c.person)).toEqual([1]);
  });
});
