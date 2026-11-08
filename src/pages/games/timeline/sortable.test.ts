// The one pure move every input ends in (design §9.1), and how the other cards slide aside while one is dragged.
import { move, sameOrder } from "./sortable";
import { shiftOf } from "./useSortable";

describe("move (§9.1)", () => {
  const order = ["a", "b", "c", "d"];
  it("moves a card up, down, to both ends and onto itself", () => {
    expect(move(order, 2, 1)).toEqual(["a", "c", "b", "d"]);
    expect(move(order, 1, 2)).toEqual(["a", "c", "b", "d"]);
    expect(move(order, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(move(order, 0, 3)).toEqual(["b", "c", "d", "a"]);
    expect(move(order, 2, 2)).toEqual(order);
  });

  it("never changes the order it was given, and clamps a target past the ends", () => {
    move(order, 0, 3);
    expect(order).toEqual(["a", "b", "c", "d"]);
    expect(move(order, 0, 99)).toEqual(["b", "c", "d", "a"]);
    expect(() => move(order, 7, 0)).toThrow(/no card at position 7/);
  });

  it("compares orders", () => {
    expect(sameOrder(order, ["a", "b", "c", "d"])).toBe(true);
    expect(sameOrder(order, ["a", "c", "b", "d"])).toBe(false);
  });
});

describe("cards sliding aside during a drag (§9.2)", () => {
  it("moves the held card with the pointer and slides the cards between its slot and the target by one card", () => {
    const down = { from: 1, target: 3, dy: 130, height: 64 };
    expect([0, 1, 2, 3, 4].map((i) => shiftOf(down, i))).toEqual([0, 130, -64, -64, 0]);
    const up = { from: 3, target: 0, dy: -200, height: 64 };
    expect([0, 1, 2, 3, 4].map((i) => shiftOf(up, i))).toEqual([64, 64, 64, -200, 0]);
  });

  it("shifts nothing when no card is held", () => {
    expect(shiftOf(null, 2)).toBe(0);
  });
});
