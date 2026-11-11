// The kit's pure functions: the count-up's curve, the trail's marks and share squares, ranks, places, the timer's
// tones, the confetti's pieces, sharing with and without a share sheet, and the environment guards.
import { countAt, easeOut } from "./count-up";
import { confettiPieces, seeded } from "./confetti";
import { hasWindow, motionMs, prefersReducedMotion } from "./env";
import { rankFor } from "./rank";
import { shareText } from "./share";
import { placeTeams, podiumSteps, scoreShares, teamTone, TEAM_TONES } from "./teams";
import { timeShare, timerTone } from "./timer";
import { DEFAULT_SQUARES, newestIndex, trailMarks, trailText } from "./trail";

describe("count-up", () => {
  it("eases out from 0 to 1 and clamps", () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(-1)).toBe(0);
    expect(easeOut(2)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5); // fast at first
  });
  it("lands exactly on the target and never overshoots", () => {
    expect(countAt(0, 10, 0)).toBe(0);
    expect(countAt(0, 10, 1)).toBe(10);
    expect(countAt(0, 10, 1.7)).toBe(10);
    expect(countAt(0, 7, 0.5)).toBeGreaterThan(3);
    expect(countAt(0, 7, 0.5)).toBeLessThanOrEqual(7);
    expect(countAt(5, 5, 0.3)).toBe(5);
    expect(countAt(10, 0, 0.5)).toBeLessThan(10); // counts down too
  });
});

describe("trail", () => {
  it("writes the share grid from the marks, leaving out rounds not played", () => {
    expect(trailText(["right", "wrong", "part", "current", "empty"])).toBe("🟩🟥🟨");
    expect(trailText(["right", "empty"], {}, true)).toBe("🟩⬜");
    expect(trailText(["right", "wrong"], { right: "🟧", wrong: "⬛" })).toBe("🟧⬛");
    expect(trailText([])).toBe("");
    expect(Object.keys(DEFAULT_SQUARES).sort()).toEqual(["current", "empty", "part", "right", "wrong"]);
  });
  it("marks the next round as current until the game is over", () => {
    expect(trailMarks(["right", "wrong"], 5)).toEqual(["right", "wrong", "current", "empty", "empty"]);
    expect(trailMarks(["right", "wrong"], 2)).toEqual(["right", "wrong"]);
    expect(trailMarks(["right"], 3, true)).toEqual(["right", "empty", "empty"]);
    expect(trailMarks(["right", "right", "right"], 2)).toHaveLength(3); // never shorter than the results
  });
  it("finds the newest answered mark", () => {
    expect(newestIndex(["right", "wrong", "current", "empty"])).toBe(1);
    expect(newestIndex(["current", "empty"])).toBe(-1);
    expect(newestIndex([])).toBe(-1);
  });
});

describe("rankFor", () => {
  const ranks = [{ from: 0, title: "Beginner" }, { from: 0.5, title: "Reader" }, { from: 0.9, title: "Scribe" }];
  it("picks the highest rank the share reaches, in any table order", () => {
    expect(rankFor(0, 10, ranks)?.title).toBe("Beginner");
    expect(rankFor(5, 10, ranks)?.title).toBe("Reader");
    expect(rankFor(9, 10, ranks)?.title).toBe("Scribe");
    expect(rankFor(10, 10, [...ranks].reverse())?.title).toBe("Scribe");
    expect(rankFor(12, 10, ranks)?.title).toBe("Scribe"); // clamped
  });
  it("gives the lowest rank when none is reached, and nothing for an empty table or a best of zero", () => {
    expect(rankFor(1, 10, [{ from: 0.5, title: "Reader" }])?.title).toBe("Reader");
    expect(rankFor(3, 10, [])).toBeNull();
    expect(rankFor(3, 0, ranks)).toBeNull();
    expect(rankFor(Number.NaN, 10, ranks)).toBeNull();
  });
});

