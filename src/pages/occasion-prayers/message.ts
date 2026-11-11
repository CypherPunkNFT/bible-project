// Copy and send (design 6.1, 6.4): the pure builders for a prayer's copied text, its message, its links and the plain
// prayer-card description a shared verse-card generator can draw later. Nothing here stores or sends anything: the name
// a visitor types is passed in, used for this one message and dropped.
import { historicCredit, PRAYERS_PATH, type HistoricPrayer, type Occasion, type WrittenPrayer } from "@/data/occasion-prayers";
import { SITE_ORIGIN } from "@/lib/page-head";

/** What a later "Save as image" or link-preview image needs (design 6.4). */
export interface PrayerCard {
  page: string;
  anchor: string;
  label: string;
  heading: string;
  text: string;
  /** The line a copied text ends with. */
  source: string;
  /** References of the verses beneath it. */
  rootedIn: string[];
}

export const NAME_TOKEN = "[name]";
export const NAME_MAX = 40;

export type Opening = "praying" | "prayed" | "none";
export const OPENINGS: Record<Opening, string> = {
  praying: "I'm praying for you.",
  prayed: "I prayed this for you today.",
  none: "",
};

/** "A Prayer Before Surgery" -> "A prayer before surgery" (proper words keep their capital). */
export function sentenceCase(heading: string): string {
  return heading.split(" ").map((word, index) => (index === 0 || /^(Bible|I|God|Jesus)$/.test(word) ? word : word.toLowerCase())).join(" ");
}

/** The shared address, built from the site's public origin (never from the address the page is open at), with the anchor. */
export const prayerUrl = (card: Pick<PrayerCard, "page" | "anchor">): string => `${SITE_ORIGIN}${PRAYERS_PATH}/${card.page}#${card.anchor}`;

export function prayerCard(occasion: Occasion, prayer: WrittenPrayer, rootedIn: string[]): PrayerCard {
  const address = prayerUrl({ page: occasion.slug, anchor: prayer.id }).replace(/^https:\/\//, "").replace(/#.*$/, "");
  return {
    page: occasion.slug, anchor: prayer.id, label: prayer.label, heading: occasion.heading, text: prayer.text,
    source: `— ${sentenceCase(occasion.heading)}, ${address}`, rootedIn,
  };
}

export const OLDER_ANCHOR = "older-prayer";

export function historicCard(occasion: Occasion, prayer: HistoricPrayer): PrayerCard {
  return {
    page: occasion.slug, anchor: OLDER_ANCHOR, label: prayer.title, heading: occasion.heading, text: prayer.text,
    source: historicCredit(prayer), rootedIn: [],
  };
}

/** The typed name, trimmed and cut to 40 characters; empty when nothing was typed. */
export const cleanName = (name: string): string => name.trim().slice(0, NAME_MAX);

/** Every "[name]" replaced by the typed name, as plain text; left as "[name]" when no name was typed. */
export function fillName(text: string, name: string): string {
  const cleaned = cleanName(name);
  return cleaned ? text.split(NAME_TOKEN).join(cleaned) : text;
}

/** What Copy puts on the clipboard: the prayer and its source line (a 1662 text ends "BCP 1662"). */
export const copyText = (card: PrayerCard): string => `${card.text}\n\n${card.source}`;

/** The message Send builds: an optional opening line, the prayer (with the name), and the link. */
export function prayerMessage(card: PrayerCard, options: { name?: string; opening?: Opening } = {}): string {
  const opening = OPENINGS[options.opening ?? "none"];
  const body = fillName(card.text, options.name ?? "");
  const credit = card.anchor === OLDER_ANCHOR ? `\n${card.source}` : "";
  return `${opening ? `${opening}\n\n` : ""}${body}${credit}\n\n${sentenceCase(card.heading)}: ${prayerUrl(card)}`;
}

export const emailHref = (message: string) => `mailto:?subject=${encodeURIComponent("A prayer for you")}&body=${encodeURIComponent(message)}`;
export const textHref = (message: string) => `sms:?&body=${encodeURIComponent(message)}`;

/** A verse's copied text: "text — reference (BSB)". */
export const verseCopy = (verse: { text: string; reference: string }): string => `${verse.text} — ${verse.reference} (BSB)`;
