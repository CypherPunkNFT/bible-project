// Memory card match: the three versions of the game. Each pairs two kinds of card, called "who" and "story" in the code
// for the original version: people and their stories, places and what happened there (scripts/memory-match/places.json),
// and the two halves of a well-known verse (verse completion's pool, split in verse-cards.ts). A version names its two
// sides as the card backs show them, with an emblem and a card design each (CardArt.tsx, memory-match.css).

export type VersionKey = "people" | "places" | "verses";
export type EmblemKey = "bust" | "book" | "pin" | "spark" | "open" | "close";

export interface Side {
  /** The word on the back and on the face's top edge. */
  label: string;
  /** The card design: memory-match.css .mm-back.is-<art> and .mm-card.art-<art>. */
  art: string;
  emblem: EmblemKey;
}

export interface Version {
  key: VersionKey;
  /** The start screen's chip. */
  chip: string;
  lede: string;
  /** The end screen's heading over the pairs. */
  reading: string;
  sides: { who: Side; story: Side };
  /** The end screen's link to the who card's own page, when it has one. */
  aboutLink?: (label: string) => string;
}

export const VERSIONS: readonly Version[] = [
  {
    key: "people", chip: "People and stories", lede: "Turn over two cards at a time. Pair each person with their story.",
    reading: "The stories", aboutLink: (label) => `About ${label}`,
    sides: { who: { label: "Who", art: "who", emblem: "bust" }, story: { label: "Story", art: "story", emblem: "book" } },
  },
  {
    key: "places", chip: "Places and events", lede: "Turn over two cards at a time. Pair each place with what happened there.",
    reading: "The places", aboutLink: (label) => `${label} on the map`,
    sides: { who: { label: "Place", art: "place", emblem: "pin" }, story: { label: "Event", art: "event", emblem: "spark" } },
  },
  {
    key: "verses", chip: "Verses", lede: "Turn over two cards at a time. Pair the start of each verse with its end.",
    reading: "The verses",
    sides: { who: { label: "Begins", art: "begins", emblem: "open" }, story: { label: "Ends", art: "ends", emblem: "close" } },
  },
];

export const DEFAULT_VERSION: VersionKey = "people";

export const isVersionKey = (value: unknown): value is VersionKey => VERSIONS.some((version) => version.key === value);

export function versionOf(key: VersionKey): Version {
  const found = VERSIONS.find((version) => version.key === key);
  if (!found) throw new Error(`memory match: no version "${key}" (have ${VERSIONS.map((v) => v.key).join(", ")})`);
  return found;
}

/** The best-records key for a deck: the people version keeps the plain deck key its records were saved under. */
export const recordDeck = (version: VersionKey, deck: string) => (version === "people" ? deck : `${version}/${deck}`);
