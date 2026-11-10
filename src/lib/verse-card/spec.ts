// The card description (design 3.2): everything needed to draw one card, anywhere, as plain data. `cardProblems` says in
// plain sentences what is wrong with one; `resolveCard` cleans it and settles its design and ornament. The footer
// ("Berean Standard Bible · bibleguide.io") is not part of the description: the generator always draws it.
import { SITE_ORIGIN } from "../page-head";
import { BUILT_IN_LOOKS, DEFAULT_LOOK, bookLook, hasOwn, lookProblems, type Look, type LookId } from "./looks";
import { isOrnamentId, type OrnamentId } from "./ornaments";

export interface CardSpec {
  /** The Scripture, already read from the Berean by the caller. `book` (1–66) is needed only by the Book colour design. */
  passage: { text: string; reference: string; book?: number };
  /** A short line above the verse, written by the feature, never by a visitor: "Happy birthday". */
  heading?: string;
  /** Up to two short lines below the verse: a visitor's own words, names, a date. Drawn on the picture only. */
  lines?: string[];
  /** The page the card belongs to, on SITE_ORIGIN. Its address goes in the share text; the picture prints the site. */
  link: string;
  /** A built-in design id, or a feature's own design as plain data. */
  look: LookId | Look;
  /** Overrides the design's own ornament; "none" removes it. */
  ornament?: OrnamentId;
}

/** A card cleaned and settled, ready to lay out. */
export interface ResolvedCard {
  text: string;
  reference: string;
  heading: string | null;
  lines: string[];
  link: string;
  look: Look;
  ornament: OrnamentId | { path: string; viewBox: number };
}

export const MAX_TEXT = 600;
export const MAX_HEADING = 40;
export const MAX_LINE = 60;
export const MAX_LINES = 2;

// Control characters, direction overrides and invisible joiners other than the zero-width joiner emoji are built with.
// eslint-disable-next-line no-control-regex
const UNSEEN = /[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

/** A short line as it will be drawn: unseen characters removed, spaces collapsed, trimmed. */
export const cleanLine = (value: string): string => value.replace(UNSEEN, "").replace(/\s+/g, " ").trim();

/** The Berean's words with the gap a removed footnote mark leaves before punctuation closed up, so a card reads
 *  "Sivan)" and "Cush—writing", not "Sivan )" and "Cush —writing". A dash spaced on both sides is left as it is. */
export const closeNoteGaps = (text: string): string => text.replace(/\s+([)\],.;:!?])/g, "$1").replace(/\s+—(?=\S)/g, "—");

type Segmenter = new (locale?: string, options?: { granularity: "grapheme" }) => { segment(text: string): Iterable<unknown> };

/** Characters as the visitor sees them: an emoji built from several code points counts once where the browser can tell. */
export function visibleLength(text: string): number {
  const segmenter = (Intl as unknown as { Segmenter?: Segmenter }).Segmenter;
  return segmenter ? Array.from(new segmenter("en", { granularity: "grapheme" }).segment(text)).length : Array.from(text).length;
}

/** True for SITE_ORIGIN itself or an address on it: "https://bibleguide.io.example.com" is not. */
export function isSiteLink(link: string): boolean {
  if (typeof link !== "string" || /[\s\u0000-\u001F]/.test(link)) return false; // eslint-disable-line no-control-regex
  if (link !== SITE_ORIGIN && !link.startsWith(`${SITE_ORIGIN}/`)) return false;
  try {
    const url = new URL(link);
    return url.origin === SITE_ORIGIN && !url.username && !url.password;
  } catch {
    return false;
  }
}

function lookOfSpec(spec: CardSpec, warn: (message: string) => void): { look: Look | null; problems: string[] } {
  const { look } = spec;
  if (typeof look === "string") {
    if (!hasOwn(BUILT_IN_LOOKS, look)) { warn(`verse card: no design called "${look}"; drawing ${DEFAULT_LOOK}`); return { look: BUILT_IN_LOOKS[DEFAULT_LOOK], problems: [] }; }
    if (look !== "book") return { look: BUILT_IN_LOOKS[look], problems: [] };
    const book = spec.passage.book;
    if (typeof book === "number" && Number.isInteger(book) && book >= 1 && book <= 66) return { look: bookLook(book), problems: [] };
    warn(`verse card: the Book colour design needs a book from 1 to 66, got ${String(book)}; drawing ${DEFAULT_LOOK}`);
    return { look: BUILT_IN_LOOKS[DEFAULT_LOOK], problems: [] };
  }
  if (!look || typeof look !== "object") return { look: null, problems: ["The card has no design."] };
  if (hasOwn(BUILT_IN_LOOKS, look.id)) return { look: null, problems: [`A feature's design may not use the built-in id "${look.id}".`] };
  const problems = lookProblems(look);
  return { look: problems.length ? null : look, problems };
}

function textProblems(spec: CardSpec): string[] {
  const problems: string[] = [];
  const text = spec.passage?.text?.trim() ?? "";
  if (!text) problems.push("The card has no verse text.");
  if (!spec.passage?.reference?.trim()) problems.push("The card has no reference.");
  if (text.length > MAX_TEXT) problems.push(`The verse is too long for a card (${text.length} characters, at most ${MAX_TEXT}): choose fewer verses.`);
  if (spec.heading !== undefined && visibleLength(cleanLine(spec.heading)) > MAX_HEADING) problems.push(`The heading is longer than ${MAX_HEADING} characters.`);
  const lines = spec.lines ?? [];
  if (lines.length > MAX_LINES) problems.push(`A card holds at most ${MAX_LINES} lines of your own, not ${lines.length}.`);
  lines.forEach((line, index) => { if (visibleLength(cleanLine(line)) > MAX_LINE) problems.push(`Line ${index + 1} is longer than ${MAX_LINE} characters.`); });
  if (!isSiteLink(spec.link)) problems.push(`The card's link must be on ${SITE_ORIGIN}, not "${String(spec.link).slice(0, 80)}".`);
  return problems;
}

/** Plain sentences naming what is wrong with a card; empty when it is fine. */
export function cardProblems(spec: CardSpec): string[] {
  return [...textProblems(spec), ...lookOfSpec(spec, () => {}).problems];
}

/** The card cleaned and settled. Throws an error listing every problem when the card cannot be drawn. */
export function resolveCard(spec: CardSpec, warn: (message: string) => void = (message) => console.warn(message)): ResolvedCard {
  const settled = lookOfSpec(spec, warn);
  const problems = [...textProblems(spec), ...settled.problems];
  if (problems.length || !settled.look) throw new Error(`verse card: ${problems.join(" ")}`);
  let ornament = settled.look.ornament ?? "none";
  if (spec.ornament !== undefined) {
    if (isOrnamentId(spec.ornament)) ornament = spec.ornament;
    else warn(`verse card: no ornament called "${String(spec.ornament)}"; keeping the design's own`);
  }
  const heading = spec.heading === undefined ? "" : cleanLine(spec.heading);
  return {
    text: spec.passage.text.replace(/\s+/g, " ").trim(),
    reference: spec.passage.reference.trim(),
    heading: heading || null,
    lines: (spec.lines ?? []).map(cleanLine).filter(Boolean),
    link: spec.link,
    look: settled.look,
    ornament,
  };
}
