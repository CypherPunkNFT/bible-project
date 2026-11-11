// What Copy and Share hand on: the verse's words with its reference, and a link that opens this page at that verse.
import { SITE_ORIGIN } from "@/lib/page-head";
import { verseKey, type VerseRef } from "./pick";

export const RANDOM_VERSE_PATH = "/random-verse";

/** "For God so loved the world… — John 3:16 (BSB)", as the other verse tools write it. */
export const verseText = (text: string, reference: string) => `${text} — ${reference} (BSB)`;

/** https://bibleguide.io/random-verse?v=JHN.3.16: the verse alone, without the sender's filters. */
export const verseLink = (ref: VerseRef) => `${SITE_ORIGIN}${RANDOM_VERSE_PATH}?v=${verseKey(ref)}`;

export const verseMessage = (text: string, reference: string, ref: VerseRef) => `${verseText(text, reference)}\n\n${verseLink(ref)}`;
