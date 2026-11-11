import { SITE_ORIGIN } from "@/lib/page-head";

/** The deliberately small interface a compatible verse-card renderer can consume later. */
export interface VerseCardDescription {
  key: string;
  reference: string;
  text: string;
  page: string;
  heading: string;
}

export function cardDescription(page: string, heading: string, verse: { key: string; reference: string; text: string }): VerseCardDescription {
  return { page, heading, key: verse.key, reference: verse.reference, text: verse.text };
}

export const verseText = (card: VerseCardDescription) => `${card.text} — ${card.reference} (BSB)`;
export const verseUrl = (card: VerseCardDescription) => `${SITE_ORIGIN}/when-youre/${card.page}#${card.key}`;
export function verseMessage(card: VerseCardDescription): string {
  const urgent = card.page === "abused" || card.page === "thinking-of-suicide";
  return `${verseText(card)}\n\n${urgent ? "If you need help now, there is help at the top of this page.\n" : `${card.heading}: `}${verseUrl(card)}`;
}
export const emailHref = (message: string) => `mailto:?subject=${encodeURIComponent("A verse for you")}&body=${encodeURIComponent(message)}`;
export const textHref = (message: string) => `sms:?&body=${encodeURIComponent(message)}`;
