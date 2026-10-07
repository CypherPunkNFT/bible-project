import { CITY_COLLECTIONS } from "./city-collections";
import { resolveCityPlace } from "./city-places";
import { ATLAS_BASE } from "./routes";

/**
 * The Ancient Cities page for an atlas place, if the place is one of its cities (e.g. Rome, Corinth, Ephesus).
 * `prefer` lists collections to try first, so a journey of Paul's opens Rome among the Cities of the Apostles.
 */
export function cityPageFor<T extends { id: string; name: string; verses: unknown[] }>(placeId: string, places: T[], prefer: string[] = []): string | null {
  const ordered = [...prefer.flatMap((id) => CITY_COLLECTIONS.filter((c) => c.id === id)), ...CITY_COLLECTIONS.filter((c) => !prefer.includes(c.id))];
  for (const collection of ordered) {
    const city = collection.cities.find((choice) => resolveCityPlace(places, choice)?.id === placeId);
    if (city) return `${ATLAS_BASE}/cities?${new URLSearchParams({ collection: collection.id, focus: city.id, view: "city" })}`;
  }
  return null;
}
