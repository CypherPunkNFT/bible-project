// Memory card match: drawing fair boards and dealing them (deal.ts; design sections 6 and 14), over thousands of seeded
// draws on the shipped data.
import rawData from "@/data/memory-match/pairs.json";
import { BOARD_PAIRS, DIFFICULTIES, HARD_DEEP_PAIRS, columnsFor, dealCards, drawPairs, poolFor, seededRng, specPair,
  type Difficulty, type PairsFile } from "./deal";

const data = rawData as unknown as PairsFile;
const byId = new Map(data.pairs.map((pair) => [pair.id, pair]));
const DRAWS = 1000;

function checkBoard(ids: string[], difficulty: Difficulty, label: string) {
  const pairs = ids.map((id) => byId.get(id)!);
  expect(pairs.length, label).toBe(BOARD_PAIRS[difficulty]);
  expect(new Set(ids).size, label).toBe(ids.length);
  expect(new Set(pairs.map((p) => p.who)).size, `${label}: a character twice`).toBe(pairs.length);
  expect(new Set(pairs.map((p) => data.characters[p.who].first)).size, `${label}: a shared first name`).toBe(pairs.length);
  for (const a of pairs) {
    for (const b of pairs) {
      if (a === b) continue;
      expect(a.notWith.includes(b.who), `${label}: ${a.who} must not meet ${b.who}`).toBe(false);
      if (difficulty === "easy") expect(a.words.filter((w) => b.words.includes(w)), `${label}: ${a.story} / ${b.story}`).toEqual([]);
    }
  }
  if (difficulty === "hard") expect(pairs.filter((p) => p.tier >= 2).length, label).toBeGreaterThanOrEqual(HARD_DEEP_PAIRS);
}

describe("drawing a board", () => {
  for (const deck of data.decks) {
    for (const difficulty of DIFFICULTIES) {
      if (!deck.offered[difficulty]) continue;
      it(`draws ${DRAWS} fair ${difficulty} boards from ${deck.title}`, () => {
        const rng = seededRng(deck.key.length * 7919 + difficulty.length);
        const pool = new Set(poolFor(data, deck.key, difficulty).map((p) => p.id));
        for (let n = 0; n < DRAWS; n += 1) {
          const ids = drawPairs(data, deck.key, difficulty, [], rng);
          expect(ids.every((id) => pool.has(id))).toBe(true);
          checkBoard(ids, difficulty, `${deck.key} ${difficulty} #${n}`);
        }
      });
    }
  }

  it("avoids pairs seen lately while the pool allows", () => {
    const pool = poolFor(data, "mixed", "medium").map((p) => p.id);
    const seen = pool.slice(0, 40);
    const rng = seededRng(42);
    for (let n = 0; n < 200; n += 1) {
      expect(drawPairs(data, "mixed", "medium", seen, rng).filter((id) => seen.includes(id))).toEqual([]);
    }
  });

  it("brings the longest-ago pairs back first once every pair has been seen", () => {
    const rng = seededRng(7);
    const pool = poolFor(data, "mixed", "medium").map((p) => p.id);
    const seen = [...pool].reverse();
    for (let n = 0; n < 200; n += 1) {
      const ids = drawPairs(data, "mixed", "medium", seen, rng);
      expect(Math.max(...ids.map((id) => seen.indexOf(id)))).toBeLessThan(40);
    }
  });

  it("puts the spec's pair on a new player's first Easy board", () => {
    const spec = specPair(data)!;
    for (const deck of ["mixed", "prophets"]) {
      const rng = seededRng(3);
      for (let n = 0; n < 50; n += 1) {
        const ids = drawPairs(data, deck, "easy", [], rng, true);
        expect(ids).toContain(spec.id);
        checkBoard(ids, "easy", `${deck} opener`);
      }
    }
  });
});

describe("dealing the cards", () => {
  it("lays out each pair's two cards once, in a permutation", () => {
    const ids = drawPairs(data, "mixed", "hard", [], seededRng(1));
    const cards = dealCards(ids, "hard", seededRng(2));
    expect(cards).toHaveLength(24);
    for (const id of ids) {
      expect(cards.filter((c) => c.pair === id).map((c) => c.kind).sort()).toEqual(["story", "who"]);
    }
  });

  it("spreads a card evenly over every position", () => {
    const ids = drawPairs(data, "mixed", "easy", [], seededRng(5));
    const counts = Array<number>(12).fill(0);
    const rng = seededRng(11);
    const deals = 6000;
    for (let n = 0; n < deals; n += 1) {
      const cards = dealCards(ids, "hard", rng);
      counts[cards.findIndex((c) => c.pair === ids[0] && c.kind === "who")] += 1;
    }
    for (const count of counts) {
      expect(count).toBeGreaterThan(deals / 12 * 0.75);
      expect(count).toBeLessThan(deals / 12 * 1.25);
    }
  });

  it("never opens with a pair in the first two places where the backs show the type", () => {
    const ids = drawPairs(data, "mixed", "easy", [], seededRng(9));
    const rng = seededRng(10);
    for (let n = 0; n < 2000; n += 1) {
      const cards = dealCards(ids, "easy", rng);
      expect(cards[0].pair === cards[1].pair).toBe(false);
    }
  });

  it("chooses the columns by difficulty and screen width", () => {
    expect([columnsFor("easy", true), columnsFor("medium", true), columnsFor("hard", true)]).toEqual([3, 3, 4]);
    expect([columnsFor("easy", false), columnsFor("medium", false), columnsFor("hard", false)]).toEqual([4, 6, 6]);
  });
});
