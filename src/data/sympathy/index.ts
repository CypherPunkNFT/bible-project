// Funeral and sympathy pages: every passage set, the funeral readings, the passage keys and the addresses the sitemap
// lists. Adding a loss page means adding one entry to a set file; the hub, the routes, the sitemap and the tests follow.
import { KEY_ALIASES, passageKey } from "./card-keys";
import { CIRCUMSTANCE_SETS } from "./circumstances";
import { FAMILY_SETS } from "./family";
import { FUNERAL_PATH_SLUG, FUNERAL_READINGS } from "./funeral";
import { HUB_SET } from "./hub";
import type { SympathyPassage, SympathySet } from "./types";

export type { ServicePart, SympathyPassage, SympathySet } from "./types";
export { KEPT_KEYS, KEY_ALIASES, KEY_BOOKS, passageKey } from "./card-keys";
export { FUNERAL_HEADING, FUNERAL_HYMNS, FUNERAL_INTRO, FUNERAL_READINGS, PARTICULAR_FAITH_NOTE, PARTICULAR_LIVES, SERVICE_PARTS } from "./funeral";
export { HUB_SET, KEEP_SHOWING_UP, LEAVE_OUT, LINES_TO_USE } from "./hub";

export const SYMPATHY_PATH = "/sympathy";
export const FUNERAL_PATH = `${SYMPATHY_PATH}/${FUNERAL_PATH_SLUG}`;
export const CARD_PATH = `${SYMPATHY_PATH}/card`;
/** The card a mistyped or cut-off link falls back to (design 5.5). */
export const DEFAULT_CARD_KEY = "psalm-34-18";

/** The twelve loss pages, in hub order. */
export const LOSS_SETS: SympathySet[] = [...FAMILY_SETS, ...CIRCUMSTANCE_SETS];

export function sympathySetBySlug(slug: string | undefined): SympathySet | undefined {
  return slug ? LOSS_SETS.find((set) => set.slug === slug) : undefined;
}

export const sympathySetPath = (set: SympathySet): string => (set.slug ? `${SYMPATHY_PATH}/${set.slug}` : SYMPATHY_PATH);

/** The hub, every loss page and the readings page: the fourteen indexable addresses (recipient cards are never listed). */
export function sympathyPaths(): string[] {
  return [SYMPATHY_PATH, ...LOSS_SETS.map(sympathySetPath), FUNERAL_PATH];
}

/** Every card verse (each set's own) and every funeral reading: the passages a link can name. */
export function keyedPassages(): SympathyPassage[] {
  const cards = [HUB_SET, ...LOSS_SETS].flatMap((set) => set.passages.filter((passage) => passage.role === "card"));
  return [...cards, ...FUNERAL_READINGS];
}

const byKey = new Map<string, SympathyPassage>();
for (const passage of [...[HUB_SET, ...LOSS_SETS].flatMap((set) => set.passages), ...FUNERAL_READINGS]) {
  const key = passageKey(passage);
  if (!byKey.has(key)) byKey.set(key, passage);
}
const funeralByKey = new Map(FUNERAL_READINGS.map((passage) => [passageKey(passage), passage]));

/** A key as a link may bring it: lower case, with stray punctuation a chat app attached trimmed from either end. */
export const normaliseKey = (raw: string | undefined | null): string => (raw ?? "").toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");

/** The passage a key names, directly or through an alias, or undefined. */
export function passageByKey(raw: string | undefined | null): SympathyPassage | undefined {
  const key = normaliseKey(raw);
  return byKey.get(key) ?? byKey.get(KEY_ALIASES[key] ?? "");
}

/** The funeral reading a list key names (directly or through an alias), or undefined: only readings may join a list. */
export function funeralReadingByKey(raw: string): SympathyPassage | undefined {
  const key = normaliseKey(raw);
  return funeralByKey.get(key) ?? funeralByKey.get(KEY_ALIASES[key] ?? "");
}
