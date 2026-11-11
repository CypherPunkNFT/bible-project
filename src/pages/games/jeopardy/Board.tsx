// Bible Jeopardy's board on the stage (design 9.3, 14): category titles over five rows of value tiles. A grid for
// screen readers, with one tile in the tab order at a time; the stage's keys move between tiles (keys.ts) and focus
// comes back to the opened tile's place after each clue. Played tiles are empty, not just darker; the Daily Double's
// tile shows a small gold mark once played. At the start the titles drop in and the tiles fill column by column (the
// audit's item 7), decoration only. On a phone the board shows one category at a time: a row of chips (hidden on wider
// screens) chooses the column, and the other columns are hidden by the stylesheet (the audit's phone problem).
import { useEffect, useRef, type CSSProperties } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import type { Board as BoardData, Spot } from "./model";

interface Props {
  board: BoardData;
  played: boolean[][];
  focus: Spot;
  onFocus: (spot: Spot) => void;
  onOpen: (spot: Spot) => void;
  /** "Replay a tile" is on: a played tile can be clicked to reopen it. */
  replaying?: boolean;
  /** The titles drop in and the tiles fill, column by column (the first board of the night). */
  deal?: boolean;
  /** The tile just closed: its value fades out as the clue shrinks back into it. */
  closing?: Spot | null;
  /** Where the Daily Double was, shown once that tile has been played. */
  dailyDouble?: Spot | null;
}

/** A title's size class: long titles get a smaller font so they fit three lines (9.3). */
const titleSize = (title: string) => (title.length > 24 ? "is-long" : title.length > 14 ? "is-mid" : "");
const same = (a: Spot | null | undefined, col: number, row: number) => Boolean(a && a.col === col && a.row === row);

export function Board({ board, played, focus, onFocus, onOpen, replaying = false, deal = false, closing = null, dailyDouble = null }: Props) {
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    grid.current?.querySelector<HTMLButtonElement>(`[data-spot="${focus.col}-${focus.row}"]`)?.focus({ preventScroll: true });
  }, [focus.col, focus.row]);
  const rows = board.columns[0]?.tiles.length ?? 0;
  const off = (col: number) => (col === focus.col ? "" : " is-off");
  return <div className={`jp-board-wrap${deal ? " is-dealing" : ""}${replaying ? " is-replaying" : ""}`} style={{ "--jp-columns": board.columns.length } as CSSProperties}>
    <div className="jp-board-tabs" role="group" aria-label="Categories">
      {board.columns.map((column, col) => {
        const left = column.tiles.filter((_, row) => !played[col]?.[row]).length;
        return <button type="button" key={column.category} className={`jp-board-tab${col === focus.col ? " is-on" : ""}`} aria-pressed={col === focus.col}
          onClick={() => onFocus({ col, row: focus.row })}>
          <span className="jp-board-tab-title">{column.title}</span>
          <span className="jp-board-tab-left">{plural(left, "{n} left", "{n} left")}</span>
        </button>;
      })}
    </div>
    <div ref={grid} className="jp-board" role="grid" aria-label="Board">
      <div role="row" className="jp-board-heads">
        {board.columns.map((column, col) => <div role="columnheader" key={column.category} className={`jp-board-head ${titleSize(column.title)}${off(col)}`} style={{ "--jp-i": col } as CSSProperties}>{column.title}</div>)}
      </div>
      {Array.from({ length: rows }, (_, row) => <div role="row" key={row} className="jp-board-row">
        {board.columns.map((column, col) => {
          const tile = column.tiles[row];
          const done = played[col]?.[row] ?? false;
          const focused = focus.col === col && focus.row === row;
          const value = formatNumber(tile.value);
          const fading = done && same(closing, col, row);
          const marked = done && same(dailyDouble, col, row);
          return <div role="gridcell" key={column.category} className={off(col).trim() || undefined} style={{ "--jp-i": col, "--jp-r": row } as CSSProperties}>
            <button type="button" data-spot={`${col}-${row}`} className={`jp-tile${done ? " is-played" : ""}${fading ? " is-fading" : ""}${marked ? " is-dd" : ""}`} tabIndex={focused ? 0 : -1}
              aria-disabled={done && !replaying} aria-label={done ? `${column.title}, ${value}, played` : `${column.title}, ${value}, open`}
              onFocus={() => { if (!focused) onFocus({ col, row }); }} onClick={() => { if (!done || replaying) onOpen({ col, row }); }}>
              {done && !fading ? (marked ? <span className="jp-tile-dd" aria-hidden>DD</span> : "") : value}
            </button>
          </div>;
        })}
      </div>)}
    </div>
  </div>;
}
