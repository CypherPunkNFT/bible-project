// The link-preview pictures' list and the card pages' ready-made HTML (docs/features/verse-cards/design.md 8): which
// passages get a picture, their Berean words from the site's own files, the card each picture shows, and each page's
// head. Pure, so src/pages/verse-cards/previews.test.ts checks it without a browser; previews.mjs draws and writes.
// Relative imports only: Bun runs this and does not read the site's "@/" shortcut.
import { BOOK_NUMBERS } from "../../src/data/life-events/types.ts";
import { formatRange } from "../../src/lib/refs.ts";
import type { Catalog } from "../../src/lib/types.ts";
import { DEFAULT_LOOK, hasOwn } from "../../src/lib/verse-card/looks.ts";
import { CARD_PATH, cardKey, cardPageUrl, readerPath, refFromKey, verseId, type CardRef } from "../../src/lib/verse-card/links.ts";
import { closeNoteGaps, MAX_TEXT, type CardSpec } from "../../src/lib/verse-card/spec.ts";
import { SITE_ORIGIN } from "../../src/lib/page-head.ts";
import { QUICK_KEYS } from "../../src/pages/verse-cards/quick.ts";
import { body, escape, fillShell, replaceOnce, type Capture } from "../seo/shell.ts";

/** The design version in every picture's address: a changed look needs a new address, because chat apps keep an old
 *  picture for an old address for weeks (design 2.3). */
export const PREVIEW_VERSION = "v1";
export const PREVIEW_FOLDER = `cards/preview/${PREVIEW_VERSION}`;
export const PICTURE = { width: 1200, height: 630 };
/** Chat apps often skip a preview picture over about 300 KB (design 2.3). */
export const MAX_PICTURE_BYTES = 300_000;
/** Cloudflare Workers refuses a release over 100,000 files; the site's own copies stop at the same figure
 *  (scripts/seo/build.ts FILE_BUDGET). */
export const FILE_LIMIT = 99_500;
const ALT_WORDS = 300;
const DESCRIPTION_WORDS = 110;

/** One passage that gets a picture: its card key, verses, Berean words and the reference as the site writes it. */
export interface PreviewPassage { key: string; ref: CardRef; text: string; reference: string }

/** What the verse-of-the-day schedule (src/data/verse-of-the-day/schedule.json) holds that matters here. */
export interface ScheduleFile { poolOrder: string[]; days: Record<string, string | { passage: string }> }

/** "JHN.3.16" or "NUM.6.24-26", as the schedule writes passages, as card verses; null for anything else. */
export function refFromScheduleId(id: string): CardRef | null {
  const match = /^([1-3]?[A-Z]{2,3})\.([1-9]\d{0,2})\.([1-9]\d{0,2})(?:-([1-9]\d{0,2}))?$/.exec(id);
  if (!match || !hasOwn(BOOK_NUMBERS, match[1])) return null;
  const first = Number(match[3]);
  const last = match[4] ? Number(match[4]) : first;
  return last >= first ? { book: BOOK_NUMBERS[match[1]], chapter: Number(match[2]), first, last } : null;
}

/** Every curated passage once, in order: the schedule's (when given) and then the start page's six. `problems` names
 *  any entry that is not a run of whole verses inside one chapter. */
export function previewRefs(schedule: ScheduleFile | null): { refs: { key: string; ref: CardRef }[]; problems: string[] } {
  const scheduled = schedule ? [...schedule.poolOrder, ...Object.values(schedule.days).map((day) => (typeof day === "string" ? day : day.passage))] : [];
  const seen = new Map<string, CardRef>();
  const problems: string[] = [];
  for (const id of scheduled) {
    const ref = refFromScheduleId(id);
    if (!ref) { problems.push(`schedule passage "${id}": not a run of verses inside one chapter`); continue; }
    seen.set(cardKey(ref), ref);
  }
  for (const key of QUICK_KEYS) {
    const ref = refFromKey(key);
    if (!ref) { problems.push(`quick choice "${key}": not a card key`); continue; }
    seen.set(key, ref);
  }
  return { refs: [...seen].map(([key, ref]) => ({ key, ref })), problems };
}

/** The passage's Berean words from its book's plain file (data/plain/bsb/<BOOK>.json, "chapter:verse" -> words), or
 *  the reason it gets no picture. */
