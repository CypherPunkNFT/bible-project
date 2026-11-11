import { PLACES } from "./data";
import { mulberry32 } from "./daily-rules";
import { haversineKm } from "./geo";
import { ERAS, LEVELS, MIN_POOL, practicePool, pickRound } from "./pools";

describe("map quest practice pools", () => {
  it("grows from Beginner to Expert, each level holding the easier ones", () => {
    const sizes = LEVELS.map((level) => practicePool(PLACES, level, "all").pool.length);
    expect(sizes[0]).toBeGreaterThanOrEqual(50);
    expect(sizes[0]).toBeLessThan(sizes[1]);
    expect(sizes[1]).toBeLessThan(sizes[2]);
    expect(sizes[2]).toBe(PLACES.length);
  });

  it("keeps an era's places to that era", () => {
    const { pool } = practicePool(PLACES, "expert", "jesus");
    expect(pool.length).toBeGreaterThanOrEqual(MIN_POOL);
    expect(pool.every((place) => place.eras.includes("jesus"))).toBe(true);
  });

  it("widens a level that has too few places for an era, and says which level it used", () => {
    for (const era of ERAS) {
      for (const level of LEVELS) {
        const result = practicePool(PLACES, level, era);
        expect(result.pool.length).toBeGreaterThanOrEqual(MIN_POOL);
        expect(LEVELS.indexOf(result.level)).toBeGreaterThanOrEqual(LEVELS.indexOf(level));
      }
    }
    const beginnerJesus = PLACES.filter((p) => p.tier === 1 && p.eras.includes("jesus")).length;
    if (beginnerJesus < MIN_POOL) expect(practicePool(PLACES, "beginner", "jesus").level).not.toBe("beginner");
  });

  it("picks five different places, none within 15 km of another", () => {
    const random = mulberry32(7);
    for (let game = 0; game < 50; game++) {
      const round = pickRound(practicePool(PLACES, "beginner", "all").pool, random);
      expect(new Set(round.map((p) => p.id)).size).toBe(5);
      round.forEach((a, i) => round.slice(i + 1).forEach((b) => expect(haversineKm([a.lon, a.lat], [b.lon, b.lat])).toBeGreaterThanOrEqual(15)));
    }
  });

  it("still fills a round when the pool is too tight for the distance rule", () => {
    const crowded = [0, 1, 2, 3, 4, 5].map((i) => ({ id: `p${i}`, lon: 35 + i * 0.01, lat: 31.8 }));
    expect(pickRound(crowded, mulberry32(1))).toHaveLength(5);
  });
});
