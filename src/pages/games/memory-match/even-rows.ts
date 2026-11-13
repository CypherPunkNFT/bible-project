// The picture tiles' row layout (tiles.css), shared by Memory card match and Family charades.
import type { CSSProperties } from "react";

/** Columns that share the tiles out evenly over the fewest rows, at each width's most (3 on a phone, 4 on a tablet, 8
 *  from 900px): eight decks make one row, or two rows of four on a tablet (owner, 2026-11-13). The tiles keep one size. */
export function evenRows(count: number): CSSProperties {
  const even = (most: number) => Math.ceil(count / Math.ceil(count / most));
  return { "--mm-cols-s": even(3), "--mm-cols-m": even(4), "--mm-cols-l": even(8) } as CSSProperties;
}
