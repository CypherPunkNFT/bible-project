// The redesign's pure pieces: the ten squares of a Practice round and its share line, and a card's settled state.
import { practiceMarks, practiceShareText } from "./share";
import { choiceState } from "./rules";

const puzzle = (id: string, pick: string | null, hints: number, revealed: boolean) => ({ id, pick, hints, revealed });

describe("practice marks and share", () => {
  it("colours a right answer green, a right answer after a hint amber, a miss red, the puzzle in play outlined", () => {
    const puzzles = [puzzle("a", "a", 0, true), puzzle("b", "b", 1, true), puzzle("c", "x", 0, true), puzzle("d", null, 0, false)];
    expect(practiceMarks(puzzles, 3, false)).toEqual(["right", "part", "wrong", "current", "empty", "empty", "empty", "empty", "empty", "empty"]);
    expect(practiceMarks(puzzles, 3, true).slice(0, 4)).toEqual(["right", "part", "wrong", "empty"]);
  });

  it("writes the share line with the score, the squares and the address, and never a title", () => {
    const puzzles = Array.from({ length: 10 }, (_, i) => puzzle(`s${i}`, i === 4 ? "zz" : `s${i}`, i === 0 ? 2 : 0, true));
    expect(practiceShareText(puzzles, 25)).toBe("Emoji stories · Practice 25/30\n🟨🟩🟩🟩🟥🟩🟩🟩🟩🟩\nbibleguide.io/games/emoji-stories");
  });
});

describe("a card's state", () => {
  it("is idle before the answer, then right for the answer, wrong for the pick and faded for the rest", () => {
    expect(choiceState("a", "a", null, false, [])).toBe("idle");
    expect(choiceState("a", "a", "b", true, [])).toBe("right");
    expect(choiceState("b", "a", "b", true, [])).toBe("wrong");
    expect(choiceState("c", "a", "b", true, [])).toBe("faded");
  });
  it("marks a Daily guess already tried as wrong while the puzzle goes on", () => {
    expect(choiceState("b", "a", null, false, ["b"])).toBe("wrong");
    expect(choiceState("c", "a", null, false, ["b"])).toBe("idle");
  });
});
