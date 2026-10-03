import { useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { tone, toneOf } from "@/lib/sections";
import type { SectionId } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ChartBook {
  code: string;
  name: string;
  section: SectionId;
  /** chapter labels to draw, in order */
  chapters: string[];
  /** where the book's tab links to */
  href: string;
}

interface Props {
  books: ChartBook[];
  /** split into two columns before this book code on wide screens (the owner's chart splits before Hosea) */
  splitBefore?: string;
  isRead?: (code: string, chapter: string) => boolean;
  onChapter: (code: string, chapter: string) => void;
  /** words for each box's accessible name: "open" reads "Romans 3", "track" adds read/not read */
  mode: "open" | "track";
  current?: { code: string; chapter: string };
  compact?: boolean;
}

/**
 * The reading chart (after the owner's chart, reference/reading-chart.png): each book a dark tab, then its
 * chapters as numbered boxes in the light tone of its section, 28 to a row on wide screens.
 */
export function ReadingChart({ books, splitBefore, isRead, onChapter, mode, current, compact = false }: Props) {
  const split = splitBefore ? books.findIndex((b) => b.code === splitBefore) : -1;
  const columns = split > 0 ? [books.slice(0, split), books.slice(split)] : [books];
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-1", columns.length === 2 && "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
      {columns.map((column, index) => (
        <div key={index} className="min-w-0 space-y-[5px]">
          {column.map((book) => (
            <BookRow key={book.code} book={book} isRead={isRead} onChapter={onChapter} mode={mode} current={current} compact={compact} />
          ))}
        </div>
      ))}
    </div>
  );
}

function BookRow({ book, isRead, onChapter, mode, current, compact }: { book: ChartBook } & Omit<Props, "books" | "splitBefore">) {
  const colors = tone(toneOf(book.code, book.section));
  const startIndex = Math.max(0, current?.code === book.code ? book.chapters.indexOf(current.chapter) : 0);
  const [focusIndex, setFocusIndex] = useState(startIndex);
  const grid = useRef<HTMLDivElement>(null);
  const readCount = isRead ? book.chapters.filter((c) => isRead(book.code, c)).length : 0;

  // One tab stop per book; arrow keys move between its chapters (roving tabindex).
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const boxes = grid.current ? [...grid.current.querySelectorAll<HTMLButtonElement>("button")] : [];
    const perRow = boxes.length > 1 ? boxes.filter((b) => b.offsetTop === boxes[0].offsetTop).length : 1;
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: perRow, ArrowUp: -perRow };
    let next = index;
    if (event.key in moves) next = index + moves[event.key];
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = boxes.length - 1;
    else return;
    event.preventDefault();
    next = Math.min(boxes.length - 1, Math.max(0, next));
    setFocusIndex(next);
    boxes[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-[3px] sm:flex-row sm:items-start sm:gap-[3px]">
      <Link
        to={book.href}
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 px-2 font-sans font-bold tracking-tight transition hover:brightness-110 sm:w-[7.25rem]",
          compact ? "h-6 text-[11px]" : "h-[1.35rem] text-[12px] sm:h-[var(--box)]",
        )}
        style={{ background: colors.tab, color: colors.tabInk }}
      >
        <span className="truncate">{book.name}</span>
        {readCount > 0 && (
          <span className="text-[10px] font-semibold opacity-90" aria-label={`${readCount} of ${book.chapters.length} chapters read`}>
            {readCount}/{book.chapters.length}
          </span>
        )}
      </Link>
      <div
        ref={grid}
        role="group"
        aria-label={`${book.name} chapters`}
        className="grid min-w-0 gap-[2px]"
        style={{ gridTemplateColumns: "repeat(auto-fill, var(--box))", maxWidth: "calc(28 * (var(--box) + 2px))", flex: "1 1 auto" }}
      >
        {book.chapters.map((chapter, index) => {
          const read = isRead?.(book.code, chapter) ?? false;
          const here = current?.code === book.code && current.chapter === chapter;
          return (
            <button
              key={chapter}
              type="button"
              tabIndex={index === focusIndex ? 0 : -1}
              onClick={() => {
                setFocusIndex(index);
                onChapter(book.code, chapter);
              }}
              onKeyDown={(event) => onKeyDown(event, index)}
              aria-pressed={mode === "track" ? read : undefined}
              aria-current={here ? "page" : undefined}
              aria-label={`${book.name} ${chapter}${mode === "track" ? (read ? ", read" : ", not read") : read ? ", read" : ""}`}
              title={`${book.name} ${chapter}${read ? " — read" : ""}`}
              className={cn(
                "flex aspect-square w-[var(--box)] scroll-mt-28 scroll-mb-8 items-center justify-center rounded-[2px] font-sans leading-none transition-transform hover:z-10 hover:scale-125 focus-visible:z-10",
                compact ? "text-[9px]" : "text-[10px] lg:text-[9px]",
                here && "outline outline-2 outline-offset-1 outline-[var(--ink)]",
              )}
              style={{
                background: read ? colors.tab : colors.box,
                color: read ? colors.tabInk : "color-mix(in srgb, var(--ink) 80%, transparent)",
              }}
            >
              {read ? "✓" : chapter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
