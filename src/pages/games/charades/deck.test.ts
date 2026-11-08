// Family charades: pools, offered decks and dealing (design §3.3, §4.4, §11), on the real scene file.
import { readFileSync } from "node:fs";
import file from "@/data/charades/scenes.json";
import type { Catalog } from "@/lib/types";
import { addRecent, answerScene, deal, dealOrder, deckOffered, newDealer, parseRef, perRoundMaximum, poolFor, readHref, shuffle,
  type AgeGroup, type DeckKey, type Difficulty, type Scene, type ScenesFile } from "./deck";

const scenes = (file as unknown as ScenesFile).scenes;
const stories = new Map(scenes.map((s) => [s.id, s.story]));
const storyOf = (id: string) => stories.get(id);
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const numOf = (code: string) => catalog.books.find((b) => b.code === code)?.num;

/** A small seeded generator, so a failing deal can be replayed. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

const size = (ageGroup: AgeGroup, deck: DeckKey, difficulty: Difficulty = "medium") => poolFor(scenes, { ageGroup, deck, difficulty }).length;

describe("the decks", () => {
  it("hold the numbers in the design's table (§3.3)", () => {
    expect(size("little", "everything", "easy")).toBe(45);
    expect(size("little", "everything", "hard")).toBe(45); // Little ones always get their whole pool
    expect([size("kids", "everything", "easy"), size("kids", "everything", "medium"), size("kids", "everything", "hard")]).toEqual([35, 96, 89]);
    expect([size("adults", "everything", "easy"), size("adults", "everything", "medium"), size("adults", "everything", "hard")]).toEqual([35, 97, 94]);
    const table: Record<string, [number, number, number]> = {
      beginnings: [16, 32, 32], kings: [7, 29, 32], jesus: [16, 37, 37], miracles: [14, 33, 33],
      parables: [6, 14, 15], church: [1, 13, 14], seasons: [8, 14, 14],
    };
    for (const [deck, counts] of Object.entries(table)) {
      expect([size("little", deck as DeckKey), size("kids", deck as DeckKey), size("adults", deck as DeckKey)], deck).toEqual(counts);
    }
  });

  it("offers a deck only when it holds at least 12 scenes", () => {
    for (const deck of ["kings", "parables", "church", "seasons"] as const) expect(deckOffered(scenes, "little", deck), deck).toBe(false);
    for (const deck of ["beginnings", "jesus", "miracles"] as const) expect(deckOffered(scenes, "little", deck), deck).toBe(true);
    for (const group of ["little", "kids", "adults"] as const) expect(deckOffered(scenes, group, "everything")).toBe(true);
    for (const deck of ["beginnings", "kings", "jesus", "miracles", "parables", "church", "seasons"] as const) {
      expect(deckOffered(scenes, "kids", deck), deck).toBe(true);
      expect(deckOffered(scenes, "adults", deck), deck).toBe(true);
    }
  });

  it("prints the deck table for a reviewer (does not fail)", () => {
    const decks: DeckKey[] = ["beginnings", "kings", "jesus", "miracles", "parables", "church", "seasons"];
    const lines = decks.map((deck) => `${deck}: ${size("little", deck)} / ${size("kids", deck)} / ${size("adults", deck)}`);
    console.info(`Family charades decks (little / kids / adults):\n${lines.join("\n")}`);
  });
});

describe("dealing", () => {
  const pool = poolFor(scenes, { ageGroup: "kids", deck: "everything", difficulty: "medium" });

  it("shuffles every item exactly once", () => {
    const out = shuffle(pool.map((s) => s.id), seeded(1));
    expect([...out].sort()).toEqual(pool.map((s) => s.id).sort());
  });

  it("puts recently seen scenes last, the oldest seen first", () => {
    const recent = [pool[5].id, pool[2].id, pool[9].id];
    const order = dealOrder(pool, recent, seeded(7));
    expect(order.slice(-3)).toEqual(recent);
    expect(order.length).toBe(pool.length);
  });

  it("never deals two scenes of one story in a round", () => {
    const noah = poolFor(scenes, { ageGroup: "little", deck: "beginnings", difficulty: "medium" });
    let dealer = newDealer(dealOrder(noah, [], seeded(3)));
    const dealt: string[] = [];
    for (;;) {
      const next = deal(dealer, storyOf);
      if (!next.id || dealt.includes(next.id)) break;
      dealt.push(next.id);
      dealer = answerScene(next.dealer, next.id, "pass");
    }
    const stories = dealt.map(storyOf).filter(Boolean);
    expect(new Set(stories).size).toBe(stories.length);
  });

  it("for 1,000 rounds per offered deck, deals the one-per-story maximum of fresh scenes, then only this round's passes, earliest first", () => {
    const random = seeded(2026);
    const offered: { ageGroup: AgeGroup; deck: DeckKey; difficulty: Difficulty }[] = [];
    for (const ageGroup of ["little", "kids", "adults"] as const) {
      for (const deck of ["everything", "beginnings", "kings", "jesus", "miracles", "parables", "church", "seasons"] as const) {
        if (!deckOffered(scenes, ageGroup, deck)) continue;
        for (const difficulty of deck === "everything" && ageGroup !== "little" ? (["easy", "medium", "hard"] as const) : (["medium"] as const)) offered.push({ ageGroup, deck, difficulty });
      }
    }
    expect(perRoundMaximum(poolFor(scenes, { ageGroup: "kids", deck: "church", difficulty: "medium" }))).toBe(12);
    expect(perRoundMaximum(poolFor(scenes, { ageGroup: "little", deck: "beginnings", difficulty: "medium" }))).toBe(13);
    for (const choice of offered) {
      const deckPool = poolFor(scenes, choice);
      const maximum = perRoundMaximum(deckPool);
      for (let i = 0; i < 1000; i++) {
        let dealer = newDealer(dealOrder(deckPool, [], random));
        const fresh = new Set<string>();
        const passed: string[] = [];
        // Pass everything until the first repeat, guessing every third scene.
        for (;;) {
          const next = deal(dealer, storyOf);
          if (!next.id) break;
          if (fresh.has(next.id)) { if (next.id !== passed[0]) expect(next.id).toBe(passed[0]); break; }
          fresh.add(next.id);
          const mark = fresh.size % 3 === 0 ? "correct" : "pass";
          if (mark === "pass") passed.push(next.id);
          dealer = answerScene(next.dealer, next.id, mark);
        }
        if (fresh.size !== maximum) expect(fresh.size, JSON.stringify(choice)).toBe(maximum);
      }
    }
  });

  it("never brings back a scene marked correct, and runs out when everything has been guessed", () => {
    const deckPool = poolFor(scenes, { ageGroup: "kids", deck: "church", difficulty: "medium" });
    let dealer = newDealer(dealOrder(deckPool, [], seeded(5)));
    const first = deal(dealer, storyOf);
    dealer = answerScene(first.dealer, first.id!, "pass");
    const seen: string[] = [first.id!];
    for (;;) {
      const next = deal(dealer, storyOf);
      if (!next.id) break;
      expect(seen.filter((id) => id === next.id).length <= 1).toBe(true);
      seen.push(next.id);
      dealer = answerScene(next.dealer, next.id, "correct");
    }
    expect(dealer.correct.length).toBe(perRoundMaximum(deckPool));
    expect(seen.filter((id) => id === first.id).length).toBe(2); // the pass came back once, then was guessed
  });

  it("reshuffles across rounds, still dealing recently seen scenes last", () => {
    const deckPool = poolFor(scenes, { ageGroup: "kids", deck: "church", difficulty: "medium" });
    const random = seeded(11);
    const one = dealOrder(deckPool, [], random);
    const recent = addRecent([], one);
    const two = dealOrder(deckPool, recent, random);
    expect(two).toEqual(one); // everything was seen: oldest seen first
    const three = dealOrder(deckPool, addRecent(recent, one.slice(0, 5)), random);
    expect(three.slice(-5)).toEqual(one.slice(0, 5));
  });

  it("keeps at most 200 recent ids, the newest at the end", () => {
    const ids = Array.from({ length: 250 }, (_, i) => `s${i}`);
    const recent = addRecent(ids.slice(0, 150), ids.slice(150));
    expect(recent.length).toBe(200);
    expect(recent.at(-1)).toBe("s249");
    expect(addRecent(["a", "b", "c"], ["a"])).toEqual(["b", "c", "a"]);
  });
});

describe("references", () => {
  it("parses every scene's reference into verse ids", () => {
    for (const scene of scenes as Scene[]) {
      const passages = parseRef(scene.ref, numOf);
      for (const p of passages) expect(p.end >= p.start, scene.id).toBe(true);
    }
  });

  it("reads a single verse, a range, a range across a chapter and two passages", () => {
    expect(parseRef("GEN 15:5", numOf)).toEqual([{ code: "GEN", start: 1015005, end: 1015005 }]);
    expect(parseRef("GEN 1:1-31", numOf)).toEqual([{ code: "GEN", start: 1001001, end: 1001031 }]);
    expect(parseRef("JON 1:17-2:10", numOf)).toEqual([{ code: "JON", start: 32001017, end: 32002010 }]);
    expect(parseRef("EXO 34:1-4; EXO 34:28", numOf)).toEqual([{ code: "EXO", start: 2034001, end: 2034004 }, { code: "EXO", start: 2034028, end: 2034028 }]);
    expect(parseRef("1SA 17:4-50", numOf)[0].start).toBe(9017004);
    expect(() => parseRef("XYZ 1:1", numOf)).toThrow(/XYZ 1:1/);
  });

  it("links the reader to the passage's first chapter", () => {
    expect(readHref(parseRef("GEN 15:5", numOf)[0])).toBe("/read/bsb/GEN/15?hl=5");
    expect(readHref(parseRef("MRK 4:35-41", numOf)[0])).toBe("/read/bsb/MRK/4?hl=35-41");
    expect(readHref(parseRef("JON 1:17-2:10", numOf)[0])).toBe("/read/bsb/JON/1?hl=17-999");
  });
});
