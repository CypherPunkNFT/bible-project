// The birthday card (design 7.1), through the shared generator as it is: the Berean words read on the page, the heading
// "Happy birthday", the date page's address, Paper first. The visitor's own line is added by the share panel only.
import { DEFAULT_LOOK } from "@/lib/verse-card/looks";
import type { CardSpec } from "@/lib/verse-card/spec";
import { birthdayUrl } from "./dates";

export const CARD_HEADING = "Happy birthday";

export interface CardWords { text: string; reference: string; book: number }

export const toCardSpec = (date: string, words: CardWords): CardSpec => ({
  passage: words,
  heading: CARD_HEADING,
  link: birthdayUrl(date),
  look: DEFAULT_LOOK,
});
