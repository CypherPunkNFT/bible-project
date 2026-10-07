import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { atlasHasPlace, placeMatchesFind } from "./atlas-find";

const places = JSON.parse(readFileSync("data/places.json", "utf8")) as { name: string }[];

describe("Find … in the atlas", () => {
  it("matches the way the map's name search does: part of the name, any case", () => {
    expect(placeMatchesFind("Valley of Hebron", "hebron")).toBe(true);
    expect(placeMatchesFind("Rome", "Constantinople")).toBe(false);
  });

  it("is offered for Bible places and not for history places the map does not hold", () => {
    for (const name of ["Rome", "Jerusalem", "Damascus", "Bethlehem"]) expect(atlasHasPlace(places, name)).toBe(true);
    expect(atlasHasPlace(places, "Constantinople")).toBe(false);
    expect(atlasHasPlace(places, " ")).toBe(false);
  });
});
