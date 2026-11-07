// Turns the Bible references inside an Atlas window line ("2 Samuel 5:6–7; Luke 24:1–7") into links that open the
// Berean Standard Bible at that chapter, with the verses shaded (owner, 2026-11-06). A bare "13:1–3" after a
// reference continues the same book; a bare ", 44" after a verse continues the same chapter ("Acts 27:37, 44; 28:1–9").
// In another language the line is put into that language whole before it is cut (2026-11-07): the page translator swaps
// a text only when it is a whole line it knows, and the links cut a line into pieces it does not. The references are
// found in the English, and each one's numbers are then looked for, in order, in the translated line.
import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import { languageDirection, useSiteLanguage, type LanguageCode } from "@/lib/language";
import { onPhrasesLearned, phrase, phraseListVersion } from "@/lib/phrase-memory";
import { StudyLink } from "@/pages/study/hub/shared";

/** Every book of the Bible, by the name a line uses, with the reader's code for it. */
const BOOKS: Record<string, string> = {
  Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM", Deuteronomy: "DEU", Joshua: "JOS", Judges: "JDG",
  Ruth: "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH",
  "2 Chronicles": "2CH", Ezra: "EZR", Nehemiah: "NEH", Esther: "EST", Job: "JOB", Psalm: "PSA", Psalms: "PSA",
  Proverbs: "PRO", Ecclesiastes: "ECC", "Song of Songs": "SNG", Isaiah: "ISA", Jeremiah: "JER", Lamentations: "LAM",
  Ezekiel: "EZK", Daniel: "DAN", Hosea: "HOS", Joel: "JOL", Amos: "AMO", Obadiah: "OBA", Jonah: "JON", Micah: "MIC",
  Nahum: "NAM", Habakkuk: "HAB", Zephaniah: "ZEP", Haggai: "HAG", Zechariah: "ZEC", Malachi: "MAL",
  Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT", Romans: "ROM", "1 Corinthians": "1CO",
  "2 Corinthians": "2CO", Galatians: "GAL", Ephesians: "EPH", Philippians: "PHP", Colossians: "COL",
  "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI", "2 Timothy": "2TI", Titus: "TIT",
  Philemon: "PHM", Hebrews: "HEB", James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN",
  "3 John": "3JN", Jude: "JUD", Revelation: "REV",
};
const SPAN = String.raw`\d+(?::\d+)?(?:–\d+(?::\d+)?)?`;
/** What may follow the first reference in the same book: "; 13:1–3" (another chapter) or ", 44" (another verse). */
const MORE = String.raw`(?:; ${SPAN}|, \d+(?:–\d+)?)(?![\d:]| [A-Z])`;
const PATTERN = new RegExp(`\\b(${Object.keys(BOOKS).sort((a, b) => b.length - a.length).join("|")}) (${SPAN})((?:${MORE})*)`, "g");
const PIECE = new RegExp(`(; |, )(${SPAN})`, "g");

/** "5:6–7" in a book → /read/bsb/2SA/5?hl=6-7; a chapter range ("13–14") opens its first chapter. */
function readerHref(code: string, span: string): string {
  const [first, last] = span.split("–");
  const [chapter, verse] = first.split(":");
  if (!verse) return `/read/bsb/${code}/${chapter}`;
  const end = last === undefined ? verse : last.includes(":") ? "999" : last;
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${end}`;
}

/** One link: where it stands in the line drawn, and where it goes. */
interface Placed { start: number; end: number; href: string }
/** A reference of the English line: its book's name when it opens with one, else it continues the one before. */
interface Reference extends Placed { book: string | null; span: string }

function referencesIn(text: string): Reference[] {
  const found: Reference[] = [];
  for (const match of text.matchAll(PATTERN)) {
    const [, book, span, rest] = match, code = BOOKS[book], start = match.index, restStart = start + book.length + 1 + span.length;
    found.push({ book, span, href: readerHref(code, span), start, end: restStart });
    let chapter = span.split(":")[0];
    for (const piece of rest.matchAll(PIECE)) {
      const [, separator, more] = piece, pieceStart = restStart + piece.index + separator.length;
      const target = separator === ", " ? `${chapter}:${more}` : more;
      if (separator === "; ") chapter = more.split(":")[0];
      found.push({ book: null, span: more, href: readerHref(code, target), start: pieceStart, end: pieceStart + more.length });
    }
  }
  return found;
}

/** Each reference's numbers found in the translated line, in order, never inside a longer number; the book's name in
 *  the language joins the link when it stands just before them. A reference not found stays plain text, unlinked. */
function placedIn(line: string, references: Reference[], language: LanguageCode): Placed[] {
  const placed: Placed[] = [];
  let cursor = 0;
  for (const { book, span, href } of references) {
    const numbers = new RegExp(`(?<![\\d:])${span.replace(/[–-]/g, "[–-]")}(?![\\d:])`, "g");
    numbers.lastIndex = cursor;
    const found = numbers.exec(line);
    if (!found) continue;
    const name = book ? phrase(book, language) || book : null, before = line.slice(cursor, found.index);
    const widen = name ? [`${name} `, name].find(form => before.endsWith(form))?.length ?? 0 : 0;
    placed.push({ start: found.index - widen, end: found.index + found[0].length, href });
    cursor = found.index + found[0].length;
  }
  return placed;
}

// As the page translator holds them for a right-to-left language: Arabic reads "6:24–25" as "25–6:24" without the marks.
const VERSE_RANGE = /\d+:\d+[–-]\d+(?::\d+)?/g;
const asWritten = (value: string) => value;
const heldTogether = (value: string) => value.replace(VERSE_RANGE, "\u2066$&\u2069");

export function RefText({ text }: { text: string }) {
  const language = useSiteLanguage();
  useSyncExternalStore(onPhrasesLearned, () => phraseListVersion(language)); // drawn again when the language's phrases land
  const own = phrase(text, language), references = referencesIn(text);
  const line = own ?? text, links = own ? placedIn(own, references, language) : references;
  // Held only after the line is cut: the marks inside a range would hide its numbers from the search above.
  const hold = own && languageDirection(language) === "rtl" ? heldTogether : asWritten;
  const parts: ReactNode[] = [];
  let at = 0;
  links.forEach((link, i) => {
    parts.push(hold(line.slice(at, link.start)));
    parts.push(<StudyLink key={`ref-${i}`} className="am-ref" to={link.href}>{hold(line.slice(link.start, link.end))}</StudyLink>);
    at = link.end;
  });
  parts.push(hold(line.slice(at)));
  return <>{parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)}</>;
}
