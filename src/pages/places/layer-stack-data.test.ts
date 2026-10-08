import { readFileSync } from "node:fs";
import path from "node:path";
import paul from "@/data/letters/paul-letters.json";
import type { LetterGroup } from "@/data/letters/types";
import { FIRST_JOURNEY, STACK_BOUNDS } from "./layer-stack-data";

const places = new Map((JSON.parse(readFileSync(path.resolve(__dirname, "../../../data/places.json"), "utf8")) as { id: string; lon: number; lat: number }[]).map((p) => [p.id, p]));

describe("Atlas home layer stack", () => {
  it("draws Paul's first journey as the Letters study records it, up to Attalia (the voyage home is left off)", () => {
    const map = (paul as unknown as LetterGroup).maps!.find((m) => m.id === "journey-1")!;
    const points: [number, number][] = [];
    for (const stop of map.stops) {
      const p = places.get(stop.placeId)!;
      const point: [number, number] = [Math.round(p.lon * 100) / 100, Math.round(p.lat * 100) / 100];
      const last = points.at(-1);
      if (!last || last[0] !== point[0] || last[1] !== point[1]) points.push(point);
    }
    expect(FIRST_JOURNEY).toEqual(points.slice(0, -1));
    expect(points.at(-1)).toEqual(points[0]); // the left-off last leg returns to Antioch
  });

  it("keeps the whole journey inside the area shown", () => {
    const [w, s, e, n] = STACK_BOUNDS;
    for (const [lon, lat] of FIRST_JOURNEY) expect(lon > w && lon < e && lat > s && lat < n).toBe(true);
  });
});
