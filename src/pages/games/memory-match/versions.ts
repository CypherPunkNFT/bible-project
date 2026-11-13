// Memory card match: the three versions of the game. Each pairs two kinds of card, called "who" and "story" in the code
// for the original version: people and their stories, places and what happened there (scripts/memory-match/places.json),
// and the two halves of a well-known verse (verse completion's pool, split in verse-cards.ts). A version names its two
// sides as the card backs show them, with an emblem and a card design each (CardArt.tsx, memory-match.css).
import type { TileIconKey } from "./TileIcons";

export type VersionKey = "people" | "places" | "verses";
export type EmblemKey = "bust" | "book" | "pin" | "spark" | "open" | "close";

export interface Side {
  /** The word on the back and on the face's top edge. */
  label: string;
  /** The card design: memory-match.css .mm-back.is-<art> and .mm-card.art-<art>. */
  art: string;
  emblem: EmblemKey;
}

export interface DeckTile { icon: TileIconKey; subtitle: string }

export interface Version {
  key: VersionKey;
  /** The start screen's tile: its name and the short line under it. */
  chip: string;
  subtitle: string;
  lede: string;
  /** The end screen's heading over the pairs. */
  reading: string;
  sides: { who: Side; story: Side };
  /** The start screen's tile for each of the version's decks, by deck key: its drawing (TileIcons.tsx) and the short
   *  line under its name. */
  decks: Record<string, DeckTile>;
  /** The end screen's link to the who card's own page, when it has one. */
  aboutLink?: (label: string) => string;
}

export const VERSIONS: readonly Version[] = [
  {
    key: "people", chip: "People and stories", subtitle: "Who did what?", lede: "Turn over two cards at a time. Pair each person with their story.",
    reading: "The stories", aboutLink: (label) => `About ${label}`,
    sides: { who: { label: "Who", art: "who", emblem: "bust" }, story: { label: "Story", art: "story", emblem: "book" } },
    decks: {
      mixed: { icon: "book", subtitle: "From every deck" },
      beginnings: { icon: "sunrise", subtitle: "Adam to Joshua" },
      "judges-kings": { icon: "crown", subtitle: "Joshua to the kings" },
      prophets: { icon: "scroll", subtitle: "Elijah to Nehemiah" },
      women: { icon: "veil", subtitle: "Genesis to Acts" },
      jesus: { icon: "fish", subtitle: "In the four Gospels" },
      church: { icon: "quill", subtitle: "Acts and the letters" },
      parables: { icon: "seed", subtitle: "Stories Jesus told" },
    },
  },
  {
    key: "places", chip: "Places and events", subtitle: "What happened where?", lede: "Turn over two cards at a time. Pair each place with what happened there.",
    reading: "The places", aboutLink: (label) => `${label} on the map`,
    sides: { who: { label: "Place", art: "place", emblem: "pin" }, story: { label: "Event", art: "event", emblem: "spark" } },
    decks: {
      mixed: { icon: "book", subtitle: "From every deck" },
      beginnings: { icon: "tablets", subtitle: "Ararat to Mount Nebo" },
      "land-kings": { icon: "crown", subtitle: "Joshua to Nehemiah" },
      jesus: { icon: "fish", subtitle: "In the four Gospels" },
      church: { icon: "quill", subtitle: "Acts and Revelation" },
    },
  },
  {
    key: "verses", chip: "Verses", subtitle: "How does it end?", lede: "Turn over two cards at a time. Pair the start of each verse with its end.",
    reading: "The verses",
    sides: { who: { label: "Begins", art: "begins", emblem: "open" }, story: { label: "Ends", art: "ends", emblem: "close" } },
    decks: {
      mixed: { icon: "book", subtitle: "From every deck" },
      psalms: { icon: "lyre", subtitle: "Songs and prayers" },
      "law-prophets-wisdom": { icon: "scroll", subtitle: "The rest of the Old Testament" },
      gospels: { icon: "fish", subtitle: "Matthew to John" },
      letters: { icon: "quill", subtitle: "Romans to Revelation" },
    },
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
