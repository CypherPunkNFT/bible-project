// Blessings for the home (docs/features/home-blessings/design.md 9.1): the shape of a page and its items. Imports nothing
// through "@/", so build scripts can read the data. Verse wording is never stored: Scripture items and the verses a written
// blessing rests on are verse ids (the life-event shape, through the sympathy `sp()` helper), and the words come from the
// site's Berean files.
import type { SympathyPassage } from "../sympathy/types";

export type BlessingGroup = "house" | "table" | "children" | "scripture";
export type PrintLayout = "wall" | "cards" | "table-card" | "colouring" | "order";

export type OlderId =
  | "guiterman-house" | "come-lord-jesus" | "cennick-table" | "cennick-blood" | "god-is-great" | "leatham-world"
  | "selkirk" | "doxology" | "ken-evening" | "duncan-shepherd" | "wesley-gentle" | "watts-evening" | "now-i-lay-me";

/** An older grace or blessing, stored exactly as the printing checked (design 4.3). Its checksum is in the test file. */
export interface OlderText {
  id: OlderId;
  /** "Jesus, tender Shepherd". */
  title: string;
  /** Exactly as printed; "" marks a stanza break. */
  lines: string[];
  /** "Mary Lundie Duncan". */
  author: string;
  /** "1839" or "printed by 1698". */
  year: string;
  /** The first printing, in words. */
  source: string;
  /** URL, printing and year, and the date of the word-for-word check. */
  checkedAgainst: string;
  glosses?: { word: string; meaning: string }[];
  /** The death-line note, the angels note, a line on authorship. */
  note?: string;
  /** Duncan's third verse: shown on the page only, never printed. */
  extraLines?: { label: string; lines: string[] };
}

export interface WrittenItem {
  kind: "written";
  /** Its anchor on the page: "front-door", "every-day". */
  id: string;
  /** "A blessing at the front door", "A grace for every day". */
  label: string;
  /** Prose is one line; a rhyme keeps its line breaks ("\n"), and a blank line is a stanza break. */
  text: string;
  /** Holds "[name]": the print and send fields offer a name. */
  forSomeone?: true;
  /** A prayer a child says: 12–50 words (design 4.6). */
  forChildren?: true;
  /** 1–6 verses, role "card", built with sp(); context notes ride on the passage. */
  rootedIn: SympathyPassage[];
  layouts: PrintLayout[];
}

export interface OlderItem {
  kind: "older";
  /** The older text's id, which is also its anchor. */
  id: OlderId;
  /** "An older grace" or "An older blessing". */
  label: string;
  layouts: PrintLayout[];
}

export interface ScriptureItem {
  kind: "scripture";
  /** The passage key ("numbers-6-24-26"), set by scripture(). */
  id: string;
  passage: SympathyPassage;
  /** One line on who said it and to whom. */
  setting?: string;
  layouts: PrintLayout[];
}

/** The "My own prayer" card (design 6.3): prompts with writing lines, for a child to fill in by hand. */
export interface FillInItem {
  kind: "fill-in";
  id: "my-own-prayer";
  label: string;
  prompts: string[];
  rootedIn: SympathyPassage[];
  layouts: ("cards" | "colouring")[];
}

export type BlessingItem = WrittenItem | OlderItem | ScriptureItem | FillInItem;

/** One room of the room-by-room order (design 4.4). */
export interface Station {
  id: string;
  /** "At the front door". */
  heading: string;
  /** "(living room)"; empty when the heading says it. */
  place: string;
  /** Read by anyone. */
  reading: SympathyPassage;
  /** Said by the leader: 25–50 words, ending before "All: Amen." */
  prayer: string;
  rootedIn: SympathyPassage[];
  /** A verse shown beneath with its note (Deuteronomy 6:9 at the door, Psalm 139:13 for a baby on the way). */
  aside?: SympathyPassage;
}

export interface BlessingPage {
  slug: string;
  group: BlessingGroup;
  /** For the hub card: "A house blessing". */
  label: string;
  /** The h1. */
  heading: string;
  /** 50 characters or fewer; " · Bible Guide" is added. */
  searchTitle: string;
  /** 40–90 words; the first sentence names the page and becomes the search description. */
  intro: string;
  /** Children's styling (design 7.2). */
  forChildren?: true;
  /** The first is featured. */
  items: BlessingItem[];
  /** room-by-room only. */
  stations?: Station[];
  /** "How to do it" (room by room), "How to bless your children", a word for hosts. */
  howTo?: { title: string; text: string };
  /** One sentence linking The Good News (blessing-your-children, design 2.4 rule 4). */
  gospel?: true;
  /** 2–3 site topics; each slug and title must match data/topics/index.json. */
  topics: { slug: string; title: string }[];
  /** Sibling page slugs. */
  related: string[];
  elsewhere?: { href: string; title: string }[];
}
