// Memory card match: the shipped data (src/data/memory-match/pairs.json; design section 14).
import rawData from "@/data/memory-match/pairs.json";
import { BOARD_PAIRS, DIFFICULTIES, MIXED, poolFor, specPair, type PairsFile } from "./deal";
import { SOFT_HYPHEN } from "./game";

const data = rawData as unknown as PairsFile;
const plainLength = (text: string) => text.split(SOFT_HYPHEN).join("").length;
const words = (text: string) => text.split(SOFT_HYPHEN).join("").toLowerCase().match(/[a-z0-9]+/g) ?? [];

describe("memory match pairs file", () => {
  it("names every pair's character, with unique ids and no repeated pair", () => {
    expect(data.pairs.length).toBeGreaterThanOrEqual(100);
    expect(new Set(data.pairs.map((p) => p.id)).size).toBe(data.pairs.length);
    expect(new Set(data.pairs.map((p) => `${p.who}|${p.story}`)).size).toBe(data.pairs.length);
    for (const pair of data.pairs) expect(data.characters[pair.who], pair.who).toBeDefined();
  });

  it("keeps labels to 30 characters, with soft hyphens in words over 12 letters", () => {
    const labels = [...Object.values(data.characters).map((c) => c.label), ...data.pairs.map((p) => p.story)];
    for (const label of labels) {
      expect(plainLength(label), label).toBeLessThanOrEqual(30);
      for (const word of label.split(/\s+/)) {
        if (word.split(SOFT_HYPHEN).join("").replace(/[^A-Za-z]/g, "").length > 12) expect(word, label).toContain(SOFT_HYPHEN);
      }
    }
  });

  it("never names a pair's own character on its story card", () => {
    const skip = new Set(["the", "king", "of", "and", "with", "who", "a"]);
    for (const pair of data.pairs) {
      const story = new Set(words(pair.story.replace(/“[^”]*”/g, "")));
      const own = words(data.characters[pair.who].label).filter((w) => !skip.has(w) && w.length > 2);
      expect(own.filter((w) => story.has(w)), `${pair.who}: ${pair.story}`).toEqual([]);
    }
  });

  it("keeps notWith symmetric and pointing at real who cards", () => {
    for (const pair of data.pairs) {
      for (const other of pair.notWith) {
        expect(data.characters[other], `${pair.id} → ${other}`).toBeDefined();
        const theirs = data.pairs.filter((p) => p.who === other);
        expect(theirs.every((p) => p.notWith.includes(pair.who)), `${other} ↔ ${pair.who}`).toBe(true);
      }
    }
  });

  it("offers a combination only with at least the board's pairs + 3 characters, and always offers Mixed", () => {
    for (const deck of data.decks) {
      for (const difficulty of DIFFICULTIES) {
        if (!deck.offered[difficulty]) continue;
        const characters = new Set(poolFor(data, deck.key, difficulty).map((p) => p.who));
        expect(characters.size, `${deck.key} ${difficulty}`).toBeGreaterThanOrEqual(BOARD_PAIRS[difficulty] + 3);
      }
    }
    expect(data.decks.find((d) => d.key === MIXED)?.offered).toEqual({ easy: true, medium: true, hard: true });
  });

  it("has the spec's pair, Daniel and the lions' den, at tier 1", () => {
    const spec = specPair(data);
    expect(spec?.tier).toBe(1);
    expect(data.characters.daniel.label).toBe("Daniel");
  });

  it("ships verse ids, never verse wording", () => {
    for (const pair of data.pairs) {
      expect(String(pair.keyVerseId), pair.id).toMatch(/^[1-6]?\d\d{3}\d{3}$/);
      const book = Math.floor(pair.keyVerseId / 1_000_000);
      expect(book).toBeGreaterThanOrEqual(1);
      expect(book).toBeLessThanOrEqual(66);
      expect(pair).not.toHaveProperty("keyQuote");
      expect(pair.readerHref).toMatch(/^\/read\/bsb\/[1-3A-Z]{3}\/\d+\?hl=\d+(-\d+)?$/);
    }
    expect(specPair(data)?.keyVerseId).toBe(27006022);
  });
});
