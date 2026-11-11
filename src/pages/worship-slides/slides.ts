// Sharing a passage's verses between slides (pure). "One verse per slide" gives each verse its own slide; "As many
// verses as fit" fills a slide up to the text size's letter budget (templates.ts), never mixing two passages of the
// reference ("Ps 23; 91:1-4"). A verse too long for one slide is cut at the end of a sentence, else of a clause, else
// between words, and only its first part carries the verse number. Every slide names the verses it shows
// ("John 3:16–17"), and an optional first slide names the whole passage.
import type { Verse } from "./load";

/** A run of a verse on a slide: `mark` is the verse number shown before it ("16", or "2:1" where a chapter starts), or
 *  null for a later part of a cut verse. */
export interface Piece { mark: string | null; text: string; chapter: number; verse: number; part: number }

export type Slide =
  | { kind: "title"; heading: string; subtitle: string }
  | { kind: "verses"; pieces: Piece[]; reference: string };

type Spot = Pick<Verse, "chapter" | "verse">;

/** "3:16", "3:16–18", "1:31–2:2", or verses alone in a one-chapter book ("3–5"). */
function span(first: Spot, last: Spot, singleChapterBook: boolean): string {
  const start = singleChapterBook ? `${first.verse}` : `${first.chapter}:${first.verse}`;
  if (first.chapter === last.chapter && first.verse === last.verse) return start;
  const end = singleChapterBook || first.chapter === last.chapter ? `${last.verse}` : `${last.chapter}:${last.verse}`;
  return `${start}–${end}`;
}

/** One psalm is "Psalm 23", as references name it, though the book is Psalms. */
const bookFor = (bookName: string, oneChapter: boolean) => (oneChapter ? bookName.replace(/^Psalms$/, "Psalm") : bookName);

/** "John 3:16–18", "Genesis 1:31–2:2": the book's name with the span from `first` to `last`. */
export function spanReference(bookName: string, first: Spot, last: Spot, singleChapterBook: boolean): string {
  return `${bookFor(bookName, first.chapter === last.chapter)} ${span(first, last, singleChapterBook)}`;
}

/** The passage's name for the title slide, from the verses actually found, passage by passage: a passage that named
 *  whole chapters reads "23" or "1–2", any other its first and last verse. "Psalm 23", "Psalms 23; 91:1–4", "Jude". */
export function passageTitle(bookName: string, verses: readonly Verse[], wholeChapters: readonly boolean[], singleChapterBook: boolean): string {
  const parts = [...new Set(verses.map((verse) => verse.part))].map((part) => verses.filter((verse) => verse.part === part));
  const labels = parts.map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    if (wholeChapters[first.part] && singleChapterBook) return "";
    if (wholeChapters[first.part]) return first.chapter === last.chapter ? `${first.chapter}` : `${first.chapter}–${last.chapter}`;
    return span(first, last, singleChapterBook);
  }).filter(Boolean);
  const oneChapter = verses.every((verse) => verse.chapter === verses[0].chapter);
  return labels.length ? `${bookFor(bookName, oneChapter)} ${[...new Set(labels)].join("; ")}` : bookName;
}

const CUTS: readonly RegExp[] = [/(?<=[.!?][”’"')]*)\s+/g, /(?<=[;:,—–][”’"')]*)\s+/g, /\s+/g];

/** A verse's words in parts of at most `budget` letters, cut at the strongest break that keeps every part within it. */
export function cutVerse(text: string, budget: number): string[] {
  if (text.length <= budget) return [text];
  for (const cut of CUTS) {
    const chunks = text.split(cut).filter(Boolean);
    if (chunks.length < 2) continue;
    const parts: string[] = [];
    let current = "";
    for (const chunk of chunks) {
      const joined = current ? `${current} ${chunk}` : chunk;
      if (joined.length <= budget || !current) current = joined;
      else { parts.push(current); current = chunk; }
    }
    if (current) parts.push(current);
    // A break this strong only helps if no part is left over budget; else try a weaker one.
    if (parts.every((part) => part.length <= budget) || cut === CUTS[CUTS.length - 1]) return parts;
  }
  return [text];
}

export interface SlideSettings {
  per: "verse" | "fill";
  /** Letters a slide holds at the chosen size. */
  budget: number;
  title: boolean;
}

export interface PassageFacts {
  bookName: string;
  /** Per passage of the reference: did it name whole chapters ("Psalm 23") rather than verses? */
  wholeChapters: readonly boolean[];
  singleChapterBook: boolean;
}

/** The slides for a passage: an optional title slide, then the verses. */
export function makeSlides(verses: readonly Verse[], facts: PassageFacts, settings: SlideSettings): Slide[] {
  if (!verses.length) return [];
  const { bookName, singleChapterBook } = facts;
  const manyChapters = verses.some((verse) => verse.chapter !== verses[0].chapter);
  // One verse alone may run a little long: the layout shrinks its letters before a verse is cut in two.
  const cutAt = settings.per === "verse" ? Math.round(settings.budget * 1.4) : settings.budget;
  const pieces: Piece[] = [];
  for (const verse of verses) {
    const mark = manyChapters && verse.verse === 1 && !singleChapterBook ? `${verse.chapter}:1` : `${verse.verse}`;
    cutVerse(verse.text, cutAt).forEach((text, i) => pieces.push({ mark: i === 0 ? mark : null, text, chapter: verse.chapter, verse: verse.verse, part: verse.part }));
  }

  const groups: Piece[][] = [];
  for (const piece of pieces) {
    const group = groups[groups.length - 1];
    const used = group ? group.reduce((sum, item) => sum + item.text.length + 1, 0) : 0;
    const fits = settings.per === "fill" && group && group[0].part === piece.part && used + piece.text.length <= settings.budget;
    if (fits) group.push(piece);
    else groups.push([piece]);
  }

  const slides: Slide[] = groups.map((group) => ({
    kind: "verses",
    pieces: group,
    reference: spanReference(bookName, group[0], group[group.length - 1], singleChapterBook),
  }));
  if (settings.title) slides.unshift({ kind: "title", heading: passageTitle(bookName, verses, facts.wholeChapters, singleChapterBook), subtitle: "Berean Standard Bible" });
  return slides;
}
