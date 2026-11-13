import type { LineString, Polygon } from "geojson";
import { insidePolygon, nearestOnShape } from "./area";
import { PLACES, SHAPES } from "./data";
import { questionFromPlace, scorePin } from "./game";
import { haversineKm } from "./geo";

const square: Polygon = { type: "Polygon", coordinates: [[[35, 31], [36, 31], [36, 32], [35, 32], [35, 31]]] };
const river: LineString = { type: "LineString", coordinates: [[35.5, 31], [35.5, 33]] };
const byName = (name: string) => PLACES.find((place) => place.name === name)!;

describe("distance to a river or region", () => {
  it("counts a pin inside a region as 0 km, scored at the pin itself", () => {
    expect(nearestOnShape([35.4, 31.6], square)).toEqual({ site: [35.4, 31.6], km: 0 });
  });

  it("measures a pin outside a region to the nearest edge", () => {
    const { site, km } = nearestOnShape([34.9, 31.5], square);
    expect(site[0]).toBeCloseTo(35, 6);
    expect(site[1]).toBeCloseTo(31.5, 6);
    expect(km).toBeCloseTo(haversineKm([34.9, 31.5], [35, 31.5]), 3);
  });

  it("measures a pin beside a river to the nearest point of its line, past either end to the end", () => {
    expect(nearestOnShape([35.6, 32], river).site[1]).toBeCloseTo(32, 6);
    expect(nearestOnShape([35.5, 34], river).site).toEqual([35.5, 33]);
  });

  it("leaves a hole in a region out of it", () => {
    const ring: Polygon = { type: "Polygon", coordinates: [square.coordinates[0], [[35.4, 31.4], [35.6, 31.4], [35.6, 31.6], [35.4, 31.6], [35.4, 31.4]]] };
    expect(insidePolygon([35.5, 31.5], ring.coordinates)).toBe(false);
    expect(insidePolygon([35.2, 31.2], ring.coordinates)).toBe(true);
  });
});

describe("the game's rivers, seas, valleys and regions", () => {
  it("gives every shape place its shape, with its own point on it (hint circles centre there)", () => {
    const shaped = PLACES.filter((place) => place.shape);
    expect(shaped.length).toBeGreaterThan(100);
    for (const place of shaped) {
      const shape = SHAPES[place.id];
      expect(shape?.type, place.name).toBe(place.shape === "area" ? "Polygon" : "LineString");
      expect(nearestOnShape([place.lon, place.lat], shape).km, place.name).toBeLessThan(0.5);
    }
  });

  it("scores a pin anywhere in Moab 1,000 and one in the Jordan's water 1,000; a pin far off scores less", () => {
    const moab = questionFromPlace(byName("Moab"));
    expect(moab.shape?.type).toBe("Polygon");
    expect(scorePin(moab, [35.7, 31.4]).points).toBe(1000);
    const jordan = questionFromPlace(byName("Jordan"));
    expect(scorePin(jordan, [35.55, 32.3]).points).toBe(1000);
    expect(scorePin(jordan, [34.8, 32.1]).points).toBeLessThan(800);
  });

  it("marks a region named like a town, so no two places share a name", () => {
    expect(byName("Samaria (region)")?.shape).toBe("area");
    expect(byName("Samaria")?.shape).toBeUndefined();
  });
});
