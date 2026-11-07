// Turns the Bible references inside an Atlas window line ("2 Samuel 5:6–7; Luke 24:1–7") into links that open the
// Berean Standard Bible at that chapter, with the verses shaded (owner, 2026-11-06). A bare "13:1–3" after a
// reference continues the same book; a bare ", 44" after a verse continues the same chapter ("Acts 27:37, 44; 28:1–9").
import { Fragment, type ReactNode } from "react";
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

export function RefText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(PATTERN)) {
    const [whole, book, span, rest] = match, code = BOOKS[book], start = match.index;
    parts.push(text.slice(at, start));
    parts.push(<StudyLink key={start} className="am-ref" to={readerHref(code, span)}>{`${book} ${span}`}</StudyLink>);
    let chapter = span.split(":")[0];
    for (const [, separator, more] of rest.matchAll(PIECE)) {
      const target = separator === ", " ? `${chapter}:${more}` : more;
      if (separator === "; ") chapter = more.split(":")[0];
      parts.push(separator, <StudyLink key={`${start}-${separator}${more}`} className="am-ref" to={readerHref(code, target)}>{more}</StudyLink>);
    }
    at = start + whole.length;
  }
  parts.push(text.slice(at));
  return <>{parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)}</>;
}
