// The progress trail's marks (the audits' item 5) and the one rule for the right colour (the audits' cross-cutting
// fault: two games marked a right answer in lavender; the kit's default is green, red for wrong, amber for part marks).

/** One round's mark: not played yet, the one being played, right, wrong, or partly right (a star short, a near miss). */
export type TrailMark = "empty" | "current" | "right" | "wrong" | "part";

/** The squares a share grid writes for each mark; a game passes its own (Wordle's contrast squares) when it has one. */
export type TrailSquares = Partial<Record<TrailMark, string>>;

export const DEFAULT_SQUARES: Required<TrailSquares> = { right: "🟩", wrong: "🟥", part: "🟨", empty: "⬜", current: "⬜" };

/** The trail as one line of squares for a share text: marks not played are left out unless `keepEmpty` is set. */
export function trailText(marks: readonly TrailMark[], squares: TrailSquares = {}, keepEmpty = false): string {
  const table = { ...DEFAULT_SQUARES, ...squares };
  return marks.filter((mark) => keepEmpty || (mark !== "empty" && mark !== "current")).map((mark) => table[mark]).join("");
}

/** Marks for `total` rounds from the results so far: the next round is "current" while the game is still going. */
export function trailMarks(results: readonly Exclude<TrailMark, "empty" | "current">[], total: number, over = false): TrailMark[] {
  return Array.from({ length: Math.max(total, results.length) }, (_, i) =>
    results[i] ?? (i === results.length && !over ? "current" : "empty"));
}

/** The newest answered mark, the one that pops: the last that is not empty or current; -1 when none is. */
export const newestIndex = (marks: readonly TrailMark[]): number => {
  for (let i = marks.length - 1; i >= 0; i--) if (marks[i] !== "empty" && marks[i] !== "current") return i;
  return -1;
};
