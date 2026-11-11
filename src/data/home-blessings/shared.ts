// Pieces several blessing pages share: the context notes that travel with a verse wherever it is used (design 4.2), the
// Scripture item helper and the extra site topics. The prayers feature's notes are imported, not copied, so a note is
// written once.
import { passageKey } from "../sympathy/card-keys";
import { sp, type SympathyPassage } from "../sympathy/types";
import { GUARD_NOTE, T } from "../occasion-prayers/shared";
import type { PrintLayout, ScriptureItem } from "./types";

export { GUARD_NOTE, priestlyBlessing } from "../occasion-prayers/shared";

/** Site topics this feature links beyond the prayers feature's list (slug and title as in data/topics/index.json). */
export const TOPICS = {
  ...T,
  hospitality: { slug: "hospitality", title: "Hospitality" },
  instruction: { slug: "instruction-of-children", title: "The Instruction of Children" },
  sleep: { slug: "sleep", title: "Sleep" },
  night: { slug: "night", title: "Night" },
  thanksgiving: { slug: "thanksgiving", title: "Thanksgiving" },
  food: { slug: "food", title: "Food" },
  bread: { slug: "bread", title: "Bread" },
  praise: { slug: "praise", title: "Praise" },
};

/** The Berean words that close Joshua 24:15 (the same excerpt the prayers data uses). */
export const MY_HOUSE = "As for me and my house, we will serve the LORD!”";
/** The Berean words that close Psalm 127:2. */
export const GIVES_SLEEP = "for He gives sleep to His beloved.";

export const LUKE_10_NOTE =
  "Jesus' instruction to the seventy-two for the houses they visited. The blessing borrows his greeting as a fitting first word, not as a rite.";
export const ISAIAH_32_NOTE =
  "Isaiah describes the peace of God's people under the coming righteous King (Isaiah 32:1, 17). The blessing asks God for that kind of peace in this home; it is a prayer, not a promise that no trouble will come.";
export const ZEPHANIAH_3_NOTE =
  "God spoke this to his restored people, Jerusalem (Zephaniah 3:14–17). Christian parents pray it over their children as a picture of how God loves his own, and ask that their child would know that love.";
export const DEUTERONOMY_28_NOTE =
  "Part of the covenant blessings promised to Israel for obedience. A parent prays its picture of blessing over a child's comings and goings; it is not a promise to every family on the same terms.";
export const DEUTERONOMY_8_NOTE =
  "God's word to Israel as they entered the land. Christians have long drawn from it a habit of thanking God after eating too.";
export const HEBREWS_13_NOTE = "A reason to welcome strangers, not a promise that our guests are angels.";
export const JOSHUA_24_NOTE =
  "Joshua's own words to Israel. They are shown as his, and the site's blessings ask God for a home that serves him rather than vowing for everyone who lives in it.";

/** Psalm 121:8, always with the no-guarantee note. */
export const comingAndGoing = (note: string) => sp("PSA 121:8", "card", note, { context: GUARD_NOTE });
/** Psalm 121:3–4, with the same note (design 4.2). */
export const neverSleeps = (note: string) => sp("PSA 121:3-4", "card", note, { context: GUARD_NOTE });
export const peacefulPlace = (note: string) => sp("ISA 32:18", "card", note, { context: ISAIAH_32_NOTE });
export const quietedWithLove = (note: string) => sp("ZEP 3:17", "card", note, { context: ZEPHANIAH_3_NOTE });
export const myHouse = (note: string) => sp("JOS 24:15b", "card", note, { part: MY_HOUSE, context: JOSHUA_24_NOTE });
export const peaceToThisHouse = (note: string) => sp("LUK 10:5", "card", note, { context: LUKE_10_NOTE });
export const strangersWelcome = (note: string) => sp("HEB 13:2", "card", note, { context: HEBREWS_13_NOTE });

/** A Scripture item: its id is the passage's permanent key, so a shared link names the verse. */
export function scripture(passage: SympathyPassage, layouts: PrintLayout[], setting?: string): ScriptureItem {
  const item: ScriptureItem = { kind: "scripture", id: passageKey(passage), passage, layouts };
  if (setting) item.setting = setting;
  return item;
}
