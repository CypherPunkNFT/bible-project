// What came first?: the eight categories and Mixed, in pill order (design §5.3, §9.1). Each has its pill name, the
// question that heads its rounds and the line under it, and one of the site's book-colour tones for its pill, its Mixed
// chip and the thin rule under its heading. The game's gold stays for everything else. Strings sit under the keys the
// translation collector reads (label, heading, subtitle), so they are registered rather than flagged.
import type { CategoryKey } from "./order.ts";

export type Choice = CategoryKey | "mixed";

export interface CategoryInfo {
  key: Choice;
  /** The pill's short name. */
  label: string;
  /** The round's heading: the category's question. */
  heading: string;
  /** The line under the heading. */
  subtitle: string;
  /** A book-colour tone from src/index.css (--history, --poetry, ...). */
  tone: string;
  format: "pair" | "choice" | "mixed";
}

export const CATEGORIES: readonly CategoryInfo[] = [
  { key: "lived", label: "People", heading: "Who lived first?", subtitle: "The one who came into the world first.", tone: "epistles", format: "pair" },
  { key: "happened", label: "Events", heading: "What happened first?", subtitle: "The one that took place first.", tone: "history", format: "pair" },
  { key: "ruled", label: "Rulers", heading: "Who ruled first?", subtitle: "The one who began to reign first.", tone: "prophets", format: "pair" },
  { key: "built", label: "Buildings", heading: "What was built first?", subtitle: "The one that was built or made first.", tone: "poetry", format: "pair" },
  { key: "went", label: "Journeys", heading: "Where did they go first?", subtitle: "Two stops on one journey: the one reached first.", tone: "acts", format: "pair" },
  { key: "died", label: "Deaths", heading: "Who died first?", subtitle: "The one whose death came first.", tone: "revelation", format: "pair" },
  { key: "books", label: "Books", heading: "Which comes first in your Bible?", subtitle: "The book that comes first in the Bible's order.", tone: "gospels", format: "pair" },
  { key: "firsts", label: "Bible firsts", heading: "Bible firsts", subtitle: "One question, and the first the Bible names.", tone: "poetry", format: "choice" },
  { key: "mixed", label: "Mixed", heading: "Mixed", subtitle: "A different kind of round each time.", tone: "epistles", format: "mixed" },
];

export const CHOICES: readonly Choice[] = CATEGORIES.map((c) => c.key);
export const CATEGORY_KEYS: readonly CategoryKey[] = CATEGORIES.filter((c) => c.key !== "mixed").map((c) => c.key as CategoryKey);
export const categoryInfo = (key: Choice): CategoryInfo => CATEGORIES.find((c) => c.key === key)!;
export const isChoice = (value: unknown): value is Choice => typeof value === "string" && (CHOICES as readonly string[]).includes(value);

/** The pill a new player opens on (owner, 2026-11-12): Mixed. A link from the old Who's older? address asks for "lived". */
export const DEFAULT_CHOICE: Choice = "mixed";
