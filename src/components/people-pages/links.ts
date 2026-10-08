import { CITY_COLLECTIONS } from "@/pages/places/city-collections";
import { ERAS } from "@/lib/eras";
import { prophetFor, rulerHref } from "@/lib/people-pages-index";

/** Where the people pages link out to (PRESENTATION.md §2.5): the Atlas, the Letters, the harmony, the prophets guide. */

/** The Atlas city card for a capital ("Jerusalem" → Ancient Israel & Judah, Jerusalem), if the Atlas has one. */
export function atlasCityHref(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const wanted = name.toLowerCase();
  for (const collection of CITY_COLLECTIONS) {
    const city = collection.cities.find((c) => c.title.toLowerCase() === wanted || c.id === wanted);
    if (city) return `/study/atlas/cities?collection=${collection.id}&focus=${city.id}&view=city`;
  }
  return undefined;
}

const LETTER_SLUG = { "paul-letters": "paul", hebrews: "hebrews", "general-letters": "james-peter-and-jude", "john-letters": "the-letters-of-john" } as const;
export const lettersHref = (group: keyof typeof LETTER_SLUG) => `/study/letters/${LETTER_SLUG[group]}`;

/** The Atlas journeys with a route for an apostle (Paul and Peter today). */
const JOURNEYS = new Set(["paul", "peter"]);
export function journeyHref(name: string): string | undefined {
  const id = name.toLowerCase();
  return JOURNEYS.has(id) ? `/study/atlas/journeys?focus=${id}` : undefined;
}

export const harmonyHref = (section: string) => `/study/harmony#event-${section}`;

/** Prophets through time, with this king's prophets lit and the rest dimmed. */
export const prophetsForKingHref = (rulerId: string) => `/study/people?view=prophets&king=${encodeURIComponent(rulerId)}`;

export const RULERS_GUIDE = { path: "/study/people?view=rulers", label: "Rulers through time" };
export const APOSTLES_GUIDE = { path: "/study/people?view=apostles", label: "The apostles" };
export const PROPHETS_GUIDE = { path: "/study/people?view=prophets", label: "Prophets through time" };

/** The era a year (BC positive) falls in, by the shared bands. */
export const eraOfYear = (year: number) => ERAS.find((era) => year <= era.from && year >= era.to);

/** A person named on a prophet page: a prophet's own word page, a ruler's reign, or the person page. */
export function personHref(personId: string): string {
  const prophet = prophetFor(personId);
  return prophet ? `/people/${prophet.id}/word` : rulerHref(personId);
}
