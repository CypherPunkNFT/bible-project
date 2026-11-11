// "What the Bible says when you're..." (docs/features/when-youre/design.md 9.1): the shape of a topic page. Imports
// nothing through "@/", so build scripts can read the data. Verse wording is never stored: passages are verse ids
// (the life-event shape, through the sympathy `sp()` helper), and the words come from the site's Berean files.
import type { SympathyPassage } from "../sympathy/types";

/** Hold = "card", Read = "reading", Pray = "blessing" in the shared role type (design 4.1). `believer` is "For a believer". */
export type TopicPassage = SympathyPassage;

/** urgent: help box first; line: calm strip under the intro and foot help; foot: foot help only; none: the quiet line only. */
export type HelpLevel = "urgent" | "line" | "foot" | "none";

export type TopicGroup = "heart" | "body" | "life";

export interface WhenTopic {
  /** "anxious": the address /when-youre/anxious. */
  slug: string;
  group: TopicGroup;
  /** "Anxious", for the hub card. */
  label: string;
  /** The h1: "What the Bible Says When You're Anxious". */
  heading: string;
  /** "Bible Verses for Anxiety and Worry" (50 characters or fewer; " · Bible Guide" is added). */
  searchTitle: string;
  /** 40–110 words; the first sentence names the feeling and becomes the search description. */
  intro: string;
  /** 6–8 card, 1–3 reading, exactly 1 blessing; the first card is the featured verse. */
  passages: TopicPassage[];
  /** "Someone who felt this way": /people/<id>. */
  person?: { id: string; line: string };
  /** "A word for you", 120–250 words; paragraphs separated by a blank line. */
  note: string;
  /** Directory ids from resources/life.json shown at the foot ("line" and "foot" pages). */
  help: { level: HelpLevel; entries: string[]; extra?: { label: string; href: string }[] };
  /** 2–4 site topics, /topics/<slug>; each slug and title must match data/topics/index.json. */
  topics: { slug: string; title: string }[];
  /** 2–4 sibling slugs. */
  related: string[];
  /** Sympathy doors, apologetics, The Good News. */
  elsewhere?: { href: string; title: string }[];
  /** Plain words for the hub filter; never rendered as page text. */
  words: string[];
}
