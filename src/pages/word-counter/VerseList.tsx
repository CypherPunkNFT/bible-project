// Every verse with the search in it, in Bible order, the matches marked, each reference opening the reader at that verse
// (shaded, and in the Berean even when the site is in another language: CHOSEN_BIBLE). "love" is in hundreds of verses
// and "the" in tens of thousands, so the list is drawn a window at a time (src/lib/useRowWindow.ts: the rows on screen
// and 50 above and below), the rest drawn as the reader scrolls to them.
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { CHOSEN_BIBLE } from "@/lib/last-read";
import { formatRange } from "@/lib/refs";
import { plural } from "@/lib/site-format";
import type { BookInfo } from "@/lib/types";
import { useRowWindow } from "@/lib/useRowWindow";
import { markMatches, type VerseCount } from "./count";
import { BIBLE } from "./load";

const ROW_ESTIMATE = 76;

const verseId = (book: BookInfo, verse: VerseCount) => book.num * 1_000_000 + verse.chapter * 1000 + verse.verse;
const keyOf = (verse: VerseCount) => `${verse.code}.${verse.chapter}.${verse.verse}`;

/** The reader at this verse, shaded: /read/bsb/JHN/3?hl=16. */
const readerHref = (verse: VerseCount) => `/read/${BIBLE}/${verse.code}/${verse.chapter}?hl=${verse.verse}`;

export function VerseList({ books, verses, matcher, book, onShowAll }: {
  books: readonly BookInfo[]; verses: readonly VerseCount[]; matcher: RegExp; book: string; onShowAll: () => void;
}) {
  const catalog = useCatalog();
  const byCode = useMemo(() => new Map(books.map((b) => [b.code, b])), [books]);
  const shown = useMemo(() => (book ? verses.filter((verse) => verse.code === book) : verses), [verses, book]);
  const [container, setContainer] = useState<HTMLOListElement | null>(null);
  const rowOf = useMemo(() => new Map(shown.map((verse, i) => [keyOf(verse), i])), [shown]);
  const rowKey = useCallback((i: number) => keyOf(shown[i]), [shown]);
  const rowOfAnchor = useCallback((key: string) => rowOf.get(key), [rowOf]);
  const { start, end, before, after } = useRowWindow({
    rowCount: shown.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: ROW_ESTIMATE, gap: 0, scroller: "window", container, dataVersion: shown,
  });
  const drawn = shown.slice(start, end + 1);
  const chosen = book ? byCode.get(book) : undefined;
  return (
    <section className="wc-verses" aria-labelledby="wc-verses-title">
      <div className="wc-section-head">
        <h3 id="wc-verses-title">{chosen ? chosen.name : "Every verse"}</h3>
        <p>{plural(shown.length, "{n} verse, in Bible order.", "{n} verses, in Bible order.")}</p>
        {chosen && <button type="button" className="wc-link" onClick={onShowAll}>Show every book</button>}
      </div>
      <ol ref={setContainer} className="wc-verse-list" style={{ paddingTop: before, paddingBottom: after }}>
        {drawn.map((verse, k) => {
          const info = byCode.get(verse.code);
          const id = info ? verseId(info, verse) : 0;
          return <li key={keyOf(verse)} data-row={start + k}>
            <Link to={readerHref(verse)} state={CHOSEN_BIBLE} className="wc-ref">{info ? formatRange(catalog, id, id) : keyOf(verse)}</Link>
            {verse.count > 1 && <span className="wc-times">{plural(verse.count, "{n} time", "{n} times")}</span>}
            <span className="scripture wc-text" lang="en" translate="no">
              {markMatches(verse.text, matcher).map((part, i) => (part.hit ? <mark key={i}>{part.text}</mark> : part.text))}
            </span>
          </li>;
        })}
      </ol>
    </section>
  );
}
