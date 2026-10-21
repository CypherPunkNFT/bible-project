import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Progress } from "@/lib/progress";
import type { BookSpan, Library } from "./model";

export type ChartMode = "choose" | "mark";

interface Props {
  library: Library;
  books: BookSpan[];
  /** verses of the part's longest chapter, for the cells' shading */
  longest: number;
  mode: ChartMode;
  selected: number;
  progress: Progress;
  onChapter: (index: number) => void;
  onBook: (book: BookSpan) => void;
}

/**
 * Every chapter of one part: a row per book, a cell per chapter, darker the longer the chapter. Keeps the reading
 * chart's keyboard and screen-reader behaviour: one tab stop per book, arrows between chapters, "Romans 8, read".
 */
export function PartChart({ library, books, longest, mode, selected, progress, onChapter, onBook }: Props) {
  return (
    <div className={mode === "mark" ? "lib-chart marking" : "lib-chart"}>
      {books.map((book) => (
        <BookRow key={book.code} library={library} book={book} longest={longest} mode={mode} selected={selected} progress={progress} onChapter={onChapter} onBook={onBook} />
      ))}
    </div>
  );
}

function BookRow({ library, book, longest, mode, selected, progress, onChapter, onBook }: Omit<Props, "books"> & { book: BookSpan }) {
  const chapters = library.bars.slice(book.start, book.start + book.count);
  const here = selected >= book.start && selected < book.start + book.count ? selected - book.start : 0;
  const [focusIndex, setFocusIndex] = useState(here);
  const grid = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const cells = grid.current ? [...grid.current.querySelectorAll<HTMLButtonElement>("button")] : [];
    const perRow = cells.length > 1 ? cells.filter((cell) => cell.offsetTop === cells[0].offsetTop).length : 1;
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: perRow, ArrowUp: -perRow };
    let next = index;
    if (event.key in moves) next = index + moves[event.key];
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = cells.length - 1;
    else return;
    event.preventDefault();
    next = Math.min(cells.length - 1, Math.max(0, next));
    setFocusIndex(next);
    cells[next]?.focus();
  };

  return (
    <div className="lib-chart-row">
      <button type="button" className="lib-chart-book" onClick={() => onBook(book)}>
        {book.name}
      </button>
      <div ref={grid} role="group" aria-label={`${book.name} chapters`} className="lib-cells">
        {chapters.map((bar, index) => {
          const read = progress.isRead(bar.code, bar.chapter);
          const name = `${bar.name} ${bar.chapter}${mode === "mark" ? (read ? ", read" : ", not read") : read ? ", read" : ""}`;
          return (
            <button
              key={bar.chapter}
              type="button"
              tabIndex={index === focusIndex ? 0 : -1}
              className={["lib-cell", read && "read", bar.index === selected && "on"].filter(Boolean).join(" ")}
              style={{ "--depth": `${Math.round(14 + (bar.verses / longest) * 56)}%` } as CSSProperties}
              aria-pressed={mode === "mark" ? read : undefined}
              aria-current={bar.index === selected ? "true" : undefined}
              aria-label={name}
              title={`${bar.name} ${bar.chapter} · ${bar.verses} verses${read ? " · read" : ""}`}
              onKeyDown={(event) => onKeyDown(event, index)}
              onClick={() => {
                setFocusIndex(index);
                if (mode === "mark") progress.toggle(bar.code, bar.chapter);
                else onChapter(bar.index);
              }}
            >
              {read ? "✓" : bar.chapter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
