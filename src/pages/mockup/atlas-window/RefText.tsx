// Turns the Bible references inside an Atlas mock-up line ("2 Samuel 5:6–7; Luke 24:1–7") into links that open the
// Berean Standard Bible at that chapter, with the verses shaded (owner, 2026-11-06). A bare "13:1–3" after a
// reference continues the same book.
import { Fragment, type ReactNode } from "react";
import { StudyLink } from "@/pages/study/hub/shared";

const BOOKS: Record<string, string> = {
  Genesis: "GEN", Exodus: "EXO", Numbers: "NUM", Deuteronomy: "DEU", Joshua: "JOS", Judges: "JDG", Ruth: "RUT",
  "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI", Ezra: "EZR", Nehemiah: "NEH", Esther: "EST",
  Psalm: "PSA", Psalms: "PSA", Jeremiah: "JER", Daniel: "DAN", Hosea: "HOS", Jonah: "JON", Micah: "MIC", Nahum: "NAM",
  Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT", Romans: "ROM", Revelation: "REV",
};
const SPAN = String.raw`\d+(?::\d+)?(?:–\d+(?::\d+)?)?`;
const PATTERN = new RegExp(`(${Object.keys(BOOKS).sort((a, b) => b.length - a.length).join("|")}) (${SPAN})((?:; ${SPAN}(?! [A-Z]))*)`, "g");

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
    for (const more of rest.split("; ").slice(1)) parts.push("; ", <StudyLink key={`${start}-${more}`} className="am-ref" to={readerHref(code, more)}>{more}</StudyLink>);
    at = start + whole.length;
  }
  parts.push(text.slice(at));
  return <>{parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)}</>;
}
