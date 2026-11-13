// Who lived first? (category 1): the adapter that brings in Who's older?'s pool unchanged (design §4.1). The data is
// src/data/whos-older/whos-older.json exactly as Who's older? builds it; each person becomes an item whose window is
// the birth window. Type-only import, so Node can load this file as it is.
import type { Character, WhosOlderData } from "../../whos-older/game";
import type { Item } from "../order.ts";

export type LivedItem = Item & Pick<Character, "tag" | "when" | "brief" | "href">;

export function livedItems(data: Pick<WhosOlderData, "characters">): LivedItem[] {
  return data.characters.map((c) => ({ id: c.id, label: c.label, english: c.english, tier: c.tier, lo: c.lo, hi: c.hi,
    shown: c.shown, tag: c.tag, when: c.when, brief: c.brief, href: c.href }));
}
