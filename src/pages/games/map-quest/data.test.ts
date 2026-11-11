// The generated files in src/data/map-quest/ (scripts/build-map-quest.py), checked as the game will read them.
import curation from "@/data/map-quest/curation.json";
import { BOUNDS } from "@/components/atlas/street-style";
import { DISPUTED, PLACES, PLACE_BY_ID } from "./data";

const [west, south, east, north] = BOUNDS;
const insideMap = (lon: number, lat: number) => lon >= west && lon <= east && lat >= south && lat <= north;

describe("map quest places", () => {
  it("holds at least 300 places, with every level non-empty", () => {
    expect(PLACES.length).toBeGreaterThanOrEqual(300);
    for (const tier of [1, 2, 3]) expect(PLACES.some((p) => p.tier === tier)).toBe(true);
  });

  it("puts every place and every alternative site inside the map", () => {
    for (const place of PLACES) {
      expect(insideMap(place.lon, place.lat), place.name).toBe(true);
      for (const [lon, lat] of place.alts) expect(insideMap(lon, lat), place.name).toBe(true);
    }
  });

  it("never asks two places with the same name", () => {
    const names = PLACES.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("keeps Jericho in the Life of Jesus (its New Testament verses were merged in)", () => {
    expect(PLACES.find((p) => p.name === "Jericho")?.eras).toContain("jesus");
  });

  it("gives each place a verse that names it, a known level and scope", () => {
    for (const place of PLACES) {
      expect(place.verse).toBeGreaterThan(1_000_000);
      expect(place.verseCount).toBeGreaterThan(0);
      expect(["holy", "wider"]).toContain(place.scope);
    }
  });

  it("makes every Beginner choice in curation.json a Beginner place, and keeps widely disputed places out", () => {
    for (const entry of curation.beginner) expect(PLACE_BY_ID.get(entry.id)?.tier, entry.name).toBe(1);
    for (const id of curation.forceDisputed) expect(PLACE_BY_ID.has(id)).toBe(false);
    expect(PLACES.some((p) => p.name === "Mount Sinai" || p.name === "Sodom")).toBe(false);
  });
});

describe("map quest disputed sites", () => {
  it("lists every curated place with two or more proposed sites, a note and a source", () => {
    expect(DISPUTED).toHaveLength(curation.disputed.length);
    for (const place of DISPUTED) {
      expect(place.sites.length, place.name).toBeGreaterThanOrEqual(2);
      expect(place.note.trim()).not.toBe("");
      expect(place.source).toMatch(/^https:\/\/www\.openbible\.info\/geo\/ancient\//);
      for (const site of place.sites) expect(insideMap(site.lon, site.lat), `${place.name}: ${site.name}`).toBe(true);
    }
  });
});
