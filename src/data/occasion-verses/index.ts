// The occasion verse picker's occasions (design 2–3): the life-event packs and the funeral and sympathy sets read through
// adapters, so a pack or a loss page added later appears here by itself, plus the picker's own wedding parts,
// confirmation and birthday. Every passage keeps its permanent key (../sympathy/card-keys.ts).
import { LIFE_EVENTS, lifeEventPath, type LifeEvent, type PassageRole } from "../life-events";
import {
  FUNERAL_HEADING, FUNERAL_INTRO, FUNERAL_PATH, FUNERAL_READINGS, HUB_SET, KEY_ALIASES, LOSS_SETS, SERVICE_PARTS, SYMPATHY_PATH,
  normaliseKey, passageKey, sympathySetPath, type SympathySet,
} from "../sympathy";
import { BIRTHDAY } from "./birthday";
import { BIRTHDAY_BY_DATE } from "./birthday-by-date";
import { CONFIRMATION } from "./faith";
import { OCCASION_GROUPS, type CertificateKind, type Occasion, type OccasionGroup, type OccasionPassage, type OccasionSection } from "./types";
import { weddingSections } from "./wedding";

export type { CertificateKind, Occasion, OccasionGroup, OccasionPassage, OccasionSection } from "./types";
export { OCCASION_GROUPS } from "./types";
export { WEDDING_ORDER_NOTE } from "./wedding";
export { BIRTHDAY_BY_DATE, allBirthdayDates, birthdayDatesComplete, monthDayOf } from "./birthday-by-date";

export const OCCASION_PATH = "/occasion-verses";

const ROLE_SECTIONS: { role: PassageRole; id: string; title: string }[] = [
  { role: "reading", id: "readings", title: "Readings for the service" },
  { role: "card", id: "card", title: "Short verses for a card or program" },
  { role: "blessing", id: "blessing", title: "A blessing to close" },
];

/** A pack's or a set's passages in the three role sections, empty ones left out. */
function roleSections(passages: OccasionPassage[], titles: Partial<Record<PassageRole, string>> = {}): OccasionSection[] {
  return ROLE_SECTIONS
    .map(({ role, id, title }) => ({ id, title: titles[role] ?? title, passages: passages.filter((passage) => passage.role === role) }))
    .filter((section) => section.passages.length > 0);
}

const PACK_GROUPS: Record<LifeEvent["family"], OccasionGroup> = { love: "wedding", "new-life": "life", faith: "faith", growing: "life" };
const PACK_CERTIFICATES: Record<string, CertificateKind> = { wedding: "wedding", baptism: "baptism", "baby-dedication": "dedication" };

function fromPack(event: LifeEvent): Occasion {
  const occasion: Occasion = {
    slug: event.slug,
    group: PACK_GROUPS[event.family],
    title: event.short,
    heading: event.heading,
    intro: event.intro,
    sections: event.slug === "wedding" ? weddingSections(event) : roleSections(event.passages),
    more: [{ href: lifeEventPath(event), title: "Open the full page, with a card to print" }],
  };
  if (event.explainer) occasion.explainer = { title: event.explainer.title, paragraphs: [event.explainer.text] };
  const certificate = PACK_CERTIFICATES[event.slug];
  if (certificate) occasion.certificate = certificate;
  return occasion;
}

const SET_TITLES = { reading: "Passages to read", card: "Verses for a card", blessing: "A blessing" } as const;

function fromSympathySet(set: SympathySet): Occasion {
  const occasion: Occasion = {
    slug: set.slug ? `sympathy-${set.slug}` : "sympathy",
    group: "loss",
    title: set.slug ? set.short : "Sympathy for any loss",
    heading: set.heading,
    intro: set.intro,
    sections: roleSections(set.passages, SET_TITLES),
    more: [{ href: sympathySetPath(set), title: "Open the full page, with a card to send" }],
  };
  if (set.explainer) occasion.explainer = set.explainer;
  if (set.helpStrip) occasion.helpStrip = true;
  return occasion;
}

const FUNERAL: Occasion = {
  slug: "funeral",
  group: "loss",
  title: "Funeral service",
  heading: FUNERAL_HEADING,
  intro: FUNERAL_INTRO,
  sections: SERVICE_PARTS.map((part) => ({
    id: part.id, title: part.title, what: part.what,
    passages: FUNERAL_READINGS.filter((passage) => passage.servicePart === part.id),
  })),
  more: [{ href: FUNERAL_PATH, title: "Open the funeral readings page" }, { href: SYMPATHY_PATH, title: "Send a card to someone grieving" }],
};

/** Packs first in their own order inside each group, then the picker's own, then loss; the chooser groups them. */
function assemble(): Occasion[] {
  const packs = LIFE_EVENTS.map(fromPack);
  const all = [...packs, CONFIRMATION, BIRTHDAY, FUNERAL, fromSympathySet(HUB_SET), ...LOSS_SETS.map(fromSympathySet)];
  const rank = new Map(OCCASION_GROUPS.map((group, index) => [group.id, index]));
  // Stable sort: inside a group, the order above.
  return all.map((occasion, index) => ({ occasion, index }))
    .sort((a, b) => (rank.get(a.occasion.group) ?? 0) - (rank.get(b.occasion.group) ?? 0) || a.index - b.index)
    .map(({ occasion }) => occasion);
}

export const OCCASIONS: readonly Occasion[] = assemble();

const bySlug = new Map(OCCASIONS.map((occasion) => [occasion.slug, occasion]));

/** The occasion an address names, or undefined (a Map, so "__proto__" and the like name nothing). */
export const occasionBySlug = (slug: string | null | undefined): Occasion | undefined => (slug ? bySlug.get(slug) : undefined);

/** Where a key first appears: its passage, and the occasion and section holding it. What a list key can name. */
export interface PassagePlace { key: string; passage: OccasionPassage; occasion: Occasion; section: OccasionSection }

const byKey = new Map<string, PassagePlace>();
for (const occasion of OCCASIONS) {
  for (const section of occasion.sections) for (const passage of section.passages) {
    const key = passageKey(passage);
    if (!byKey.has(key)) byKey.set(key, { key, passage, occasion, section });
  }
}
// The Birthday occasion's date field (birthday-verses design 7.5) adds a date's verse to Our list, so every date's
// verse is a key too; a verse the occasion already shows keeps its own place.
const BIRTHDAY_DATE_SECTION: OccasionSection = { id: "by-date", title: "A verse for a birthday date", passages: [] };
for (const passage of Object.values(BIRTHDAY_BY_DATE)) {
  const key = passageKey(passage);
  if (!byKey.has(key)) byKey.set(key, { key, passage, occasion: BIRTHDAY, section: BIRTHDAY_DATE_SECTION });
}

/** The place a list key names, directly or through a retired key's alias, or undefined. */
export function placeByKey(raw: string | null | undefined): PassagePlace | undefined {
  const key = normaliseKey(raw);
  return byKey.get(key) ?? byKey.get(KEY_ALIASES[key] ?? "");
}

/** Every key the picker can name, in occasion order. */
export const occasionKeys = (): string[] => [...byKey.keys()];

/** The picker has one address; occasions are chosen inside it. */
export const occasionPaths = (): string[] => [OCCASION_PATH];
