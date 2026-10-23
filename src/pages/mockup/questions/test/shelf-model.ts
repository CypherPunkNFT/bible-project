// What the theme menus share (ThemeShelves.tsx and its mock-up variations): each shelf's and group's icon and colour,
// and the shelves cut down to the groups and tests with enough questions to show.
import {
  BookMarked, Castle, Crown, Cross, Fish, Flame, Flower2, Footprints, HandHeart, Hash, Hourglass, Landmark,
  Library, MessageCircle, Music, Scale, ScrollText, Shield, Ship, Sparkles, Sprout, Sun, Tent, Users, Waves, type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { MIN_THEME, SHELVES, type Theme } from "./themes";

export type Counted = { theme: Theme; n: number };

const ICONS: Record<string, LucideIcon> = {
  lives: Users, stories: ScrollText, teaching: Sparkles, know: Library,
  patriarchs: Tent, leaders: Shield, rulers: Crown, prophets: Flame, women: Flower2, apostles: Fish,
  beginnings: Sprout, exodus: Waves, kingdom: Landmark, exile: Castle, jesus: Footprints, church: Ship,
  god: Sun, law: Scale, salvation: Cross, life: HandHeart, words: MessageCircle, last: Hourglass,
  books: BookMarked, wisdom: Music, facts: Hash,
};
export const iconOf = (id: string) => ICONS[id] ?? Library;
export const toneOf = (tone: string) => ({ "--tone": `var(--${tone})` }) as CSSProperties;
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The shelves with only the groups and tests that have enough questions to show. */
export function shownShelves(counts: Map<string, number>) {
  return SHELVES.map((shelf) => ({
    shelf,
    groups: shelf.groups.map((group) => ({ group, themes: group.themes.map((theme) => ({ theme, n: counts.get(theme.id) ?? 0 })).filter(({ n }) => n >= MIN_THEME) }))
      .filter(({ themes }) => themes.length),
  })).filter(({ groups }) => groups.length);
}

/** The shelf and group holding the chosen test, so they can start open. */
export function homeOf(selected: string) {
  const home = SHELVES.flatMap((s) => s.groups.map((g) => ({ s, g }))).find(({ g }) => g.themes.some((t) => t.id === selected));
  return { shelf: home?.s.id ?? "", group: home?.g.id ?? "" };
}

/** The chosen test's title when it is among these groups. */
export const chosenIn = (groups: { themes: Counted[] }[], selected: string) =>
  groups.flatMap(({ themes }) => themes).find(({ theme }) => theme.id === selected)?.theme.title;

/** A shelf's line of counts: "6 groups · 22 tests". */
export const shelfMeta = (groups: { themes: Counted[] }[]) =>
  `${plural(groups.length, "group")} · ${plural(groups.reduce((sum, { themes }) => sum + themes.length, 0), "test")}`;