export function previewPassage(catalog: Catalog, plain: Record<string, string>, key: string, ref: CardRef): PreviewPassage | string {
  const words: string[] = [];
  for (let verse = ref.first; verse <= ref.last; verse++) {
    const text = plain[`${ref.chapter}:${verse}`];
    if (!text) return `${key}: the Berean has no verse ${ref.chapter}:${verse} in this book`;
    words.push(closeNoteGaps(text)); // per verse: Ephesians 3:14 itself starts with "..."
  }
  const text = words.join(" ");
  if (text.length > MAX_TEXT) return `${key}: ${text.length} characters, more than a card holds (${MAX_TEXT})`;
  const reference = formatRange(catalog, verseId(ref.book, ref.chapter, ref.first), verseId(ref.book, ref.chapter, ref.last));
  return { key, ref, text, reference };
}

/** The card a preview shows: the card page's own card in the default design, with no heading and no visitor's line
 *  (previews are public files that chat apps cache, design 8.1). */
export const previewSpec = (passage: PreviewPassage): CardSpec => ({
  passage: { text: passage.text, reference: passage.reference, book: passage.ref.book },
  link: cardPageUrl(passage.key),
  look: DEFAULT_LOOK,
});

export const pictureFile = (key: string) => `${PREVIEW_FOLDER}/${key}.png`;
export const pictureUrl = (key: string) => `${SITE_ORIGIN}/${pictureFile(key)}`;
/** Where the card page's ready-made copy goes in the release, so the static server answers /verse-cards/<key> with it
 *  as it does for the main pages (scripts/seo/build.ts readyMadeFile). */
export const pageFile = (key: string) => `${CARD_PATH.slice(1)}/${key}.html`;

/** The first words of a text up to `limit` characters, cut at a word, with "…" when cut. */
export function firstWords(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit + 1).replace(/\s+\S*$/, "");
  return `${(cut || text.slice(0, limit)).replace(/[\s,;:.]+$/, "")}…`;
}

/** The release's index.html as this card's page: its title, description and address (the shared fillShell), its verse
 *  and links for search engines, and its picture in the four picture tags. Fails loudly if the shell lost a tag. */
export function cardPageHtml(shell: string, passage: PreviewPassage): string {
  const chapter = passage.reference.replace(/:.*$/, "");
  const title = `${passage.reference}: a verse card | Bible Guide`;
  const description = `“${firstWords(passage.text, DESCRIPTION_WORDS)}” ${passage.reference}, Berean Standard Bible: a picture of the verse to save and share, free.`;
  const capture: Capture = {
    path: `${CARD_PATH}/${passage.key}`, capturedAt: "", base: SITE_ORIGIN, title, heading: passage.reference, paragraph: passage.text,
    blocks: [{ tag: "h1", text: passage.reference }, { tag: "p", text: passage.text }],
    links: [{ path: readerPath(passage.ref), text: `Read ${chapter}` }, { path: CARD_PATH, text: "Make a verse card" }],
  };
  const html = fillShell(shell, { title, description, canonical: cardPageUrl(passage.key), alternates: [] }, body(capture));
  return withPicture(html, pictureUrl(passage.key), `A verse card: “${firstWords(passage.text, ALT_WORDS)}” ${passage.reference}, Berean Standard Bible, bibleguide.io`);
}

/** Swaps the picture and its description in the shell's og:image, og:image:alt, twitter:image and twitter:image:alt. */
export function withPicture(html: string, url: string, alt: string): string {
  const tags: [string, string][] = [['property="og:image"', url], ['property="og:image:alt"', alt], ['name="twitter:image"', url], ['name="twitter:image:alt"', alt]];
  return tags.reduce((page, [attribute, value]) => replaceOnce(page, new RegExp(`<meta ${attribute} content="[^"]*" />`), `<meta ${attribute} content="${escape(value)}" />`, attribute), html);
}

/** Why a picture cannot be a preview (not a PNG, not 1200 × 630, too heavy), or null when it can. */
export function pictureProblem(bytes: Uint8Array): string | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const header = [0x49, 0x48, 0x44, 0x52]; // "IHDR", the chunk that holds the size
  if (bytes.length < 24 || signature.some((byte, index) => bytes[index] !== byte) || header.some((byte, index) => bytes[12 + index] !== byte)) return "not a PNG file";
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width !== PICTURE.width || height !== PICTURE.height) return `${width} × ${height} px, expected ${PICTURE.width} × ${PICTURE.height}`;
  if (bytes.length > MAX_PICTURE_BYTES) return `${Math.round(bytes.length / 1000)} KB, over the ${MAX_PICTURE_BYTES / 1000} KB chat apps take`;
  return null;
}

/** The release's file count once the previews are added, with an error naming it when it passes the limit. */
export function fileBudget(existing: number, adding: number): { total: number; problem: string | null } {
  const total = existing + adding;
  return { total, problem: total > FILE_LIMIT ? `the release would hold ${total} files, over the ${FILE_LIMIT} Cloudflare allows; nothing was written` : null };
}
