// Ready-made copies of the 379 birthday pages and the date pages' link-preview cards (docs/features/birthday-verses/
// design.md 8.2, 8.3), written at release by previews.mjs. These pages are known in advance (a date, a stored note,
// Berean words), so their copies are built here rather than captured from the live site. Pure, so
// src/pages/birthday-verses/release-pages.test.ts checks it, including that its English matches the pages' own lines.
// Relative imports only: Bun runs this and does not read the site's "@/" shortcut. The copies are English; the hub's
// copy leaves out "Today", which would freeze the release day into the page.
import {
  allBirthdayDates, datePath, dayOf, HUB_PATH, matchKind, MONTH_SLUGS, monthDates, monthOf, monthPath, neighbours,
} from "../../src/data/birthday-verses/index.ts";
import { BIRTHDAY_BY_DATE } from "../../src/data/occasion-verses/birthday-by-date.ts";
import type { LifeEventPassage } from "../../src/data/life-events/types.ts";
import { pageHead, SITE_ORIGIN } from "../../src/lib/page-head.ts";
import { formatRange } from "../../src/lib/refs.ts";
import type { Catalog } from "../../src/lib/types.ts";
import { readerPath, type CardRef } from "../../src/lib/verse-card/links.ts";
import { DEFAULT_LOOK } from "../../src/lib/verse-card/looks.ts";
import { closeNoteGaps, type CardSpec } from "../../src/lib/verse-card/spec.ts";
import { body, fillShell, type Block, type Capture } from "../seo/shell.ts";
import { firstWords, withPicture } from "../verse-cards/preview-pages.ts";

/** Moves to v2 whenever a date's verse or the card design changes: chat apps keep an old picture for weeks (design 8.3). */
export const BIRTHDAY_PREVIEW_VERSION = "v1";
export const BIRTHDAY_PREVIEW_FOLDER = `cards/birthday/${BIRTHDAY_PREVIEW_VERSION}`;
export const PICKER_BIRTHDAY_PATH = "/occasion-verses?o=birthday";
const ALT_WORDS = 300;
const HONEST = "The Bible gives no verse to any date. These are chosen as gifts to read and pray for someone, not as signs.";
const SOURCE = "Scripture quotations are from the Berean Standard Bible, which is in the public domain.";

const english = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
const dayFormat = english({ month: "long", day: "numeric" });
const monthFormat = english({ month: "long" });
const ENGLISH_ORDINALS = new Intl.PluralRules("en-US", { type: "ordinal" });
const ENDINGS: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "st", two: "nd", few: "rd" };

/** "March 16", "February 29": at UTC midnight in 2024, a leap year. */
export const dateName = (date: string) => dayFormat.format(new Date(Date.UTC(2024, monthOf(date) - 1, dayOf(date))));
export const monthName = (month: number) => monthFormat.format(new Date(Date.UTC(2024, month - 1, 1)));
const ordinal = (n: number) => `${n}${ENDINGS[ENGLISH_ORDINALS.select(n)] ?? "th"}`;

export const passageOf = (date: string): LifeEventPassage => BIRTHDAY_BY_DATE[date];
export function refOf(passage: LifeEventPassage): CardRef {
  const last = passage.to ?? passage.from;
  return { book: Math.floor(passage.from / 1_000_000), chapter: Math.floor(passage.from / 1000) % 1000, first: passage.from % 1000, last: last % 1000 };
}
export const referenceOf = (catalog: Catalog, date: string) => formatRange(catalog, passageOf(date).from, passageOf(date).to ?? passageOf(date).from);

/** The date page's heading, lead line and "where the number comes from" line, as the page writes them in English. */
export function dateHeading(date: string): string {
  const name = dateName(date);
  return /^[AEIOU]/.test(name) ? `Bible Verse for an ${name} Birthday` : `Bible Verse for a ${name} Birthday`;
}
export const leadLine = (date: string, reference: string) => `${dateName(date)} · ${reference}: ${passageOf(date).note}`;
export function kindLine(date: string): string {
  const { chapter, first } = refOf(passageOf(date));
  const kind = matchKind(date, passageOf(date));
  if (kind === "date") return `Chapter ${chapter}, verse ${first}: the ${ordinal(monthOf(date))} month and the ${ordinal(dayOf(date))} day.`;
  if (kind === "flipped") return `Chapter ${chapter}, verse ${first}: the day and the month of ${dateName(date)}.`;
  return "No verse numbered for this date fits a birthday card well, so this one was chosen for it.";
}

/** The passage's Berean words and the verses either side, from its book's plain file ("chapter:verse" -> words). */
export interface DateWords { text: string; before?: string; after?: string }
export function dateWords(plain: Record<string, string>, date: string): DateWords | string {
  const { chapter, first, last } = refOf(passageOf(date));
  const words: string[] = [];
  for (let verse = first; verse <= last; verse++) {
    const text = plain[`${chapter}:${verse}`];
    if (!text) return `${date}: the Berean has no verse ${chapter}:${verse} in this book`;
    words.push(closeNoteGaps(text));
  }
  const side = (verse: number) => (plain[`${chapter}:${verse}`] ? closeNoteGaps(plain[`${chapter}:${verse}`]) : undefined);
  return { text: words.join(" "), before: side(first - 1), after: side(last + 1) };
}

/** The date's link-preview card: the page's own card at the wide size, Paper, "Happy birthday", no visitor's line. */
export const previewSpec = (catalog: Catalog, date: string, words: DateWords): CardSpec => ({
  passage: { text: words.text, reference: referenceOf(catalog, date), book: refOf(passageOf(date)).book },
  heading: "Happy birthday",
  link: `${SITE_ORIGIN}${datePath(date)}`,
  look: DEFAULT_LOOK,
});

