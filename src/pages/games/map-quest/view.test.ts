import { PLACES } from "./data";
import { ERA_VIEWS } from "./pools";
import { furtherAfield, inView } from "./view";

describe("the opening view", () => {
  it("counts a site inside the box, or just outside its edge, as in view", () => {
    expect(inView([35, 32], ERA_VIEWS.jesus)).toBe(true);
    expect(inView([35.37, 33.56], ERA_VIEWS.jesus)).toBe(true); // Sidon, a hair above the box's north edge
    expect(inView([44.4, 32.5], ERA_VIEWS.jesus)).toBe(false); // Babylon
  });

  it("calls a place further afield only when none of its sites is in view", () => {
    expect(furtherAfield([[44.4, 32.5]], ERA_VIEWS.jesus)).toBe(true);
    expect(furtherAfield([[44.4, 32.5], [35, 32]], ERA_VIEWS.jesus)).toBe(false);
    expect(furtherAfield([], ERA_VIEWS.jesus)).toBe(false);
  });

  it("names Babylon and Nineveh among the Beginner places off the Life of Jesus view, and none off the whole-Bible view", () => {
    const off = (era: keyof typeof ERA_VIEWS) => PLACES
      .filter((place) => place.tier === 1 && (era === "all" || place.eras.includes(era)) && furtherAfield([[place.lon, place.lat], ...place.alts], ERA_VIEWS[era]))
      .map((place) => place.name);
    expect(off("jesus")).toEqual(expect.arrayContaining(["Babylon", "Nineveh"]));
    expect(off("all")).toEqual([]);
  });
});
