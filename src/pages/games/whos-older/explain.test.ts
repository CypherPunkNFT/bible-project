// Who's older?: the reveal's words (design §7): the smallest gap, rounded down; no years at all for early Genesis.
import { explain, formatGap, verseHref, verseLabel, windowText } from "./explain";
import type { Character, PoolPair } from "./game";

const character = (id: string, label: string, lo: number, hi: number, shown = true): Character =>
  ({ id, label, tier: 1, lo, hi, shown, tag: "", when: "", brief: "", href: `/people/${id}` });
const windowsPair = (first: Character, second: Character, gap: number): PoolPair => ({ first, second, reason: { kind: "windows", gap }, band: "easy" });
const books = { books: { "1": ["GEN", "Genesis"], "2": ["EXO", "Exodus"] } as Record<string, [string, string]> };

describe("formatGap", () => {
  it("says 1 year, keeps gaps up to 1,000 exact, and rounds larger ones down to the hundred", () => {
    expect(formatGap(1)).toBe("1 year");
    expect(formatGap(25)).toBe("25 years");
    expect(formatGap(660)).toBe("660 years");
    expect(formatGap(1000)).toBe("1,000 years");
    expect(formatGap(1695)).toBe("1,600 years");
    expect(formatGap(7935)).toBe("7,900 years");
  });
});

describe("explain", () => {
  it("states the smallest gap for a windows pair, without the label's qualifier", () => {
    const pair = windowsPair(character("david", "David", -1090, -1030), character("joel", "Joel (prophet)", -900, -400), 130);
    expect(explain(pair).text).toBe("Even on the dating systems that bring them closest, David was born at least 130 years before Joel.");
  });

  it("prints no number of years when either person is from early Genesis", () => {
    const pair = windowsPair(character("noah", "Noah", -8000, -7990, false), character("peter", "Peter", -55, 20), 7934);
    const { text } = explain(pair);
    expect(text).toBe("In the Bible's own order, Noah lived long before Peter.");
    expect(text).not.toMatch(/\d/);
  });

  it("uses a fact's own sentence, with its first verse span", () => {
    const fact = { first: "aaron", second: "moses", kind: "stated-age" as const, refs: [[2_007_007, 2_007_007]] as [number, number][],
      why: "Aaron was three years older than Moses." };
    const pair: PoolPair = { first: character("aaron", "Aaron", -1578, -1291), second: character("moses", "Moses", -1575, -1288), reason: { kind: "fact", fact }, band: "hard" };
    expect(explain(pair)).toEqual({ text: fact.why, verse: [2_007_007, 2_007_007] });
  });
});

describe("dates and verses", () => {
  it("writes windows with 'about', across the BC/AD line and with an open edge", () => {
    expect(windowText({ lo: -1090, hi: -1030 })).toBe("born about 1090–1030 BC");
    expect(windowText({ lo: -55, hi: 20 })).toBe("born about 55 BC – AD 20");
    expect(windowText({ lo: 1, hi: 10 })).toBe("born about AD 1–10");
    expect(windowText({ lo: null, hi: -650 })).toBe("born before about 650 BC");
  });

  it("names and links a verse or a range in the reader", () => {
    expect(verseLabel(books, [2_007_007, 2_007_007])).toBe("Exodus 7:7");
    expect(verseHref(books, [2_007_007, 2_007_007])).toBe("/read/bsb/EXO/7?hl=7");
    expect(verseLabel(books, [1_025_025, 1_025_026])).toBe("Genesis 25:25–26");
    expect(verseHref(books, [1_025_025, 1_025_026])).toBe("/read/bsb/GEN/25?hl=25-26");
  });
});
