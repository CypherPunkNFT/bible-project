// Checking guesses (design §3): the colouring table of §3.2, the keyboard's best colours, hard mode and the refusals.
import { evaluate, guessSet, hardModeProblem, keyMarks, outcomeOf, refusalFor, type Mark } from "./evaluate";

const SQUARES: Record<Mark, string> = { correct: "🟩", present: "🟨", absent: "⬛" };
const squares = (guess: string, answer: string) => evaluate(guess, answer).map((mark) => SQUARES[mark]).join("");

describe("bible wordle colouring", () => {
  it.each([
    ["apple", "alley", "🟩🟨⬛🟨⬛"],
    ["abbey", "babes", "🟨🟨🟩🟩⬛"],
    ["manna", "nanny", "⬛🟩🟩🟩⬛"],
    ["jesus", "seeks", "🟨🟩⬛⬛🟩"],
    ["sheol", "sheol", "🟩🟩🟩🟩🟩"],
  ])("answer %s, guess %s gives %s", (answer, guess, expected) => {
    expect(squares(guess, answer)).toBe(expected);
  });

  it("gives each key its best colour so far: green beats yellow, yellow beats grey", () => {
    const marks = keyMarks(["alley", "apple"], "apple");
    expect(marks.get("a")).toBe("correct");
    expect(marks.get("l")).toBe("correct"); // yellow in ALLEY, then green in APPLE
    expect(marks.get("y")).toBe("absent");
    expect(keyMarks(["babes"], "abbey").get("b")).toBe("correct"); // one B yellow, one green
  });

  it("knows when the game is won or lost", () => {
    expect(outcomeOf(["faith"], "faith")).toBe("won");
    expect(outcomeOf(["bread", "water"], "faith")).toBe("playing");
    expect(outcomeOf(["bread", "water", "light", "stone", "grace", "peace"], "faith")).toBe("lost");
  });
});

describe("bible wordle hard mode", () => {
  it("keeps green letters in their place", () => {
    expect(hardModeProblem("grove", ["trace"], "grape")).toEqual({ kind: "position", position: 3, letter: "a" });
    expect(hardModeProblem("crane", ["trace"], "grape")).toBeNull();
  });

  it("requires yellow letters, counting a letter shown twice in one guess as needed twice", () => {
    expect(hardModeProblem("stone", ["bread"], "dream")).toEqual({ kind: "position", position: 2, letter: "r" });
    expect(hardModeProblem("cross", ["bread"], "dream")).toEqual({ kind: "position", position: 3, letter: "e" });
    expect(hardModeProblem("treat", ["bread"], "dream")).toEqual({ kind: "include", letter: "d" });
    // Answer ABBEY, guess BABES: both Bs lit (one yellow, one green), so a later guess needs two Bs.
    expect(hardModeProblem("tabby", ["babes"], "abbey")).toEqual({ kind: "position", position: 4, letter: "e" });
    expect(hardModeProblem("ebbed", ["babes"], "abbey")).toEqual({ kind: "include", letter: "a" });
    expect(hardModeProblem("abbey", ["babes"], "abbey")).toBeNull();
  });

  it("never lets grey tiles restrict a guess", () => {
    expect(hardModeProblem("stone", ["bloom"], "faith")).toBeNull();
  });
});

describe("bible wordle refusals", () => {
  const allowed = guessSet("breadfaithstonewater");

  it("reads the allowed list from one string of five-letter words", () => {
    expect([...allowed]).toEqual(["bread", "faith", "stone", "water"]);
  });

  it("refuses a short row, an unknown word and a repeated guess, and lets a sound one through", () => {
    expect(refusalFor("brea", [], "faith", allowed, false)).toEqual({ kind: "short" });
    expect(refusalFor("qqqqq", [], "faith", allowed, false)).toEqual({ kind: "unknown" });
    expect(refusalFor("bread", ["bread"], "faith", allowed, false)).toEqual({ kind: "repeat" });
    expect(refusalFor("stone", ["bread"], "faith", allowed, false)).toBeNull();
  });

  it("applies hard mode only when it is on", () => {
    expect(refusalFor("stone", ["water"], "faith", allowed, false)).toBeNull();
    expect(refusalFor("stone", ["water"], "faith", allowed, true)).toEqual({ kind: "position", position: 2, letter: "a" });
  });
});
