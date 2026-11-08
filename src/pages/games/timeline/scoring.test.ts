import { joins, pairsInOrder, shareRow, slotTicks, stars } from "./scoring";
import { shareText } from "./share";

const truth = ["A", "B", "C", "D", "E", "F"];

describe("scoring (§2.3, §7)", () => {
  it("scores one card moved from top to bottom as 10 of 15 pairs", () => {
    expect(pairsInOrder(["B", "C", "D", "E", "F", "A"], truth)).toEqual({ right: 10, total: 15 });
  });

  it("scores the reversed order 0 and the right order in full", () => {
    expect(pairsInOrder([...truth].reverse(), truth).right).toBe(0);
    expect(pairsInOrder(truth, truth)).toEqual({ right: 15, total: 15 });
  });

  it("gives stars at all, 80% and 60% of pairs", () => {
    expect(stars(10, 10)).toBe(3);
    expect(stars(8, 10)).toBe(2);
    expect(stars(6, 10)).toBe(1);
    expect(stars(5, 10)).toBe(0);
  });

  it("marks a shifted block with no ticks but four joins", () => {
    const shifted = ["B", "C", "D", "E", "F", "A"];
    expect(slotTicks(shifted, truth).some(Boolean)).toBe(false);
    expect(joins(shifted, truth)).toEqual([true, true, true, true, false]);
  });

  it("shares squares only, never an event", () => {
    const tries = [["B", "A", "C", "D", "F", "E"], truth];
    expect(shareRow(tries[0], truth)).toBe("⬜⬜🟩🟩⬜⬜");
    expect(shareText(12, tries, truth, true)).toBe("Timeline sort #12 2/4\n⬜⬜🟩🟩⬜⬜\n🟩🟩🟩🟩🟩🟩\nbibleguide.io/games/timeline");
    expect(shareText(3, [truth.slice().reverse()], truth, false).split("\n")[0]).toBe("Timeline sort #3 X/4");
  });
});
