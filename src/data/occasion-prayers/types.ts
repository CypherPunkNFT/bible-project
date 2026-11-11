// Prayers for occasions (docs/features/occasion-prayers/design.md 7.1): the shape of an occasion page. Imports nothing
// through "@/", so build scripts can read the data. Verse wording is never stored: the verses a prayer rests on are verse
// ids (the life-event shape, through the sympathy `sp()` helper), and the words come from the site's Berean files.
import type { SympathyPassage } from "../sympathy/types";

export type OccasionGroup = "health" | "work" | "home" | "hard" | "journeys" | "church";

/** A prayer written once for the site. Its id is its anchor on the page: "for-you", "for-someone", "after", "family"… */
export interface WrittenPrayer {
  id: string;
  /** "For you", "For someone you love", "For the family waiting". */
  label: string;
  /** 60–140 words, ending "amen."; "[name]" only when forSomeone, never at the start of a sentence. */
  text: string;
  /** Shows the name field and defaults the opening line to "I'm praying for you." */
  forSomeone?: true;
  /** 2–5 verses, role "card", built with sp(); context notes ride on the passage. */
  rootedIn: SympathyPassage[];
}

export type HistoricId =
  | "bcp-grace" | "bcp-peace" | "bcp-perils" | "bcp-purity" | "bcp-prevent" | "bcp-sick" | "bcp-advent-2" | "bcp-trinity-4"
  | "breastplate";

/** An older prayer, stored exactly as printed (design 4.4). */
export interface HistoricPrayer {
  id: HistoricId;
  /** "The beginning of this day". */
  title: string;
  /** Exactly as design 4.4; a checksum test holds it. */
  text: string;
  /** "Book of Common Prayer, 1662: Morning Prayer, the Third Collect, for Grace". */
  source: string;
  rights: "bcp-1662-crown" | "public-domain";
  /** One line on an old word. */
  explanation?: string;
  /** Where and when the word-for-word check was made. */
  checkedAgainst: string;
}

export interface Occasion {
  /** "before-surgery": the address /prayers/before-surgery. */
  slug: string;
  group: OccasionGroup;
  /** "Before surgery", for the hub card. */
  label: string;
  /** The h1: "A Prayer Before Surgery". */
  heading: string;
  /** 50 characters or fewer; " · Bible Guide" is added. */
  searchTitle: string;
  /** 40–90 words; the first sentence names the occasion and becomes the search description. */
  intro: string;
  /** "A word before you pray", 60 words or fewer, on the few pages that need one. */
  before?: string;
  /** 1–3; the first is featured. */
  prayers: WrittenPrayer[];
  historic?: HistoricId;
  /** closing-a-meeting only: Numbers 6:24–26, shown as Scripture. */
  scriptureBlessing?: SympathyPassage;
  /** 2–3 site topics, /topics/<slug>; each slug and title must match data/topics/index.json. */
  topics: { slug: string; title: string }[];
  /** 2–4 sibling occasion slugs. */
  related: string[];
  /** "When you're…" pages, life-event packs, sympathy, The Good News. */
  elsewhere?: { href: string; title: string }[];
  /** Plain words for the hub filter; never rendered. */
  words: string[];
}
