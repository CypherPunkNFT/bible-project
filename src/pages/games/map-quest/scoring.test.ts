import { bandFor, haversineKm, nearestSite, scoreForDistance } from "./scoring";
import { shareText } from "./share";
import { PLACES } from "./data";

describe("map quest scoring", () => {
  it("gives the points in the design's table (§6.2)", () => {
    const table: [number, number][] = [[0, 1000], [3, 1000], [5, 967], [10, 904], [17, 842], [25, 789], [50, 685], [100, 571], [200, 451], [500, 289], [1000, 165], [2000, 40]];
    for (const [km, points] of table) expect([km, scoreForDistance(km)]).toEqual([km, points]);
  });

  it("never goes below zero, however far the miss", () => {
    for (const km of [2499.9, 2500, 4000, Infinity, NaN]) expect(scoreForDistance(km)).toBeGreaterThanOrEqual(0);
    expect(scoreForDistance(2500)).toBe(0);
    expect(scoreForDistance(Number.NaN)).toBe(0);
  });

  it("colours a result by its points", () => {
    expect([1000, 950, 949, 800, 799, 600, 599, 350, 349, 0].map(bandFor))
      .toEqual(["bullseye", "bullseye", "green", "green", "yellow", "yellow", "orange", "orange", "red", "red"]);
  });

  it("measures Jerusalem to Jericho as about 22.5 km", () => {
    const jerusalem = PLACES.find((p) => p.name === "Jerusalem")!;
    const jericho = PLACES.find((p) => p.name === "Jericho")!;
    expect(haversineKm([jerusalem.lon, jerusalem.lat], [jericho.lon, jericho.lat])).toBeCloseTo(22.5, 0);
  });

  it("scores a pin against the nearest of several proposed sites", () => {
    const sites: [number, number][] = [[35.0, 31.8], [35.2, 31.8]];
    const { site, km } = nearestSite([35.19, 31.8], sites);
    expect(site).toBe(sites[1]);
    expect(km).toBeLessThan(1);
  });
});

describe("map quest share text", () => {
  it("shows the number, the total and five squares, and names no place", () => {
    const text = shareText(42, [1000, 850, 700, 400, 100]);
    expect(text.split("\n")).toEqual(["Bible Map Quest #42 — 3,050 / 5,000", "🎯🟩🟨🟧🟥", "bibleguide.io/games/map-quest"]);
    for (const place of PLACES) expect(text.includes(place.name)).toBe(false);
  });
});
