import type { CityChoice } from "./city-collections";

/** A city's own atlas place: its pinned entry, else the most often named place of that name. */
export function resolveCityPlace<T extends { id: string; name: string; verses: unknown[] }>(places: T[], city: CityChoice): T | null {
  return places.find((place) => place.id === city.placeId)
    ?? places.filter((place) => place.name === city.place).sort((a, b) => b.verses.length - a.verses.length)[0] ?? null;
}
