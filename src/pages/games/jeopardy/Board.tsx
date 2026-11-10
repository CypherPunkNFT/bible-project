// Bible Jeopardy's board on the stage (design 9.3, 14): category titles over five rows of value tiles. A grid for
// screen readers, with one tile in the tab order at a time; the stage's keys move between tiles (keys.ts) and focus
// comes back to the opened tile's place after each clue. Played tiles are empty, not just darker.
import { useEffect, useRef, type CSSProperties } from "react";
import { formatNumber } from "@/lib/site-format";
import type { Board as BoardData, Spot } from "./model";

interface Props {
  board: BoardData;
  played: boolean[][];
  focus: Spot;
  onFocus: (spot: Spot) => void;
  onOpen: (spot: Spot) => void;
  /** "Replay a tile" is on: a played tile can be clicked to reopen it. */
  replaying?: boolean;
}

/** A title's size class: long titles get a smaller font so they fit three lines (9.3). */
const titleSize = (title: string) => (title.length > 24 ? "is-long" : title.length > 14 ? "is-mid" : "");

export function Board({ board, played, focus, onFocus, onOpen, replaying = false }: Props) {
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    grid.current?.querySelector<HTMLButtonElement>(`[data-spot="${focus.col}-${focus.row}"]`)?.focus({ preventScroll: true });
  }, [focus.col, focus.row]);
  const rows = board.columns[0]?.tiles.length ?? 0;
  return <div ref={grid} className="jp-board" role="grid" aria-label="Board" style={{ "--jp-columns": board.columns.length } as CSSProperties}>
    <div role="row" className="jp-board-heads">
      {board.columns.map((column) => <div role="columnheader" key={column.category} className={`jp-board-head ${titleSize(column.title)}`}>{column.title}</div>)}
    </div>
    {Array.from({ length: rows }, (_, row) => <div role="row" key={row} className="jp-board-row">
      {board.columns.map((column, col) => {
        const tile = column.tiles[row];
        const done = played[col]?.[row] ?? false;
        const focused = focus.col === col && focus.row === row;
        const value = formatNumber(tile.value);
        return <div role="gridcell" key={column.category}>
          <button type="button" data-spot={`${col}-${row}`} className={`jp-tile${done ? " is-played" : ""}`} tabIndex={focused ? 0 : -1}
            aria-disabled={done && !replaying} aria-label={done ? `${column.title}, ${value}, played` : `${column.title}, ${value}, open`}
            onFocus={() => { if (!focused) onFocus({ col, row }); }} onClick={() => { if (!done || replaying) onOpen({ col, row }); }}>
            {done ? "" : value}
          </button>
        </div>;
      })}
    </div>)}
  </div>;
}
