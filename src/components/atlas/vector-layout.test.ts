import { describe, expect, it } from "vitest";
import { zoomIdentity } from "d3-zoom";
import { groupPlaces, labelGroups } from "./vector-layout";
import type { MapPlace } from "./projection";

const place = (id: string, x: number, y = 100): MapPlace => ({ id, name: id, x, y, lon: 35, lat: 32, type: "settlement", confidence: 1, section: "history", verses: [1] });

describe("vector atlas grouping", () => {
  it("keeps every co-located place accessible in one group, even at maximum zoom", () => {
    const places = Array.from({ length: 40 }, (_, i) => place(`place-${i}`, 100));
    const view = zoomIdentity.translate(-12600, -12600).scale(128);
    const groups = groupPlaces(places, view, 400, 400, "place-25");
    expect(groups).toHaveLength(1);
    expect(groups[0].place.id).toBe("place-25");
    expect(new Set(groups[0].members.map((p) => p.id)).size).toBe(40);
  });
  it("separates nearby places when zooming without enlarging their hit regions", () => {
    const places = [place("A", 100), place("B", 130)];
    expect(groupPlaces(places, zoomIdentity, 600, 400)).toHaveLength(1);
    expect(groupPlaces(places, zoomIdentity.scale(2), 600, 400)).toHaveLength(2);
  });
  it("places labels inside the usable map with no overlapping text boxes", () => {
    const places = Array.from({ length: 30 }, (_, i) => place(`Place ${i}`, 40 + (i % 6) * 42, 40 + Math.floor(i / 6) * 48));
    const labels = labelGroups(groupPlaces(places, zoomIdentity, 320, 320), 320, 320);
    expect(labels.length).toBeGreaterThan(3);
    for (const [i, a] of labels.entries()) {
      expect(a.x).toBeGreaterThanOrEqual(8);
      expect(a.x + a.name.length * 7.2).toBeLessThanOrEqual(312);
      for (const b of labels.slice(i + 1)) {
        expect(a.x < b.x + b.name.length * 7.2 && a.x + a.name.length * 7.2 > b.x && Math.abs(a.y - b.y) < 18).toBe(false);
      }
    }
  });
});
