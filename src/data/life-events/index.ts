// Life-event verse packs: every pack, the four families the hub groups them in, and the addresses the sitemap lists.
// Adding a pack means adding one entry to a family file; the hub, the routes, the sitemap and the tests follow by themselves.
import { FAITH_EVENTS } from "./faith";
import { GROWING_EVENTS } from "./growing";
import { LOVE_EVENTS } from "./love";
import { NEW_LIFE_EVENTS } from "./new-life";
import type { LifeEvent, LifeEventFamily } from "./types";

export type { LifeEvent, LifeEventCard, LifeEventFamily, LifeEventPassage, PassageRole } from "./types";

export const LIFE_EVENTS_PATH = "/life-events";

/** The families in hub order, each with the site's category colour it uses (design 6.6): `tone` names the theme variable
 * the screen uses, `colour` is its fixed light-theme value, for paper. */
export const LIFE_EVENT_FAMILIES: { id: LifeEventFamily; title: string; tone: string; colour: string }[] = [
  { id: "love", title: "Love and marriage", tone: "poetry", colour: "#18716a" },
  { id: "new-life", title: "New life", tone: "gospels", colour: "#6b38a3" },
  { id: "faith", title: "Faith", tone: "acts", colour: "#a3378c" },
  { id: "growing", title: "Growing and working", tone: "epistles", colour: "#87610a" },
];

export const LIFE_EVENTS: LifeEvent[] = [...LOVE_EVENTS, ...NEW_LIFE_EVENTS, ...FAITH_EVENTS, ...GROWING_EVENTS];

export function lifeEventBySlug(slug: string | undefined): LifeEvent | undefined {
  return LIFE_EVENTS.find((event) => event.slug === slug);
}

export function familyOf(event: LifeEvent): (typeof LIFE_EVENT_FAMILIES)[number] {
  const family = LIFE_EVENT_FAMILIES.find((item) => item.id === event.family);
  if (!family) throw new Error(`life-events: pack "${event.slug}" names an unknown family "${event.family}"`);
  return family;
}

export const lifeEventPath = (event: LifeEvent): string => `${LIFE_EVENTS_PATH}/${event.slug}`;

/** The hub and every pack page: the one list the sitemap inventory and its test both use. */
export function lifeEventPaths(): string[] {
  return [LIFE_EVENTS_PATH, ...LIFE_EVENTS.map(lifeEventPath)];
}
