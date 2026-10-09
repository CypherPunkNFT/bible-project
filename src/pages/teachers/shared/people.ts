// Shared look-ups for the Preachers & authors page, so every section colours and groups people the same way.
// Each person belongs to one family, taken from their traditions in the library's author registry, coloured with the
// site's own section colours.
import type { Person } from "@/data/teachers/pages-types";

export interface Family { key: string; label: string; tone: string }
export const FAMILIES: Family[] = [
  { key: "puritan", label: "Puritans", tone: "--history" },
  { key: "baptist", label: "Baptists", tone: "--poetry" },
  { key: "anglican", label: "Anglicans", tone: "--acts" },
  { key: "methodist", label: "Methodists", tone: "--apocrypha" },
  { key: "continental-reformed", label: "Dutch & Swiss Reformed", tone: "--gospels" },
  { key: "presbyterian", label: "Presbyterians", tone: "--prophets" },
  { key: "calvinist-evangelical", label: "Evangelicals", tone: "--epistles" },
  { key: "reformed", label: "Reformed", tone: "--revelation" },
];
const FAMILY_ORDER = ["baptist", "methodist", "anglican", "puritan", "continental-reformed", "presbyterian", "calvinist-evangelical", "reformed"];
// Brainerd has no tradition in the registry; Wesley (an Anglican priest) led the Methodists; Moody, a Congregational
// lay evangelist who founded an independent church, sits with the evangelicals.
const FAMILY_OVERRIDES: Record<string, string> = { "author-l13-david-brainerd": "presbyterian", "author-john-wesley": "methodist", "author-d-l-moody": "calvinist-evangelical" };

export function familyOf(person: Person): Family {
  const key = FAMILY_OVERRIDES[person.id] ?? FAMILY_ORDER.find((k) => person.traditions.includes(k)) ?? "reformed";
  return FAMILIES.find((f) => f.key === key) ?? FAMILIES[FAMILIES.length - 1];
}

export const THIS_YEAR = 2026;
export const lifeEnd = (person: Person) => person.died ?? THIS_YEAR;
export const lifeLabel = (person: Person) => `${person.circa ? "c. " : ""}${person.born}–${person.died ?? ""}`;

/** Where a person was living in a given year (places carry the year they arrived), or null outside their life. */
export function placeIn(person: Person, year: number) {
  if (year < person.born || year > lifeEnd(person)) return null;
  let found = person.places[0];
  for (const place of person.places) if (place[3] <= year) found = place;
  return { name: found[0], lat: found[1], lon: found[2], index: person.places.indexOf(found) };
}

/** Share of a person's catalogued works that are sermons (0–1); people with no works return null. */
export const sermonShare = (person: Person) => (person.works ? (person.genres.sermon ?? 0) / person.works : null);
export const formatNumber = (n: number) => n.toLocaleString("en-GB");