export const pictureFile = (date: string) => `${BIRTHDAY_PREVIEW_FOLDER}/${datePath(date).slice(HUB_PATH.length + 1)}.png`;
export const pictureUrl = (date: string) => `${SITE_ORIGIN}/${pictureFile(date)}`;
/** Where a page's copy goes in the release, as scripts/seo/build.ts readyMadeFile names it. */
export const pageFile = (pagePath: string) => `${pagePath.slice(1)}.html`;

export interface ReadyPage { path: string; file: string; html: string }

/** The shell as one page: the head named the way the live page names itself (pageHead), and the text and links. */
function readyPage(shell: string, path: string, blocks: Block[], links: Capture["links"]): ReadyPage {
  const heading = blocks.find((block) => block.tag === "h1")?.text ?? "";
  const paragraph = blocks.find((block) => block.tag === "p" && block.text.length >= 60)?.text ?? "";
  const head = pageHead(path, { heading, paragraph });
  const capture: Capture = { path, capturedAt: "", base: SITE_ORIGIN, title: head.title, heading, paragraph, blocks, links };
  return { path, file: pageFile(path), html: fillShell(shell, { title: head.title, description: head.description, canonical: head.canonical, alternates: [] }, body(capture)) };
}

const HOW: Block[] = [
  { tag: "h2", text: "How the verses were chosen" },
  { tag: "p", text: "Each date has a verse whose chapter and verse match it (March 16 is John 3:16), or the day and month the other way round (July 31 is Psalm 31:7), and a few dates where no numbered verse fits a birthday card have one chosen for them instead." },
  { tag: "p", text: HONEST },
];

export function hubPage(shell: string, catalog: Catalog): ReadyPage {
  const blocks: Block[] = [
    { tag: "h1", text: "Birthday Bible Verses: A Verse for Every Day of the Year" },
    { tag: "p", text: "Choose a birthday to see its verse, then send it as a card or a message." },
    ...HOW,
    { tag: "h2", text: "The year at a glance" },
    ...MONTH_SLUGS.flatMap((_, index): Block[] => [{ tag: "h3", text: monthName(index + 1) }, ...monthDates(index + 1).map((date): Block => ({ tag: "li", text: `${dateName(date)}: ${referenceOf(catalog, date)}` }))]),
  ];
  const links = [
    ...MONTH_SLUGS.map((_, index) => ({ path: monthPath(index + 1), text: `${monthName(index + 1)} birthday verses` })),
    ...allBirthdayDates().map((date) => ({ path: datePath(date), text: `${dateName(date)}, ${referenceOf(catalog, date)}` })),
    { path: PICKER_BIRTHDAY_PATH, text: "More verses for a birthday" },
  ];
  return readyPage(shell, HUB_PATH, blocks, links);
}

export function monthPage(shell: string, catalog: Catalog, month: number): ReadyPage {
  const name = monthName(month);
  const blocks: Block[] = [
    { tag: "h1", text: `${name} Birthday Bible Verses` },
    { tag: "p", text: `A verse for every day in ${name}, each with a card to send.` },
    ...monthDates(month).map((date): Block => ({ tag: "li", text: `${dateName(date)} · ${referenceOf(catalog, date)}: ${passageOf(date).note}` })),
  ];
  const previous = month === 1 ? 12 : month - 1;
  const next = month === 12 ? 1 : month + 1;
  const links = [
    ...monthDates(month).map((date) => ({ path: datePath(date), text: dateName(date) })),
    { path: monthPath(previous), text: `Previous month: ${monthName(previous)}` },
    { path: monthPath(next), text: `Next month: ${monthName(next)}` },
    { path: HUB_PATH, text: "All birthday verses" },
  ];
  return readyPage(shell, monthPath(month), blocks, links);
}

/** A date's page with its picture in the four picture tags. Fails loudly if the shell lost a tag. */
export function datePage(shell: string, catalog: Catalog, date: string, words: DateWords): ReadyPage {
  const passage = passageOf(date);
  const reference = referenceOf(catalog, date);
  const ref = refOf(passage);
  const blocks: Block[] = [
    { tag: "h1", text: dateHeading(date) },
    { tag: "p", text: leadLine(date, reference) },
    { tag: "p", text: `“${words.text}” ${reference} (BSB)` },
    { tag: "p", text: kindLine(date) },
    { tag: "p", text: HONEST },
    ...(passage.context ? [{ tag: "p", text: passage.context } as Block] : []),
  ];
  if (words.before || words.after) {
    blocks.push({ tag: "h2", text: "In its place" });
    if (words.before) blocks.push({ tag: "p", text: words.before });
    if (words.after) blocks.push({ tag: "p", text: words.after });
  }
  blocks.push({ tag: "p", text: SOURCE });
  const { previous, next } = neighbours(date);
  const links = [
    { path: readerPath(ref), text: `Read ${reference.replace(/:.*$/, "")}` },
    { path: datePath(previous), text: `Previous: ${dateName(previous)}: ${referenceOf(catalog, previous)}` },
    { path: datePath(next), text: `Next: ${dateName(next)}: ${referenceOf(catalog, next)}` },
    { path: monthPath(monthOf(date)), text: `All ${monthName(monthOf(date))} birthday verses` },
    { path: PICKER_BIRTHDAY_PATH, text: "More verses for a birthday" },
  ];
  const page = readyPage(shell, datePath(date), blocks, links);
  const alt = `A birthday card: “${firstWords(words.text, ALT_WORDS)}” ${reference}, Berean Standard Bible, bibleguide.io`;
  return { ...page, html: withPicture(page.html, pictureUrl(date), alt) };
}
