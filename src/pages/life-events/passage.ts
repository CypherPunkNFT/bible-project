// A pack passage's words and reference, assembled once so the page, the cards and the readings sheet all show the same
// text (design 4.1, 6.4). Pure functions: the words come in through `wordsOf`, so tests can feed the Berean files directly.
import type { LifeEvent, LifeEventPassage } from "@/data/life-events";

/** Card front at full size up to here; one step smaller up to CARD_MAX (design 6.4). */
export const CARD_FULL = 240;
export const CARD_MAX = 320;
/** The display print takes passages up to this length. */
export const DISPLAY_MAX = 700;

export type SheetFormat = "folded" | "small" | "display" | "readings";

const split = (id: number) => ({ book: Math.floor(id / 1_000_000), chapter: Math.floor(id / 1000) % 1000, verse: id % 1000 });

/** Every verse id the passage covers, in order, without the verses the Berean omits. Ranges stay inside one chapter. */
export function passageVerseIds(passage: LifeEventPassage): number[] {
  const last = passage.to ?? passage.from;
  if (split(last).chapter !== split(passage.from).chapter || last < passage.from) {
    throw new Error(`life-events: passage ${passage.from}–${last} must run forward inside one chapter`);
  }
  const ids: number[] = [];
  for (let id = passage.from; id <= last; id++) if (!passage.skip?.includes(id)) ids.push(id);
  return ids;
}

/** Where the excerpt sits in its verse: "a" when it opens it, "b" when it closes it, null when neither (tests check it against `mark`). */
export function partLetter(passage: LifeEventPassage, verseText: string): "a" | "b" | null {
  if (!passage.part) return null;
  if (verseText.startsWith(passage.part.text)) return "a";
  if (verseText.endsWith(passage.part.text)) return "b";
  return null;
}

/** "Ecclesiastes 4:12b", "1 Corinthians 13:4–8a", "Acts 8:35–36, 38". */
export function passageReference(passage: LifeEventPassage, bookName: (bookNumber: number) => string): string {
  const ids = passageVerseIds(passage);
  const { book, chapter } = split(passage.from);
  const runs: string[] = [];
  let start = ids[0];
  let previous = ids[0];
  const close = (end: number) => {
    const first = split(start).verse;
    const lastVerse = split(end).verse;
    runs.push(first === lastVerse ? `${first}` : `${first}–${lastVerse}`);
  };
  for (const id of ids.slice(1)) {
    if (id !== previous + 1) { close(previous); start = id; }
    previous = id;
  }
  close(previous);
  // One psalm is "Psalm 139", as references name it, though the book is Psalms.
  return `${bookName(book).replace(/^Psalms$/, "Psalm")} ${chapter}:${runs.join(", ")}${passage.part?.mark ?? ""}`;
}

const CLOSING = /[”’"']+$/;

/**
 * The tidying of design 4.1, applied to text cut out of a longer paragraph: double quotation marks with no partner inside
 * the passage are dropped, and a passage that stops on a comma, semicolon, colon or dash (or with no final mark), looking
 * past closing quotation marks, ends with "…". The first letter is capitalised. No word is changed.
 */
export function tidyPassageText(raw: string): string {
  const characters = [...raw.replace(/\s+/g, " ").trim()];
  const open: number[] = [];
  const unpartnered = new Set<number>();
  characters.forEach((character, index) => {
    if (character === "“") open.push(index);
    else if (character === "”") {
      if (open.length) open.pop();
      else unpartnered.add(index);
    }
  });
  for (const index of open) unpartnered.add(index);
  let text = characters.filter((_, index) => !unpartnered.has(index)).join("").replace(/\s+/g, " ").trim();
  const tail = CLOSING.exec(text)?.[0] ?? "";
  let body = text.slice(0, text.length - tail.length).trimEnd();
  if (/[,;:—–-]$/.test(body)) body = `${body.slice(0, -1).trimEnd()}…`;
  else if (!/[.!?…]$/.test(body)) body = `${body}…`;
  text = body + tail;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The passage's words from its verses' texts (`wordsOf` gives a verse id's Berean text, or null if missing). */
export function assemblePassage(passage: LifeEventPassage, wordsOf: (id: number) => string | null): string {
  const words: string[] = [];
  for (const id of passageVerseIds(passage)) {
    const verse = wordsOf(id);
    if (verse === null) throw new Error(`life-events: the Berean has no text for verse ${id}`);
    words.push(passage.part?.verse === id ? passage.part.text : verse);
  }
  return tidyPassageText(words.join(" "));
}

/** A pack passage ready to show: its reference, words and the link to read it in place. */
export interface ShownPassage {
  key: string;
  passage: LifeEventPassage;
  reference: string;
  text: string;
  readHref: string;
}

/** Which passages the verse picker offers for a format (design 6.4). The readings sheet has no picker. */
export function pickerPassages(passages: ShownPassage[], format: SheetFormat): ShownPassage[] {
  if (format === "readings") return [];
  if (format === "display") return passages.filter((item) => item.text.length <= DISPLAY_MAX);
  return passages.filter((item) => item.passage.role === "card" || (item.passage.role === "blessing" && item.text.length <= CARD_MAX));
}

/** Does this passage carry a "Use on card" button on the page: what the folded and small cards offer. */
export const offeredOnCards = (item: ShownPassage): boolean => pickerPassages([item], "folded").length === 1;

/** Readings, then card verses, then the blessing: the order of the page and the readings sheet. */
export function passagesInOrder(event: LifeEvent): LifeEventPassage[] {
  const order = { reading: 0, card: 1, blessing: 2 } as const;
  return [...event.passages].sort((a, b) => order[a.role] - order[b.role]);
}

/** The reader's address for a passage, opening its chapter with the verses shaded. */
export function readHref(passage: LifeEventPassage, bookCode: string): string {
  const { chapter, verse } = split(passage.from);
  const last = split(passage.to ?? passage.from).verse;
  return `/read/bsb/${bookCode}/${chapter}?hl=${verse}-${last}`;
}
