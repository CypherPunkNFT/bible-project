import { readFileSync } from "node:fs";
import path from "node:path";
import paul from "@/data/letters/paul-letters.json";
import type { LetterGroup } from "@/data/letters/types";
import { buildPaulJourney } from "./paul-journey";

const journey = buildPaulJourney(paul as unknown as LetterGroup);
const places = new Set((JSON.parse(readFileSync(path.resolve(__dirname, "../../../data/places.json"), "utf8")) as { id: string }[]).map((p) => p.id));

describe("Paul's guided journey", () => {
  it("has seven story chapters in order, from the early years to Rome", () => {
    expect(journey.story.map((c) => c.id)).toEqual(["early-years", "journey-1", "journey-2", "journey-3", "arrest", "voyage-rome", "rome"]);
  });

  it("puts every stop on a real atlas place, with a passage, a cited source, or a note saying whose proposal it is", () => {
    for (const chapter of [...journey.story, ...journey.letters]) {
      for (const stop of chapter.stops) {
        expect(places.has(stop.placeId), `${chapter.id}: ${stop.name} (${stop.placeId})`).toBe(true);
        if (stop.layer === "proposed") expect(stop.note, `${chapter.id}: ${stop.name}`).toBeTruthy();
        else expect(stop.refs.length + stop.cites.length, `${chapter.id}: ${stop.name}`).toBeGreaterThan(0);
      }
    }
  });

  it("marks what later writers tell (release, death in Rome) as tradition, and cites them", () => {
    const rome = journey.story.at(-1)!;
    expect(rome.stops.map((s) => s.layer)).toEqual(["scripture", "tradition", "tradition"]);
    const cited = new Set(journey.citations.map((c) => c.id));
    for (const stop of rome.stops.filter((s) => s.layer === "tradition")) expect(stop.cites.every((id) => cited.has(id))).toBe(true);
    expect(journey.story.slice(0, -1).every((c) => c.stops.every((s) => s.layer === "scripture"))).toBe(true);
    expect(journey.letters.flatMap((c) => c.stops).filter((s) => s.layer === "proposed").map((s) => s.name)).toEqual(["Ephesus"]);
  });

  it("dates every story chapter from the cited scholars, within Paul's lifetime", () => {
    for (const chapter of journey.story) {
      expect(chapter.years, chapter.id).toBeDefined();
      const [from, to] = chapter.years!;
      expect(from).toBeGreaterThanOrEqual(30);
      expect(to).toBeLessThanOrEqual(68);
      expect(from).toBeLessThanOrEqual(to);
    }
    expect(journey.datingCites).toContain("ramsay-1895");
  });
});
