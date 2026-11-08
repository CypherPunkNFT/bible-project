// The day card's description and look (design 7.5, 8.4): plain data, so the shared verse-card generator can draw the same
// card later for "Save as image" and link previews.
import type { CountdownDay, Occasion } from "@/data/countdowns";

export type CardLook = "advent" | "christmas" | "lent" | "palm" | "easter" | "plain";

/** The plain description of a card: everything needed to draw it anywhere. */
export interface CardDescription {
  occasion: string;
  key: string;
  line: string;
  verse: string;
  reference: string;
  look: CardLook;
  /** "bibleguide.io/countdowns/advent". */
  address: string;
}

/** The card's look: the occasion's, with Christmas Day, Palm Sunday and Easter Day set apart. */
export function cardLook(occasion: Occasion, day: CountdownDay): CardLook {
  if (occasion.style === "advent") return day.key === "dec-25" ? "christmas" : "advent";
  if (occasion.style === "lent") return day.key === "sunday-6" ? "palm" : day.key === "easter" ? "easter" : "lent";
  return "plain";
}