describe("teams", () => {
  const rows = [{ id: "a", score: 3 }, { id: "b", score: 7 }, { id: "c", score: 3 }, { id: "d", score: 0 }];
  it("ranks by competition rule: equal scores share a place and the next place is skipped", () => {
    expect(placeTeams(rows).map((row) => `${row.id}${row.place}`)).toEqual(["b1", "a2", "c2", "d4"]);
    expect(placeTeams([])).toEqual([]);
  });
  it("keeps the given order among equals", () => {
    expect(placeTeams([{ id: "x", score: 1 }, { id: "y", score: 1 }]).map((row) => row.id)).toEqual(["x", "y"]);
  });
  it("fills the three podium steps, two names on a shared step", () => {
    const [first, second, third] = podiumSteps(rows);
    expect(first.map((row) => row.id)).toEqual(["b"]);
    expect(second.map((row) => row.id)).toEqual(["a", "c"]);
    expect(third).toEqual([]);
  });
  it("gives bars as shares of the leader and the seven colours in turn", () => {
    expect(scoreShares(rows)).toEqual([3 / 7, 1, 3 / 7, 0]);
    expect(scoreShares([{ id: "a", score: 0 }])).toEqual([0]);
    expect(scoreShares([{ id: "a", score: -2 }, { id: "b", score: 4 }])).toEqual([0, 1]);
    expect(teamTone(0)).toBe(TEAM_TONES[0]);
    expect(teamTone(7)).toBe(TEAM_TONES[0]);
    expect(teamTone(-1)).toBe(TEAM_TONES[6]);
    expect(teamTone(1, ["red", "blue"])).toBe("blue");
  });
});

describe("timer", () => {
  it("is calm, then amber, then red, then over", () => {
    expect(timerTone(60)).toBe("calm");
    expect(timerTone(10)).toBe("amber");
    expect(timerTone(5)).toBe("red");
    expect(timerTone(1)).toBe("red");
    expect(timerTone(0)).toBe("over");
    expect(timerTone(-3)).toBe("over");
    expect(timerTone(30, 20)).toBe("amber");
  });
  it("gives the share of time left, safe for a zero total", () => {
    expect(timeShare(30, 60)).toBe(0.5);
    expect(timeShare(90, 60)).toBe(1);
    expect(timeShare(-1, 60)).toBe(0);
    expect(timeShare(5, 0)).toBe(0);
  });
});

describe("confetti", () => {
  it("is the same burst for the same seed, mostly gold, within reach, and capped at 60", () => {
    const a = confettiPieces(24, 7);
    const b = confettiPieces(24, 7);
    expect(a).toEqual(b);
    expect(a).toHaveLength(24);
    expect(a.filter((piece) => piece.tone === "cream")).toHaveLength(8);
    for (const piece of a) {
      expect(Math.abs(piece.dx)).toBeLessThanOrEqual(120);
      expect(piece.dy).toBeLessThanOrEqual(120 * 0.35 + 1); // it flies up (negative) and falls a little
      expect(piece.delay).toBeGreaterThanOrEqual(0);
      expect(piece.delay).toBeLessThanOrEqual(0.3);
    }
    expect(confettiPieces(100)).toHaveLength(60);
    expect(confettiPieces(0)).toEqual([]);
    expect(confettiPieces(3, 1)).not.toEqual(confettiPieces(3, 2));
  });
  it("seeded numbers stay in [0, 1)", () => {
    const next = seeded(42);
    for (let i = 0; i < 100; i++) {
      const n = next();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe("shareText", () => {
  const original = { share: navigator.share, canShare: navigator.canShare, clipboard: navigator.clipboard };
  const stub = (patch: Partial<Navigator>) => { for (const [key, value] of Object.entries(patch)) Object.defineProperty(navigator, key, { configurable: true, value }); };
  afterEach(() => stub(original));

  it("uses the share sheet when there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stub({ share, canShare: () => true });
    expect(await shareText("hello")).toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "hello" });
  });
  it("says cancelled when the player closes the sheet, and copies when the sheet fails otherwise", async () => {
    stub({ share: vi.fn().mockRejectedValue(new DOMException("closed", "AbortError")), canShare: undefined });
    expect(await shareText("x")).toBe("cancelled");
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stub({ share: vi.fn().mockRejectedValue(new Error("no")), clipboard: { writeText } as unknown as Clipboard });
    expect(await shareText("x")).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("x");
  });
  it("copies without a share sheet, and asks for a manual copy when the clipboard is blocked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stub({ share: undefined, clipboard: { writeText } as unknown as Clipboard });
    expect(await shareText("y")).toBe("copied");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stub({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) } as unknown as Clipboard });
    expect(await shareText("y")).toBe("manual");
    stub({ clipboard: undefined });
    expect(await shareText("y")).toBe("manual");
  });
});

describe("env", () => {
  it("knows it is in a browser and reads reduced motion safely", () => {
    expect(hasWindow()).toBe(true);
    expect(prefersReducedMotion()).toBe(false); // the test setup answers false
    expect(motionMs(500)).toBe(500);
    const saved = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...saved(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(true);
    expect(motionMs(500)).toBe(0);
    window.matchMedia = (() => { throw new Error("no media"); }) as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
    window.matchMedia = saved;
  });
});
