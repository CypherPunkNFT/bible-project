// Practice dealing (design §5.2, §6.2), on the real pool and on the small test pool.
import timelineFile from "@/data/timeline/timeline.json";
import { mulberry32 } from "./daily-rules";
import { LEVEL_KEYS, LEVELS, deal, joinAllowed, shuffleForDisplay, type EraChoice } from "./deal";
import { fixtureIndex } from "./fixture";
import { ERA_KEYS, joinsOf, trueOrder, validRound } from "./order";
import { prepare, type TimelineData } from "./text";

const { index } = prepare(timelineFile as unknown as TimelineData);

describe("practice rounds on the real pool", () => {
  it("are always certain, with the level's card count and tiers, at every level and era", () => {
    const random = mulberry32(42);
    for (const level of LEVEL_KEYS) {
      for (const era of ["all", ...ERA_KEYS] as EraChoice[]) {
        for (let round = 0; round < 12; round++) {
          const dealt = deal(index, level, era, random);
          expect(dealt, `${level} / ${era}`).not.toBeNull();
          const ids = dealt!.dealt;
          expect(ids).toHaveLength(LEVELS[level].cards);
          expect(validRound(index, ids), `${level} / ${era}: ${ids.join(", ")}`).toBe(true);
          const events = ids.map((id) => index.byId.get(id)!);
          if (era !== "all") expect(events.every((event) => event.era === era)).toBe(true);
          if (!dealt!.widened) expect(events.every((event) => event.tier <= LEVELS[level].maxTier)).toBe(true);
          expect(events.some((event) => event.retired)).toBe(false);
        }
      }
    }
  });

  it("keeps Easy's joins at least 200 years apart (or early Genesis), and Medium's at least 40 or a non-close fact", () => {
    const random = mulberry32(7);
    for (const level of ["easy", "medium"] as const) {
      for (let round = 0; round < 40; round++) {
        const ids = deal(index, level, "all", random)!.dealt;
        for (const steps of joinsOf(index, ids)) expect(joinAllowed(index, steps, level)).toBe(true);
      }
    }
  });

  it("prefers events not seen lately", () => {
    const random = mulberry32(3);
    const recent = index.active.slice(0, 40).map((event) => event.id);
    let seenAgain = 0;
    for (let round = 0; round < 30; round++) seenAgain += deal(index, "hard", "all", random, recent)!.dealt.filter((id) => recent.includes(id)).length;
    const fair = 30 * 7 * (recent.length / index.active.length);
    expect(seenAgain).toBeLessThan(fair);
  });
});

describe("dealing on the test pool", () => {
  const small = fixtureIndex();

  it("widens the tiers, and says so, when an era is too thin for the level", () => {
    const dealt = deal(small, "easy", "exodus", mulberry32(1));
    expect(dealt?.widened).toBe(true);
    expect([...dealt!.dealt].sort()).toEqual(["exodus", "jericho-falls", "joshua-dies", "sinai-commandments"]);
  });

  it("gives up rather than dealing a doubtful round", () => {
    expect(deal(small, "hard", "church", mulberry32(1))).toBeNull();
  });
});

describe("the dealt order (§5.2)", () => {
  it("never starts sorted, and has at most one card in its right slot", () => {
    const random = mulberry32(9);
    for (let n = 4; n <= 7; n++) {
      const truth = Array.from({ length: n }, (_, i) => `e${i}`);
      for (let round = 0; round < 300; round++) {
        const order = shuffleForDisplay(truth, random);
        expect([...order].sort()).toEqual([...truth].sort());
        expect(order.join()).not.toBe(truth.join());
        expect(order.filter((id, i) => truth[i] === id).length).toBeLessThanOrEqual(1);
      }
    }
  });

  it("falls back to every card one slot off when the shuffle keeps failing", () => {
    expect(shuffleForDisplay(["a", "b", "c", "d"], () => 0.999)).not.toEqual(["a", "b", "c", "d"]);
    expect(trueOrder(fixtureIndex(), ["exodus", "abram-called"])).toEqual(["abram-called", "exodus"]);
  });
});
