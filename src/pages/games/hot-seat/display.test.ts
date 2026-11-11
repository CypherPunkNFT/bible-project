// Hot seat's small display rules from the redesign: the reference with its book written out, the run of right answers
// the flame counts, the recap strip's tiles, and the standings' movement for a player still waiting for a first turn.
import { fullReference, tilesOf } from "./display";
import { currentRun, newSession, reduce, type Asked } from "./game";
import { frozen } from "./hot-seat.test.fixture";
import { standings } from "./leaderboard";

const NAMES = { "1SA": "1 Samuel", GEN: "Genesis", PRO: "Proverbs" };

describe("fullReference", () => {
  it("writes the book out in full from the link's code", () => {
    expect(fullReference("1 Sam 16:11", { book: "1SA", chapter: 16, verse: 11 }, NAMES)).toBe("1 Samuel 16:11");
    expect(fullReference("Gen 4:1-2", { book: "GEN", chapter: 4, verse: 1 }, NAMES)).toBe("Genesis 4:1-2");
    expect(fullReference("Pro 19", { book: "PRO", chapter: 19, verse: null }, NAMES)).toBe("Proverbs 19");
  });
  it("leaves a reference alone without a link, an unknown book or no chapter", () => {
    expect(fullReference("Jam 5:15", null, NAMES)).toBe("Jam 5:15");
    expect(fullReference("Jam 5:15", { book: "JAS", chapter: 5, verse: 15 }, NAMES)).toBe("Jam 5:15");
    expect(fullReference("Genesis", { book: "GEN", chapter: 1, verse: null }, NAMES)).toBe("Genesis");
  });
});

const asked = (marks: (Asked["mark"])[]): Asked[] => marks.map((mark, i) => ({ q: frozen({ id: `q${i + 1}` }), mark }));

describe("currentRun and tilesOf", () => {
  it("counts right answers in a row at the end, ignoring the open question", () => {
    expect(currentRun(asked(["right", "right", null]))).toBe(2);
    expect(currentRun(asked(["right", "wrong", "right", "right", "right", null]))).toBe(3);
    expect(currentRun(asked(["right", "pass", null]))).toBe(0);
    expect(currentRun(asked([]))).toBe(0);
  });
  it("turns the marks into strip tiles, a pass amber and an unmarked question empty", () => {
    expect(tilesOf(asked(["right", "wrong", "pass", null]))).toEqual(["right", "wrong", "part", "empty"]);
  });
});

describe("standings movement", () => {
  it("does not show players still waiting for a first turn as having dropped", () => {
    let s = newSession([{ name: "Anna", group: "adults" }, { name: "Ben", group: "adults" }, { name: "Cara", group: "adults" }], { seconds: 30, testament: "", twoChoices: "little", sound: false }, 1);
    s = reduce(s, { type: "start", first: frozen() });
    s = reduce(s, { type: "mark", mark: "right", next: null, leftMs: 1000 });
    s = reduce(s, { type: "save" });
    const rows = standings(s);
    expect(rows.map((r) => [r.player.name, r.place, r.moved])).toEqual([["Anna", 1, 0], ["Ben", 2, 0], ["Cara", 2, 0]]);
  });
});
