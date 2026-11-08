// "Send as a message" (design 6.2): the plain text a visitor sends from their own text, email or chat app, and the links
// that open those apps. Pure functions of the card description, so they are tested without a browser. The card link is
// built from SITE_ORIGIN, never from the address the page is open at, and carries only a passage key and a style.
import { CARD_PATH } from "@/data/sympathy";
import { SITE_ORIGIN } from "@/lib/page-head";

export type CardStyle = "plain" | "olive" | "morning" | "lily";

export const CARD_STYLES: { id: CardStyle; label: string; what: string }[] = [
  { id: "plain", label: "Plain", what: "A single thin rule. Fits any loss and any faith." },
  { id: "olive", label: "Olive branch", what: "A small olive sprig, for peace (Genesis 8:11)." },
  { id: "morning", label: "Morning light", what: "A low horizon with the sun rising: joy comes in the morning (Psalm 30:5)." },
  { id: "lily", label: "Lily", what: "A single lily outline: consider the lilies of the field (Matthew 6:28)." },
];

/** A style from a link: one of the four, or plain (design 5.5, "Unknown style"). */
export function styleFrom(raw: string | null | undefined): CardStyle {
  const value = (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return CARD_STYLES.some((style) => style.id === value) ? (value as CardStyle) : "plain";
}

/** The longest personal message a "Send as a message" text takes (design 6.1). */
export const MESSAGE_LIMIT = 500;

export interface MessageCard {
  key: string;
  text: string;
  reference: string;
  style: CardStyle;
  /** The visitor's own words; never put into the link. */
  message: string;
}

/** The recipient card page's path on this site: /sympathy/card/psalm-34-18?style=olive (plain needs no style). */
export const cardPath = (key: string, style: CardStyle): string => `${CARD_PATH}/${encodeURIComponent(key)}${style === "plain" ? "" : `?style=${style}`}`;

/** The recipient card page's public address: https://bibleguide.io/sympathy/card/psalm-34-18?style=olive. */
export const cardUrl = (key: string, style: CardStyle): string => `${SITE_ORIGIN}${cardPath(key, style)}`;

/** The message: the visitor's words (if any), the verse with its reference, and the card link. */
export function buildMessage(card: MessageCard): string {
  const verse = `“${card.text}” — ${card.reference} (BSB)`;
  const own = card.message.trim().slice(0, MESSAGE_LIMIT);
  return [own, verse, cardUrl(card.key, card.style)].filter(Boolean).join("\n\n");
}

/** A mailto: link with the subject "Thinking of you" and the message as its body, with no address. */
export const mailtoHref = (body: string): string => `mailto:?subject=${encodeURIComponent("Thinking of you")}&body=${encodeURIComponent(body)}`;

/** An sms: link with no number (the visitor picks the person in their own app); `?&body=` is read by iPhone and Android. */
export const smsBodyHref = (body: string): string => `sms:?&body=${encodeURIComponent(body)}`;
