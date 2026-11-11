// Copy and send (design 8.1): the pure builders for an item's copied text, its message and its links. Nothing here stores
// or sends anything: a name a visitor types is passed in, used for this one message and dropped. The send message keeps
// the shape of the prayers feature's builder, copied rather than imported because that one knows about prayer occasions.
import { BLESSINGS_PATH, NAME_TOKEN, OLDER_TEXTS, olderCredit, type BlessingItem, type BlessingPage } from "@/data/home-blessings";
import { SITE_ORIGIN } from "@/lib/page-head";

export const NAME_MAX = 40;
export const NAME_HEADING_MAX = 30;
export const FAMILY_LINE_MAX = 40;

/** The shared address of an item: the site's public origin (never the address the page is open at) and its anchor. */
export const itemUrl = (page: Pick<BlessingPage, "slug">, anchor: string): string => `${SITE_ORIGIN}${BLESSINGS_PATH}/${page.slug}#${anchor}`;

/** "A Blessing at the Front Door" style labels read as a source line: "A blessing at the front door". */
const sourceLabel = (label: string): string => label.charAt(0).toUpperCase() + label.slice(1);

/** The text an item shows (Scripture's words come in from the loaded verses). */
export function itemWords(item: BlessingItem, scriptureText?: string): string {
  if (item.kind === "written") return item.text;
  if (item.kind === "older") return OLDER_TEXTS[item.id].lines.join("\n");
  if (item.kind === "scripture") return scriptureText ?? "";
  return item.prompts.join("\n");
}

/** The source line a copied item ends with (design 8.1). */
export function sourceLine(item: BlessingItem, scriptureReference?: string): string {
  if (item.kind === "older") return `— ${olderCredit(OLDER_TEXTS[item.id])}`;
  if (item.kind === "scripture") return `— ${scriptureReference ?? ""} (BSB)`;
  return `— ${sourceLabel(item.label)}, Bible Guide`;
}

/** What Copy puts on the clipboard: the words, the source line and the item's address. */
export function copyText(page: BlessingPage, item: BlessingItem, verse?: { text: string; reference: string }): string {
  return `${itemWords(item, verse?.text)}\n\n${sourceLine(item, verse?.reference)}\n${itemUrl(page, item.id)}`;
}

/** The typed name, trimmed and cut to its limit; empty when nothing was typed. */
export const cleanName = (name: string, max = NAME_MAX): string => name.trim().slice(0, max);

/** Every "[name]" replaced by the typed name; left as "[name]" when no name was typed. */
export function fillName(text: string, name: string): string {
  const cleaned = cleanName(name);
  return cleaned ? text.split(NAME_TOKEN).join(cleaned) : text;
}

export type Opening = "thinking" | "home" | "none";
export const OPENINGS: Record<Opening, string> = {
  thinking: "Thinking of you today.",
  home: "So glad for you and your new home.",
  none: "",
};

/** The two items made to give someone (design 8.1): the housewarming blessing and the Scripture blessings. */
export const sendable = (item: BlessingItem): boolean => item.kind === "scripture" || item.id === "for-a-new-home";

export const subjectFor = (item: BlessingItem): string => (item.id === "for-a-new-home" ? "A blessing for your home" : "A blessing for you");

/** The message Send builds: an optional opening line, the words (with the name), the source line and the link. */
export function blessingMessage(page: BlessingPage, item: BlessingItem, options: { name?: string; opening?: Opening; verse?: { text: string; reference: string } } = {}): string {
  const opening = OPENINGS[options.opening ?? "none"];
  const words = fillName(itemWords(item, options.verse?.text), options.name ?? "");
  return `${opening ? `${opening}\n\n` : ""}${words}\n${sourceLine(item, options.verse?.reference)}\n\n${itemUrl(page, item.id)}`;
}

export const emailHref = (subject: string, message: string) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
export const textHref = (message: string) => `sms:?&body=${encodeURIComponent(message)}`;

/** A verse's copied text: "text — reference (BSB)". */
export const verseCopy = (verse: { text: string; reference: string }): string => `${verse.text} — ${verse.reference} (BSB)`;
