// The count book by book: all the Bible's books, Genesis to Revelation or the most first, each with a bar in its
// section's colour. Books without the word stay in the list, faint, since "never in Esther" is an answer too. Picking a
// book narrows the verse list below to it. At most 66 rows, so the list is drawn whole.
import { useMemo, useState, type CSSProperties } from "react";
import { sectionColor } from "@/lib/sections";
import { formatNumber, plural } from "@/lib/site-format";
import type { BookInfo } from "@/lib/types";
import type { CountResult } from "./count";

type Order = "bible" | "most";

export function BookBreakdown({ books, result, selected, onSelect }: {
  books: readonly BookInfo[]; result: CountResult; selected: string; onSelect: (code: string) => void;
}) {
  const [order, setOrder] = useState<Order>("bible");
  const rows = useMemo(() => {
    const listed = [...books];
    if (order === "most") listed.sort((a, b) => (result.byBook.get(b.code) ?? 0) - (result.byBook.get(a.code) ?? 0));
    return listed;
  }, [books, result, order]);
  const most = Math.max(1, ...result.byBook.values());
  return (
    <section className="wc-books" aria-labelledby="wc-books-title">
      <div className="wc-section-head">
        <h3 id="wc-books-title">By book</h3>
        <p>{plural(result.byBook.size, "In {n} book of the Bible.", "In {n} books of the Bible.")}</p>
        <div className="wc-order" role="group" aria-label="Order">
          <button type="button" className="wc-chip" aria-pressed={order === "bible"} onClick={() => setOrder("bible")}>Bible order</button>
          <button type="button" className="wc-chip" aria-pressed={order === "most"} onClick={() => setOrder("most")}>Most first</button>
        </div>
      </div>
      <ol className="wc-book-list" aria-label="Times in each book">
        {rows.map((book) => {
          const times = result.byBook.get(book.code) ?? 0;
          const verses = result.versesByBook.get(book.code) ?? 0;
          const bar = { width: `${times ? Math.max(1.5, (times / most) * 100) : 0}%`, background: sectionColor(book.section) } as CSSProperties;
          const body = <>
            <span className="wc-book-name">{book.name}</span>
            <span className="wc-bar" aria-hidden="true"><span style={bar} /></span>
            <span className="wc-book-count">{formatNumber(times)}</span>
            <span className="wc-book-verses">{times ? plural(verses, "in {n} verse", "in {n} verses") : ""}</span>
          </>;
          return <li key={book.code} className={times ? undefined : "is-empty"}>
            {times
              ? <button type="button" aria-pressed={selected === book.code} onClick={() => onSelect(selected === book.code ? "" : book.code)}>{body}</button>
              : <div>{body}</div>}
          </li>;
        })}
      </ol>
    </section>
  );
}
