import { readFileSync } from "node:fs";
import path from "node:path";
import paul from "@/data/letters/paul-letters.json";
import type { LetterGroup } from "@/data/letters/types";
import { FIRST_JOURNEY, STACK_BOUNDS } from "./layer-stack-data";

const places = new Map((JSON.parse(readFileSync(path.resolve(__dirname, "../../../data/places.json"), "utf8")) as { id: string; lon: number; lat: number }[]).map((p) => [p.id, p]));

describe("Atlas home layer stack", () => {
  it("draws Paul's first journey outward as the Letters study records it, from Antioch to Derbe", () => {
    const map = (paul as unknown as LetterGroup).maps!.find((m) => m.id === "journey-1")!;
    const points: [number, number][] = [];
    for (const stop of map.stops) {
      const p = places.get(stop.placeId)!;
      const point: [number, number] = [Math.round(p.lon * 100) / 100, Math.round(p.lat * 100) / 100];
      const last = points.at(-1);
      if (!last || last[0] !== point[0] || last[1] !== point[1]) points.push(point);
    }
    const derbe = places.get(map.stops.find((s) => s.name.startsWith("Derbe"))!.placeId)!;
    const end = points.findIndex(([lon, lat]) => lon === Math.round(derbe.lon * 100) / 100 && lat === Math.round(derbe.lat * 100) / 100);
    const seleucia = places.get(map.stops.find((s) => s.name === "Seleucia")!.placeId)!;
    const isSeleucia = ([lon, lat]: [number, number]) => lon === Math.round(seleucia.lon * 100) / 100 && lat === Math.round(seleucia.lat * 100) / 100;
    expect(FIRST_JOURNEY).toEqual(points.slice(0, end + 1).filter((p) => !isSeleucia(p))); // Seleucia is drawn as part of Antioch
  });

  it("keeps the whole journey inside the area shown", () => {
    const [w, s, e, n] = STACK_BOUNDS;
    for (const [lon, lat] of FIRST_JOURNEY) expect(lon > w && lon < e && lat > s && lat < n).toBe(true);
  });
});
