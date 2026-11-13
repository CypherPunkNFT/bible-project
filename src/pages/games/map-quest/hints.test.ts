import { haversineKm } from "./geo";
import { HINTS_BY_LEVEL, circleBox, circleRing, hintCircles, viewWidthKm } from "./hints";
import { ERA_VIEWS } from "./pools";

const JERUSALEM = [35.2137, 31.7683] as const;

describe("map quest hint circles", () => {
  it("gives Beginner three circles, Standard two and Expert one", () => {
    expect(HINTS_BY_LEVEL).toEqual({ beginner: 3, standard: 2, expert: 1 });
    expect(hintCircles(JERUSALEM, ERA_VIEWS.all, "beginner", "s")).toHaveLength(3);
    expect(hintCircles(JERUSALEM, ERA_VIEWS.all, "standard", "s")).toHaveLength(2);
    expect(hintCircles(JERUSALEM, ERA_VIEWS.all, "expert", "s")).toHaveLength(1);
  });

  it("puts the place inside every circle, never at its centre, over many seeds and every era", () => {
    for (const view of Object.values(ERA_VIEWS)) {
      for (let seed = 0; seed < 200; seed++) {
        for (const circle of hintCircles(JERUSALEM, view, "beginner", `seed-${seed}`)) {
          const fromCentre = haversineKm(JERUSALEM, circle.center);
          expect(fromCentre).toBeLessThan(circle.km * 0.62);
          expect(fromCentre).toBeGreaterThan(circle.km * 0.13);
        }
      }
    }
  });

  it("halves each circle after the first, sized from the opening view", () => {
    const [first, second, third] = hintCircles(JERUSALEM, ERA_VIEWS.paul, "beginner", "s");
    expect(first.km).toBeCloseTo(viewWidthKm(ERA_VIEWS.paul) * 0.1, 5);
    expect(second.km).toBeCloseTo(first.km / 2, 5);
    expect(third.km).toBeCloseTo(first.km / 4, 5);
    expect(hintCircles(JERUSALEM, ERA_VIEWS.jesus, "beginner", "s")[2].km).toBeGreaterThanOrEqual(4); // never smaller than 4 km
  });

  it("draws the same circles for the same seed, and different ones for another", () => {
    expect(hintCircles(JERUSALEM, ERA_VIEWS.all, "beginner", "daily-3:jerusalem")).toEqual(hintCircles(JERUSALEM, ERA_VIEWS.all, "beginner", "daily-3:jerusalem"));
    expect(hintCircles(JERUSALEM, ERA_VIEWS.all, "beginner", "daily-4:jerusalem")).not.toEqual(hintCircles(JERUSALEM, ERA_VIEWS.all, "beginner", "daily-3:jerusalem"));
  });

  it("outlines a closed ring at the circle's radius, inside its box", () => {
    const circle = hintCircles(JERUSALEM, ERA_VIEWS.kingdoms, "expert", "s")[0];
    const ring = circleRing(circle);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    const [west, south, east, north] = circleBox(circle);
    for (const point of ring) {
      expect(haversineKm(point, circle.center) / circle.km).toBeGreaterThan(0.98);
      expect(haversineKm(point, circle.center) / circle.km).toBeLessThan(1.02);
      expect(point[0]).toBeGreaterThanOrEqual(west - 1e-9);
      expect(point[0]).toBeLessThanOrEqual(east + 1e-9);
      expect(point[1]).toBeGreaterThanOrEqual(south - 1e-9);
      expect(point[1]).toBeLessThanOrEqual(north + 1e-9);
    }
  });
});
