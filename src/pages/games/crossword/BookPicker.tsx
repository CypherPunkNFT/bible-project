// Bible crossword: the window that opens from "Or one book" on the start screen (owner, 2026-11-12: a pop-up to
// choose from, in place of the drop-down). Every book shows as a tile, Old Testament then New, each edged in its
// section's colour; a book with too few clues is greyed out rather than hidden, and a gold dot marks a book with an
// unfinished puzzle put aside. A native <dialog> opened as a modal, as the kit's ConfirmDialog is: focus stays inside,
// Escape and a tap on the backdrop close it, and focus goes back to the card that opened it.
import { useEffect, useRef, type CSSProperties } from "react";
import { plural } from "@/lib/site-format";
import type { BookChoice } from "./game";

/** A book's colour on the site's reading chart, by its number (1–66). */
function toneOf(num: number): string {
  if (num <= 17) return "history";
  if (num <= 22) return "poetry";
  if (num <= 39) return "prophets";
  if (num <= 43) return "gospels";
  if (num === 44) return "acts";
  if (num <= 65) return "epistles";
  return "revelation";
}

interface BookPickerProps {
  open: boolean;
  books: readonly BookChoice[];
  chosen: number | null;
  /** Books with an unfinished puzzle put aside. */
  saved: ReadonlySet<number>;
  onPick: (num: number) => void;
  onClose: () => void;
}

export function BookPicker({ open, books, chosen, saved, onPick, onClose }: BookPickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (typeof element.showModal === "function") { if (!element.open) element.showModal(); }
    else element.setAttribute("open", "");
    (element.querySelector<HTMLButtonElement>(".cw-book-tile[aria-pressed='true']") ?? element.querySelector<HTMLButtonElement>(".cw-sheet-close"))
      ?.focus({ preventScroll: true });
    return () => {
      if (typeof element.close === "function" && element.open) element.close();
      else element.removeAttribute("open");
      opener?.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  const testaments = [
    { id: "ot", title: "Old Testament", books: books.filter((book) => book.num <= 39) },
    { id: "nt", title: "New Testament", books: books.filter((book) => book.num >= 40) },
  ];
  return <dialog ref={dialog} className="cw-books" aria-labelledby="cw-books-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
    <div className="cw-books-body">
      <div className="cw-sheet-head">
        <h2 id="cw-books-title">Choose a book</h2>
        <button type="button" className="cw-sheet-close" onClick={onClose}>Close</button>
      </div>
      <p className="cw-note">A greyed-out book has too few clues for a crossword.{saved.size > 0 && <> <span id="cw-books-saved">A gold dot marks a book with an unfinished puzzle saved.</span></>}</p>
      {testaments.map((testament) => <section key={testament.id} className="cw-books-group" aria-labelledby={`cw-books-${testament.id}`}>
        <h3 id={`cw-books-${testament.id}`}><span>{testament.title}</span> <small>{plural(testament.books.length, "{n} book", "{n} books")}</small></h3>
        <div className="cw-books-grid">
          {testament.books.map((book) => <button key={book.num} type="button" className="cw-book-tile" disabled={!book.offered}
            aria-pressed={book.num === chosen} aria-describedby={saved.has(book.num) ? "cw-books-saved" : undefined}
            style={{ "--cw-tone": `var(--${toneOf(book.num)})` } as CSSProperties} onClick={() => onPick(book.num)}>
            {book.name}
            {saved.has(book.num) && <span className="cw-saved-dot" aria-hidden="true" />}
          </button>)}
        </div>
      </section>)}
    </div>
  </dialog>;
}
