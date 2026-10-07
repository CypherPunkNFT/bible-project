import { BookOpen, Church, Crown, Flame, Globe2, Heart, Home, Hourglass, Landmark, Leaf, ScrollText, Sun, type LucideIcon } from "lucide-react";

/** Each topic category's icon and colour, drawn from the site's reading-chart palette (src/index.css), so both themes work. */
const STYLE: Record<string, { icon: LucideIcon; tone: string }> = {
  god: { icon: Sun, tone: "epistles" },
  christ: { icon: Crown, tone: "gospels" },
  scripture: { icon: ScrollText, tone: "prophets" },
  salvation: { icon: Heart, tone: "revelation" },
  "christian-life": { icon: BookOpen, tone: "poetry" },
  sin: { icon: Flame, tone: "history" },
  church: { icon: Church, tone: "acts" },
  society: { icon: Home, tone: "history" },
  "worship-in-israel": { icon: Landmark, tone: "epistles" },
  peoples: { icon: Globe2, tone: "prophets" },
  creation: { icon: Leaf, tone: "poetry" },
  "last-things": { icon: Hourglass, tone: "apocrypha" },
};

export function categoryStyle(id: string): { Icon: LucideIcon; color: string; tab: string; box: string } {
  const style = STYLE[id] ?? { icon: BookOpen, tone: "apocrypha" };
  return { Icon: style.icon, color: `var(--${style.tone})`, tab: `var(--${style.tone}-tab)`, box: `var(--${style.tone}-box)` };
}
